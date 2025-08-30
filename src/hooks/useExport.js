import * as XLSX from 'xlsx'

const useExport = () => {
  const exportToHTML = async (duties, doctors, year, month) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ]
    
    // Group duties by date
    const dutiesByDate = {}
    duties.forEach(duty => {
      if (!dutiesByDate[duty.date]) {
        dutiesByDate[duty.date] = {}
      }
      if (!dutiesByDate[duty.date][duty.shift_type]) {
        dutiesByDate[duty.date][duty.shift_type] = []
      }
      dutiesByDate[duty.date][duty.shift_type].push(duty)
    })
    
    // Get doctor name function
    const getDoctorName = (doctorId) => {
      const doctor = doctors.find(d => d.id === doctorId)
      return doctor ? doctor.name : 'Bilinmeyen'
    }
    
    // Calculate statistics
    const doctorStats = {}
    duties.forEach(duty => {
      if (!doctorStats[duty.doctor_id]) {
        doctorStats[duty.doctor_id] = {
          total: 0,
          morning: 0,
          evening: 0,
          night: 0
        }
      }
      doctorStats[duty.doctor_id].total++
      doctorStats[duty.doctor_id][duty.shift_type]++
    })
    
    // Create HTML content
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hastane Nöbet Programı - ${months[month - 1]} ${year}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
          }
          .header h2 {
            color: #7f8c8d;
            margin: 10px 0 0 0;
            font-size: 18px;
          }
          .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .schedule-table th {
            background-color: #3498db;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          .schedule-table td {
            padding: 10px;
            border-bottom: 1px solid #e0e0e0;
          }
          .schedule-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .schedule-table tr:hover {
            background-color: #e3f2fd;
          }
          .shift-morning { color: #e67e22; font-weight: bold; }
          .shift-evening { color: #e74c3c; font-weight: bold; }
          .shift-night { color: #8e44ad; font-weight: bold; }
          .stats-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
          }
          .stats-table {
            width: 100%;
            border-collapse: collapse;
          }
          .stats-table th {
            background-color: #27ae60;
            color: white;
            padding: 10px;
            text-align: left;
          }
          .stats-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e0e0e0;
          }
          .stats-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-button:hover {
            background-color: #2980b9;
          }
          @media print {
            .print-button { display: none; }
            body { margin: 0; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">Yazdır</button>
        <div class="container">
          <div class="header">
            <h1>Hastane Nöbet Programı</h1>
            <h2>${months[month - 1]} ${year}</h2>
          </div>
          
          <table class="schedule-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Gün</th>
                <th>Sabah (08:00-16:00)</th>
                <th>Akşam (16:00-24:00)</th>
                <th>Gece (00:00-08:00)</th>
              </tr>
            </thead>
            <tbody>
    `
    
    // Sort dates and add data
    const sortedDates = Object.keys(dutiesByDate).sort()
    
    sortedDates.forEach(date => {
      const dayDuties = dutiesByDate[date]
      const dateObj = new Date(date)
      const dayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][dateObj.getDay()]
      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`
      
      const morningDoctors = dayDuties.morning ? dayDuties.morning.map(d => getDoctorName(d.doctor_id)).join(', ') : '-'
      const eveningDoctors = dayDuties.evening ? dayDuties.evening.map(d => getDoctorName(d.doctor_id)).join(', ') : '-'
      const nightDoctors = dayDuties.night ? dayDuties.night.map(d => getDoctorName(d.doctor_id)).join(', ') : '-'
      
      htmlContent += `
        <tr>
          <td>${formattedDate}</td>
          <td>${dayName}</td>
          <td class="shift-morning">${morningDoctors}</td>
          <td class="shift-evening">${eveningDoctors}</td>
          <td class="shift-night">${nightDoctors}</td>
        </tr>
      `
    })
    
    htmlContent += `
            </tbody>
          </table>
          
          <div class="stats-section">
            <h2>Nöbet İstatistikleri</h2>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Doktor</th>
                  <th>Toplam Nöbet</th>
                  <th>Sabah</th>
                  <th>Akşam</th>
                  <th>Gece</th>
                </tr>
              </thead>
              <tbody>
    `
    
    Object.entries(doctorStats).forEach(([doctorId, stats]) => {
      const doctorName = getDoctorName(doctorId)
      htmlContent += `
        <tr>
          <td>${doctorName}</td>
          <td>${stats.total}</td>
          <td>${stats.morning}</td>
          <td>${stats.evening}</td>
          <td>${stats.night}</td>
        </tr>
      `
    })
    
    htmlContent += `
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Create and download HTML file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nobet-programi-${months[month - 1]}-${year}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  const exportToExcel = async (duties, doctors, year, month) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ]
    
    // Get doctor name function
    const getDoctorName = (doctorId) => {
      const doctor = doctors.find(d => d.id === doctorId)
      return doctor ? doctor.name : 'Bilinmeyen'
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Schedule sheet
    const scheduleData = []
    
    // Group duties by date
    const dutiesByDate = {}
    duties.forEach(duty => {
      if (!dutiesByDate[duty.date]) {
        dutiesByDate[duty.date] = {}
      }
      if (!dutiesByDate[duty.date][duty.shift_type]) {
        dutiesByDate[duty.date][duty.shift_type] = []
      }
      dutiesByDate[duty.date][duty.shift_type].push(duty)
    })
    
    // Headers
    scheduleData.push(['Tarih', 'Gün', 'Sabah (08:00-16:00)', 'Akşam (16:00-24:00)', 'Gece (00:00-08:00)'])
    
    // Sort dates and add data
    const sortedDates = Object.keys(dutiesByDate).sort()
    
    sortedDates.forEach(date => {
      const dayDuties = dutiesByDate[date]
      const dateObj = new Date(date)
      const dayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][dateObj.getDay()]
      const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`
      
      const morningDoctors = dayDuties.morning ? dayDuties.morning.map(d => getDoctorName(d.doctor_id)).join(', ') : ''
      const eveningDoctors = dayDuties.evening ? dayDuties.evening.map(d => getDoctorName(d.doctor_id)).join(', ') : ''
      const nightDoctors = dayDuties.night ? dayDuties.night.map(d => getDoctorName(d.doctor_id)).join(', ') : ''
      
      scheduleData.push([formattedDate, dayName, morningDoctors, eveningDoctors, nightDoctors])
    })
    
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData)
    XLSX.utils.book_append_sheet(wb, scheduleSheet, 'Nöbet Programı')
    
    // Statistics sheet
    const statsData = []
    statsData.push(['Doktor', 'Toplam Nöbet', 'Sabah', 'Akşam', 'Gece'])
    
    // Calculate statistics
    const doctorStats = {}
    duties.forEach(duty => {
      if (!doctorStats[duty.doctor_id]) {
        doctorStats[duty.doctor_id] = {
          total: 0,
          morning: 0,
          evening: 0,
          night: 0
        }
      }
      doctorStats[duty.doctor_id].total++
      doctorStats[duty.doctor_id][duty.shift_type]++
    })
    
    Object.entries(doctorStats).forEach(([doctorId, stats]) => {
      const doctorName = getDoctorName(doctorId)
      statsData.push([doctorName, stats.total, stats.morning, stats.evening, stats.night])
    })
    
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData)
    XLSX.utils.book_append_sheet(wb, statsSheet, 'İstatistikler')
    
    // Doctor list sheet
    const doctorData = []
    doctorData.push(['Doktor Adı', 'Branş', '24 Saat Nöbet Hakkı', '16 Saat Nöbet Hakkı', 'Mavi Gün İzni'])
    
    doctors.forEach(doctor => {
      doctorData.push([
        doctor.name,
        doctor.specialty,
        doctor.duty_rights_24h,
        doctor.duty_rights_16h,
        doctor.blue_day_permission ? 'Var' : 'Yok'
      ])
    })
    
    const doctorSheet = XLSX.utils.aoa_to_sheet(doctorData)
    XLSX.utils.book_append_sheet(wb, doctorSheet, 'Doktor Listesi')
    
    // Save Excel file
    const fileName = `nobet-programi-${months[month - 1]}-${year}.xlsx`
    XLSX.writeFile(wb, fileName)
  }
  
  return {
    exportToHTML,
    exportToExcel
  }
}

export { useExport }

