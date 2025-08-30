import { useIndexedDB } from './useIndexedDB.js'

const useDutyScheduler = () => {
  const { getRedDays, getSpecialAssignments } = useIndexedDB()

  // Dinamik nöbet hesaplama fonksiyonu
  const calculateDutyRequirements = (doctors, year, month, settings = null) => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const doctorCount = doctors.length
    
    if (doctorCount === 0) return { duty_24h: 0, duty_16h: 0, morning: 0, evening: 0, night: 0 }
    
    // Dinamik hesaplama aktif mi?
    if (settings?.duty_requirements?.dynamic_calculation) {
      // Aylık günlük nöbetçi sayısını al (varsayılan genel ayar)
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      const currentMonth = monthNames[month - 1] // month 1-12, array 0-11
      const monthlyDutyCount = settings?.duty_requirements?.monthly_daily_duty_count?.[currentMonth]
      const dailyDutyCount = monthlyDutyCount || settings?.duty_requirements?.daily_duty_count || 4
      
      // Dinamik hesaplama
      // Günlük nöbetçi sayısı × 24 saat = toplam günlük saat
      // Ancak 16 saatlik nöbetçiler sadece gündüz çalışır (08:00-00:00)
      const totalHoursPerDay = dailyDutyCount * 24 // Günlük toplam saat (4 kişi × 24 saat = 96 saat)
      const totalHoursPerMonth = daysInMonth * totalHoursPerDay // Aylık toplam saat
      const hoursPerDoctor = totalHoursPerMonth / doctorCount // Doktor başına düşen saat

      console.log(`Dinamik Hesaplama: ${daysInMonth} gün, ${doctorCount} doktor, günlük ${dailyDutyCount} nöbetçi`)
      console.log(`Günlük toplam: ${totalHoursPerDay} saat, Aylık toplam: ${totalHoursPerMonth} saat`)
      console.log(`Doktor başına: ${hoursPerDoctor} saat`)

      // 24 saatlik nöbet sayısı
      const duty24hPerDoctor = Math.floor(hoursPerDoctor / 24)
      const remainingHours = hoursPerDoctor - (duty24hPerDoctor * 24)
      
      // 16 saatlik nöbet sayısı
      const duty16hPerDoctor = Math.floor(remainingHours / 16)
      const finalRemainingHours = remainingHours - (duty16hPerDoctor * 16)
      
      // 8 saatlik nöbet sayısı
      const duty8hPerDoctor = Math.ceil(finalRemainingHours / 8)

      console.log(`Sonuç: 24h=${duty24hPerDoctor}, 16h=${duty16hPerDoctor}, 8h=${duty8hPerDoctor}`)

      // Toplam nöbet saatleri
      const totalDuty24h = duty24hPerDoctor * doctorCount
      const totalDuty16h = duty16hPerDoctor * doctorCount
      const totalDuty8h = duty8hPerDoctor * doctorCount
      
      // Günlük vardiya sayıları
      const dailyShifts = {
        duty_24h: Math.ceil(totalDuty24h / daysInMonth),
        duty_16h: Math.ceil(totalDuty16h / daysInMonth),
        morning: Math.ceil(totalDuty8h * 0.4 / daysInMonth),  // %40 sabah
        evening: Math.ceil(totalDuty8h * 0.35 / daysInMonth), // %35 akşam
        night: Math.ceil(totalDuty8h * 0.25 / daysInMonth)    // %25 gece
      }
      
      return {
        requirements: dailyShifts,
        perDoctor: {
          duty_24h: duty24hPerDoctor,
          duty_16h: duty16hPerDoctor,
          duty_8h: duty8hPerDoctor,
          total_8h: duty8hPerDoctor
        },
        total: {
          duty_24h: totalDuty24h,
          duty_16h: totalDuty16h,
          duty_8h: totalDuty8h,
          total_8h: totalDuty8h,
          remaining_hours: finalRemainingHours
        }
      }
    }
    
          // Sabit değerler kullan (eski sistem)
      const duty24hPerDoctor = settings?.duty_requirements?.duty_24h_per_doctor || 6
      const duty16hPerDoctor = settings?.duty_requirements?.duty_16h_per_doctor || 2
      const duty8hPerDoctor = settings?.duty_requirements?.enable_8h_duties ? (settings?.duty_requirements?.duty_8h_per_doctor || 0) : 0
      
      // Günlük nöbet sayıları
      const autoFill8h = settings?.duty_requirements?.auto_fill_8h || false
    
    // Toplam nöbet saatleri
    const totalDuty24h = duty24hPerDoctor * doctorCount
    const totalDuty16h = duty16hPerDoctor * doctorCount
    
    // Toplam nöbet saatleri hesaplama
    const totalRequiredHours = daysInMonth * 24 // Günlük 24 saat nöbet gerekli
    
    // 24 ve 16 saatlik nöbetlerin toplam saati
    const totalFixedHours = (totalDuty24h * 24) + (totalDuty16h * 16)
    
    // Kalan saatler için 8 saatlik vardiyalar (sadece auto_fill aktifse)
    let totalExtra8hShifts = 0
    let remainingHours = 0
    if (autoFill8h) {
      remainingHours = Math.max(0, totalRequiredHours - totalFixedHours)
      totalExtra8hShifts = Math.ceil(remainingHours / 8)
    }
    
    // Toplam 8 saatlik vardiyalar (sabit + ek)
    const total8hShifts = duty8hPerDoctor * doctorCount + totalExtra8hShifts
    
    // 8 saatlik vardiyaların dağılımı
    const morningShifts = Math.ceil(total8hShifts * 0.4)  // %40 sabah
    const eveningShifts = Math.ceil(total8hShifts * 0.35) // %35 akşam
    const nightShifts = Math.ceil(total8hShifts * 0.25)   // %25 gece
    
    // Günlük vardiya sayıları
    const dailyShifts = {
      duty_24h: Math.ceil(totalDuty24h / daysInMonth),
      duty_16h: Math.ceil(totalDuty16h / daysInMonth),
      morning: Math.ceil(morningShifts / daysInMonth),
      evening: Math.ceil(eveningShifts / daysInMonth),
      night: Math.ceil(nightShifts / daysInMonth)
    }
    
    return {
      requirements: dailyShifts,
      perDoctor: {
        duty_24h: duty24hPerDoctor,
        duty_16h: duty16hPerDoctor,
        duty_8h: duty8hPerDoctor,
        total_8h: Math.ceil(total8hShifts / doctorCount)
      },
      total: {
        duty_24h: totalDuty24h,
        duty_16h: totalDuty16h,
        duty_8h: duty8hPerDoctor * doctorCount,
        total_8h: total8hShifts,
        remaining_hours: remainingHours
      }
    }
  }

  const generateMonthlySchedule = async (doctors, year, month, settings = null) => {
    if (!doctors || doctors.length === 0) {
      throw new Error('Doktor listesi boş!')
    }

    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate()
    const schedule = []

    // Dinamik vardiya gereksinimleri hesaplama - ÖNCE YAPILMALI
    const dutyCalculation = calculateDutyRequirements(doctors, year, month, settings)

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
          remainingDuties24h: dutyCalculation.perDoctor.duty_24h,
          remainingDuties16h: dutyCalculation.perDoctor.duty_16h,
          remainingDuties8h: dutyCalculation.perDoctor.total_8h,
          lastDutyDate: null,
          dutyDates: [] // Track all duty dates for gün aşırı rule
        }
      })
    )

    // Generate schedule for each day
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`

      // Check if it's a blue day (weekend)
      const date = new Date(year, month - 1, day)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6 // Sunday or Saturday

      // Günlük nöbet sayıları (ayarlardan al)
      const daily24hCount = settings?.duty_requirements?.daily_24h_count || 3
      const daily16hCount = settings?.duty_requirements?.daily_16h_count || 1
      const autoFill8h = settings?.duty_requirements?.auto_fill_8h || false
      const sameDayRest = settings?.duty_requirements?.same_day_rest || false

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
          if (shiftType === 'duty_24h') {
            doctor.remainingDuties24h = Math.max(0, doctor.remainingDuties24h - 1)
          } else if (shiftType === 'duty_16h') {
            doctor.remainingDuties16h = Math.max(0, doctor.remainingDuties16h - 1)
          } else {
            doctor.remainingDuties8h = Math.max(0, doctor.remainingDuties8h - 1)
          }
          doctor.lastDutyDate = dateStr
          doctor.dutyDates.push(dateStr)
        }
      })

      // Add special assignments to schedule
      schedule.push(...daySpecialAssignments)

      // Günlük nöbet gereksinimleri - 24 saat tamamen doldurulmalı
      // 16 saatlik nöbet 00:00'da biter, 00:00-08:00 arası sadece 24 saatlik nöbetçiler kalır
      const total24hHours = daily24hCount * 24
      const total16hHours = daily16hCount * 16
      
      // 00:00-08:00 arası (8 saat) sadece 24 saatlik nöbetçiler var
      // const nightHours = 8
      const dayHours = 16
      
      // Günlük toplam nöbetçi saati hesaplama
      const totalDutyHours = (daily24hCount * 24) + (daily16hCount * dayHours) // 16h nöbetçiler sadece gündüz
      const remainingHours = 24 - totalDutyHours
      
      // Eğer toplam saat 24'ü aşıyorsa uyarı ver
      if (remainingHours < 0) {
        console.warn(`Warning: Daily hours exceed 24! 24h: ${total24hHours}, 16h: ${total16hHours}, Total: ${totalDutyHours}`)
      }
      
      // Kalan saatleri 8 saatlik vardiyalarla doldur (minimum 0)
      const total8hShifts = Math.max(0, Math.ceil(remainingHours / 8))
      const morningShifts = Math.ceil(total8hShifts * 0.4)  // %40 sabah
      const eveningShifts = Math.ceil(total8hShifts * 0.35) // %35 akşam
      const nightShifts = Math.ceil(total8hShifts * 0.25)   // %25 gece
      
      // Eğer toplam vardiya sayısı hesaplanan sayıdan farklıysa, farkı gece vardiyasına ekle
      const calculatedTotal = morningShifts + eveningShifts + nightShifts
      const difference = total8hShifts - calculatedTotal
      let finalNightShifts = nightShifts
      if (difference > 0) {
        finalNightShifts += difference
      }
      
      const dailyRequirements = {
        duty_24h: daily24hCount,
        duty_16h: daily16hCount,
        morning: autoFill8h ? morningShifts : 0,
        evening: autoFill8h ? eveningShifts : 0,
        night: autoFill8h ? finalNightShifts : 0
      }

      // Calculate remaining requirements after special assignments
      const remainingRequirements = { ...dailyRequirements }
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
          daySpecialAssignments.map(a => a.doctor_id),
          sameDayRest
        )

        assignedDoctors.forEach(doctorId => {
          // 24 saatlik nöbet için özel mantık
          if (shiftType === 'duty_24h') {
            // 24 saatlik nöbet ertesi güne kadar sürer
            const startDate = new Date(dateStr)
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + 1)
            const endDateStr = endDate.toISOString().split('T')[0]
            
            schedule.push({
              doctor_id: doctorId,
              shift_type: shiftType,
              date: dateStr,
              end_date: endDateStr,
              year_month: yearMonth,
              is_special: false,
              duration: 24
            })
          } else if (shiftType === 'duty_16h') {
            // 16 saatlik nöbet aynı gün içinde biter
            schedule.push({
              doctor_id: doctorId,
              shift_type: shiftType,
              date: dateStr,
              year_month: yearMonth,
              is_special: false,
              duration: 16
            })
          } else {
            schedule.push({
              doctor_id: doctorId,
              shift_type: shiftType,
              date: dateStr,
              year_month: yearMonth,
              is_special: false,
              duration: shiftType === 'night' ? 8 : 8
            })
          }

          // Update doctor's remaining duties and last duty date
          const doctor = doctorConstraints.find(d => d.id === doctorId)
          if (doctor) {
            if (shiftType === 'duty_24h') {
              doctor.remainingDuties24h = Math.max(0, doctor.remainingDuties24h - 1)
              // 24 saatlik nöbet sonrası ertesi gün nöbet tutamaz
              const nextDay = new Date(dateStr)
              nextDay.setDate(nextDay.getDate() + 1)
              doctor.lastDutyDate = nextDay.toISOString().split('T')[0]
            } else if (shiftType === 'duty_16h') {
              doctor.remainingDuties16h = Math.max(0, doctor.remainingDuties16h - 1)
              // 16 saatlik nöbet sonrası ertesi gün nöbet tutamaz
              const nextDay = new Date(dateStr)
              nextDay.setDate(nextDay.getDate() + 1)
              doctor.lastDutyDate = nextDay.toISOString().split('T')[0]
            } else {
              // 8 saatlik vardiyalar (morning, evening, night)
              doctor.remainingDuties8h = Math.max(0, doctor.remainingDuties8h - 1)
              doctor.lastDutyDate = dateStr
            }
            doctor.dutyDates.push(dateStr)
          }
        })
      }
    }

    return schedule
  }

  const assignShift = (doctorConstraints, shiftType, dateStr, requiredCount, isWeekend, excludedDoctorIds, sameDayRest = false) => {
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
      let hasRemainingDuties = false
      if (shiftType === 'duty_24h') {
        hasRemainingDuties = doctor.remainingDuties24h > 0
      } else if (shiftType === 'duty_16h') {
        hasRemainingDuties = doctor.remainingDuties16h > 0
      } else {
        hasRemainingDuties = doctor.remainingDuties8h > 0
      }

      if (!hasRemainingDuties) return false

      // Check consecutive duty rule - Gün aşırı nöbet tutabilir (1-3-5-7 gibi)
      if (doctor.lastDutyDate) {
        const lastDate = new Date(doctor.lastDutyDate)
        const currentDate = new Date(dateStr)
        const dayDifference = Math.abs((currentDate - lastDate) / (1000 * 60 * 60 * 24))
        
        if (dayDifference < 1) return false // No consecutive duties
      }

      // Aynı gün nöbet tutanlar ertesi gün nöbet almaz kuralı
      if (sameDayRest && doctor.dutyDates.length > 0) {
        const lastDutyDate = doctor.dutyDates[doctor.dutyDates.length - 1]
        const lastDate = new Date(lastDutyDate)
        const currentDate = new Date(dateStr)
        const dayDifference = Math.abs((currentDate - lastDate) / (1000 * 60 * 60 * 24))
        
        if (dayDifference === 1) return false // Ertesi gün nöbet alamaz
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
      let aDuties = 0
      let bDuties = 0
      
      if (shiftType === 'duty_24h') {
        aDuties = a.remainingDuties24h
        bDuties = b.remainingDuties24h
      } else if (shiftType === 'duty_16h') {
        aDuties = a.remainingDuties16h
        bDuties = b.remainingDuties16h
      } else {
        aDuties = a.remainingDuties8h
        bDuties = b.remainingDuties8h
      }
      
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

