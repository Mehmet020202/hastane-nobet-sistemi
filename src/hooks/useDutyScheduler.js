import { useIndexedDB } from './useIndexedDB.js'

const useDutyScheduler = () => {
  const { getRedDays, getSpecialAssignments } = useIndexedDB()

  const generateMonthlySchedule = async (doctors, year, month) => {
    if (!doctors || doctors.length === 0) {
      throw new Error('Doktor listesi boş!')
    }

    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate()
    const schedule = []

    // Load doctor constraints
    const doctorConstraints = await Promise.all(
      doctors.map(async (doctor) => {
        const redDays = await getRedDays(doctor.id)
        const specialAssignments = await getSpecialAssignments(doctor.id)
        return {
          ...doctor,
          redDays: redDays || [],
          blueDays: doctor.blue_days || [],
          specialAssignments: specialAssignments || {},
          remainingDuties24h: doctor.duty_rights_24h || 6,
          remainingDuties16h: doctor.duty_rights_16h || 2,
          lastDutyDate: null,
          dutyDates: [] // Track all duty dates for gün aşırı rule
        }
      })
    )

    // Shift requirements per day
    const shiftRequirements = {
      morning: 4,   // 08:00-16:00 (8 hours)
      evening: 4,   // 16:00-24:00 (8 hours)
      night: 3      // 00:00-08:00 (8 hours)
    }

    // Generate schedule for each day
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`

      // Check if it's a blue day (weekend)
      const date = new Date(year, month - 1, day)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6 // Sunday or Saturday

      // Process special assignments first
      const daySpecialAssignments = []
      doctorConstraints.forEach(doctor => {
        if (doctor.specialAssignments[dateStr]) {
          const shiftType = doctor.specialAssignments[dateStr]
          daySpecialAssignments.push({
            doctor_id: doctor.id,
            shift_type: shiftType,
            date: dateStr,
            year_month: yearMonth,
            is_special: true
          })
          
          // Update doctor's remaining duties
          if (shiftType === 'night') {
            doctor.remainingDuties16h = Math.max(0, doctor.remainingDuties16h - 1)
          } else {
            doctor.remainingDuties24h = Math.max(0, doctor.remainingDuties24h - 1)
          }
          doctor.lastDutyDate = dateStr
        }
      })

      // Add special assignments to schedule
      schedule.push(...daySpecialAssignments)

      // Calculate remaining requirements after special assignments
      const remainingRequirements = { ...shiftRequirements }
      daySpecialAssignments.forEach(assignment => {
        remainingRequirements[assignment.shift_type] = Math.max(0, remainingRequirements[assignment.shift_type] - 1)
      })

      // Assign remaining shifts
      for (const [shiftType, requiredCount] of Object.entries(remainingRequirements)) {
        if (requiredCount === 0) continue

        const assignedDoctors = assignShift(
          doctorConstraints,
          shiftType,
          dateStr,
          requiredCount,
          isWeekend,
          daySpecialAssignments.map(a => a.doctor_id)
        )

        assignedDoctors.forEach(doctorId => {
          schedule.push({
            doctor_id: doctorId,
            shift_type: shiftType,
            date: dateStr,
            year_month: yearMonth,
            is_special: false
          })

          // Update doctor's remaining duties and last duty date
          const doctor = doctorConstraints.find(d => d.id === doctorId)
          if (doctor) {
            if (shiftType === 'night') {
              doctor.remainingDuties16h = Math.max(0, doctor.remainingDuties16h - 1)
            } else {
              doctor.remainingDuties24h = Math.max(0, doctor.remainingDuties24h - 1)
            }
            doctor.lastDutyDate = dateStr
            doctor.dutyDates.push(dateStr)
          }
        })
      }
    }

    return schedule
  }

  const assignShift = (doctorConstraints, shiftType, dateStr, requiredCount, isWeekend, excludedDoctorIds) => {
    const availableDoctors = doctorConstraints.filter(doctor => {
      // Exclude doctors already assigned for this day
      if (excludedDoctorIds.includes(doctor.id)) return false

      // Check red days - Kırmızı günlerde kesinlikle nöbet yazılmaz
      if (doctor.redDays.includes(dateStr)) return false

      // Check blue days - Mavi gün seçilen doktorlar kesinlikle o gün nöbet tutmalı
      const isBlueDayForDoctor = doctor.blueDays.includes(dateStr)
      if (isBlueDayForDoctor) {
        // Mavi gün seçilmişse, bu doktor kesinlikle o gün nöbet tutacak
        return true
      }

      // Check if doctor has remaining duties
      const hasRemainingDuties = shiftType === 'night' 
        ? doctor.remainingDuties16h > 0 
        : doctor.remainingDuties24h > 0

      if (!hasRemainingDuties) return false

      // Check consecutive duty rule - Gün aşırı nöbet tutabilir (1-3-5-7 gibi)
      if (doctor.lastDutyDate) {
        const lastDate = new Date(doctor.lastDutyDate)
        const currentDate = new Date(dateStr)
        const dayDifference = Math.abs((currentDate - lastDate) / (1000 * 60 * 60 * 24))
        
        if (dayDifference < 1) return false // No consecutive duties
      }

      return true
    })

    // Sort doctors by priority
    availableDoctors.sort((a, b) => {
      // Mavi gün seçilen doktorlar öncelikli
      const aIsBlueDay = a.blueDays.includes(dateStr)
      const bIsBlueDay = b.blueDays.includes(dateStr)
      
      if (aIsBlueDay && !bIsBlueDay) return -1
      if (!aIsBlueDay && bIsBlueDay) return 1
      
      // Sonra kalan nöbet hakkı fazla olanlar
      const aDuties = shiftType === 'night' ? a.remainingDuties16h : a.remainingDuties24h
      const bDuties = shiftType === 'night' ? b.remainingDuties16h : b.remainingDuties24h
      return bDuties - aDuties
    })

    // Select required number of doctors
    const selectedDoctors = availableDoctors.slice(0, requiredCount)
    
    if (selectedDoctors.length < requiredCount) {
      console.warn(`Warning: Could not assign enough doctors for ${shiftType} shift on ${dateStr}. Required: ${requiredCount}, Assigned: ${selectedDoctors.length}`)
    }

    return selectedDoctors.map(doctor => doctor.id)
  }

  const validateSchedule = (schedule, doctors) => {
    const issues = []
    const doctorStats = {}

    // Initialize doctor stats
    doctors.forEach(doctor => {
      doctorStats[doctor.id] = {
        name: doctor.name,
        totalDuties: 0,
        morningDuties: 0,
        eveningDuties: 0,
        nightDuties: 0,
        consecutiveDuties: []
      }
    })

    // Analyze schedule
    schedule.forEach(duty => {
      const stats = doctorStats[duty.doctor_id]
      if (stats) {
        stats.totalDuties++
        stats[`${duty.shift_type}Duties`]++
      }
    })

    // Check for consecutive duties
    const sortedSchedule = schedule.sort((a, b) => new Date(a.date) - new Date(b.date))
    const doctorLastDuty = {}

    sortedSchedule.forEach(duty => {
      const lastDuty = doctorLastDuty[duty.doctor_id]
      if (lastDuty) {
        const lastDate = new Date(lastDuty.date)
        const currentDate = new Date(duty.date)
        const dayDifference = (currentDate - lastDate) / (1000 * 60 * 60 * 24)
        
        if (dayDifference === 1) {
          issues.push({
            type: 'consecutive_duty',
            doctor_id: duty.doctor_id,
            dates: [lastDuty.date, duty.date],
            message: `${doctorStats[duty.doctor_id].name} has consecutive duties on ${lastDuty.date} and ${duty.date}`
          })
        }
      }
      doctorLastDuty[duty.doctor_id] = duty
    })

    // Check duty distribution fairness
    const totalDuties = schedule.length
    const averageDuties = totalDuties / doctors.length
    const tolerance = 2 // Allow 2 duty difference

    Object.entries(doctorStats).forEach(([doctorId, stats]) => {
      if (Math.abs(stats.totalDuties - averageDuties) > tolerance) {
        issues.push({
          type: 'unfair_distribution',
          doctor_id: doctorId,
          actual: stats.totalDuties,
          expected: Math.round(averageDuties),
          message: `${stats.name} has ${stats.totalDuties} duties, expected around ${Math.round(averageDuties)}`
        })
      }
    })

    return {
      isValid: issues.length === 0,
      issues,
      statistics: doctorStats
    }
  }

  return {
    generateMonthlySchedule,
    validateSchedule
  }
}

export { useDutyScheduler }

