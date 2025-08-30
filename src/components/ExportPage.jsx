import { useState, useEffect, useCallback } from 'react'
import { Download, FileText, Table, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { useIndexedDB } from '../hooks/useIndexedDB.js'
import { useExport } from '../hooks/useExport.js'

const ExportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [duties, setDuties] = useState([])
  const [doctors, setDoctors] = useState([])
  const [isExporting, setIsExporting] = useState(false)

  const { getDoctors, getDuties } = useIndexedDB()
  const { exportToHTML, exportToExcel } = useExport()

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear, loadData])

  const loadData = useCallback(async () => {
    try {
      const [doctorList, dutyList] = await Promise.all([
        getDoctors(),
        getDuties(selectedYear, selectedMonth + 1)
      ])
      setDoctors(doctorList)
      setDuties(dutyList)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [getDoctors, getDuties, selectedYear, selectedMonth])

  const handleExportHTML = async () => {
    setIsExporting(true)
    try {
      await exportToHTML(duties, doctors, selectedYear, selectedMonth + 1)
    } catch (error) {
      console.error('Error exporting HTML:', error)
      alert('HTML dışa aktarılırken hata oluştu!')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await exportToExcel(duties, doctors, selectedYear, selectedMonth + 1)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Excel dışa aktarılırken hata oluştu!')
    } finally {
      setIsExporting(false)
    }
  }

  const getStatistics = () => {
    const stats = {
      totalDuties: duties.length,
      doctorStats: {},
      shiftStats: {
        morning: 0,
        evening: 0,
        night: 0
      }
    }

    duties.forEach(duty => {
      // Doctor statistics
      if (!stats.doctorStats[duty.doctor_id]) {
        stats.doctorStats[duty.doctor_id] = {
          total: 0,
          morning: 0,
          evening: 0,
          night: 0
        }
      }
      stats.doctorStats[duty.doctor_id].total++
      stats.doctorStats[duty.doctor_id][duty.shift_type]++

      // Shift statistics
      stats.shiftStats[duty.shift_type]++
    })

    return stats
  }

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId)
    return doctor ? doctor.name : 'Bilinmeyen'
  }

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i)
  const statistics = getStatistics()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dışa Aktarma</h2>
          <p className="text-muted-foreground">Nöbet programını PDF veya Excel formatında indirin</p>
        </div>
      </div>

      {/* Dönem Seçimi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Dönem Seçimi
          </CardTitle>
          <CardDescription>
            Dışa aktarılacak ay ve yılı seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ay</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yıl</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Dönem İstatistikleri
          </CardTitle>
          <CardDescription>
            {months[selectedMonth]} {selectedYear} dönemi nöbet istatistikleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{statistics.totalDuties}</div>
              <div className="text-sm text-muted-foreground">Toplam Nöbet</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{doctors.length}</div>
              <div className="text-sm text-muted-foreground">Aktif Doktor</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {statistics.totalDuties > 0 ? Math.round(statistics.totalDuties / doctors.length) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Ortalama Nöbet/Doktor</div>
            </div>
          </div>

          {/* Vardiya İstatistikleri */}
          <div className="space-y-4">
            <h4 className="font-semibold">Vardiya Dağılımı</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">Sabah</span>
                <Badge variant="secondary">{statistics.shiftStats.morning}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="font-medium">Akşam</span>
                <Badge variant="secondary">{statistics.shiftStats.evening}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Gece</span>
                <Badge variant="secondary">{statistics.shiftStats.night}</Badge>
              </div>
            </div>
          </div>

          {/* Doktor İstatistikleri */}
          {Object.keys(statistics.doctorStats).length > 0 && (
            <div className="space-y-4 mt-6">
              <h4 className="font-semibold">Doktor Bazlı Dağılım</h4>
              <div className="space-y-2">
                {Object.entries(statistics.doctorStats).map(([doctorId, stats]) => (
                  <div key={doctorId} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{getDoctorName(doctorId)}</span>
                    <div className="flex space-x-2">
                      <Badge variant="outline">Toplam: {stats.total}</Badge>
                      <Badge variant="secondary">S: {stats.morning}</Badge>
                      <Badge variant="secondary">A: {stats.evening}</Badge>
                      <Badge variant="secondary">G: {stats.night}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dışa Aktarma Seçenekleri */}
      <Card>
        <CardHeader>
          <CardTitle>Dışa Aktarma Seçenekleri</CardTitle>
          <CardDescription>
            Nöbet programını farklı formatlarda indirin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">HTML Formatı</h3>
                    <p className="text-sm text-muted-foreground">
                      Web formatı, yazdırılabilir ve paylaşılabilir
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={handleExportHTML}
                  disabled={isExporting || duties.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  HTML İndir
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Table className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Excel Formatı</h3>
                    <p className="text-sm text-muted-foreground">
                      Düzenlenebilir format, analiz ve hesaplamalar için
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={handleExportExcel}
                  disabled={isExporting || duties.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Excel İndir
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {duties.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nöbet programı bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              Seçilen dönem için nöbet programı oluşturulmamış
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ExportPage

