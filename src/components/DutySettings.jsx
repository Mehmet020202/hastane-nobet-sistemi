import { useState, useEffect } from 'react'
import { Save, Calendar, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { useIndexedDB } from '../hooks/useIndexedDB.js'

const DutySettings = () => {
  const [settings, setSettings] = useState({
    schedule_type: 'monthly', // weekly, bi-weekly, monthly
    shifts: {
      morning: { start: '08:00', end: '16:00', count: 4 },
      evening: { start: '16:00', end: '24:00', count: 4 },
      night: { start: '00:00', end: '08:00', count: 3 }
    },
    rules: {
      no_consecutive_duties: true,
      equal_distribution: true,
      respect_red_days: true,
      respect_blue_days: true,
      alternate_day_duty: true, // Gün aşırı nöbet kuralı
      allow_monthly_changes: true, // Ay içinde değişiklik yapılabilir
      allow_shift_swaps: true // Vardiya değişimi yapılabilir
    },
    notifications: {
      schedule_generated: true,
      duty_reminders: true,
      conflict_alerts: true
    },
    export: {
      include_doctor_info: true,
      include_statistics: true,
      pdf_format: 'A4',
      excel_format: 'xlsx'
    }
  })

  const { getSettings, saveSettings } = useIndexedDB()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await getSettings()
      if (savedSettings) {
        setSettings(savedSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSave = async () => {
    try {
      await saveSettings(settings)
      alert('Ayarlar başarıyla kaydedildi!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ayarlar kaydedilirken hata oluştu!')
    }
  }

  const updateShift = (shiftType, field, value) => {
    setSettings(prev => ({
      ...prev,
      shifts: {
        ...prev.shifts,
        [shiftType]: {
          ...prev.shifts[shiftType],
          [field]: value
        }
      }
    }))
  }

  const updateRule = (rule, value) => {
    setSettings(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [rule]: value
      }
    }))
  }

  const updateNotification = (notification, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [notification]: value
      }
    }))
  }

  const updateExport = (exportSetting, value) => {
    setSettings(prev => ({
      ...prev,
      export: {
        ...prev.export,
        [exportSetting]: value
      }
    }))
  }

  const updateScheduleType = (value) => {
    setSettings(prev => ({
      ...prev,
      schedule_type: value
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sistem Ayarları</h2>
          <p className="text-muted-foreground">Nöbet sistemi ayarlarını yapılandırın</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Ayarları Kaydet
        </Button>
      </div>

      {/* Program Türü Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Program Türü
          </CardTitle>
          <CardDescription>
            Nöbet programının hazırlanma periyodunu belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Program Periyodu</Label>
            <select 
              className="w-full p-2 border rounded-md"
              value={settings.schedule_type}
              onChange={(e) => updateScheduleType(e.target.value)}
            >
              <option value="weekly">Haftalık (7 gün)</option>
              <option value="bi-weekly">2 Haftalık (14 gün)</option>
              <option value="monthly">Aylık (28-31 gün)</option>
            </select>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {settings.schedule_type === 'weekly' && 'Nöbet programı her hafta yeniden oluşturulur (7 gün)'}
              {settings.schedule_type === 'bi-weekly' && 'Nöbet programı iki haftada bir oluşturulur (14 gün)'}
              {settings.schedule_type === 'monthly' && 'Nöbet programı aylık olarak oluşturulur (28-31 gün)'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vardiya Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Vardiya Ayarları
          </CardTitle>
          <CardDescription>
            Nöbet vardiyalarının saatlerini ve doktor sayılarını belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(settings.shifts).map(([shiftType, shift]) => (
            <div key={shiftType} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="font-semibold capitalize">
                {shiftType === 'morning' ? 'Sabah' : 
                 shiftType === 'evening' ? 'Akşam' : 'Gece'} Vardiyası
              </div>
              <div className="space-y-2">
                <Label>Başlangıç Saati</Label>
                <Input
                  type="time"
                  value={shift.start}
                  onChange={(e) => updateShift(shiftType, 'start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Bitiş Saati</Label>
                <Input
                  type="time"
                  value={shift.end}
                  onChange={(e) => updateShift(shiftType, 'end', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Doktor Sayısı</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={shift.count}
                  onChange={(e) => updateShift(shiftType, 'count', parseInt(e.target.value))}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Nöbet Kuralları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Nöbet Kuralları
          </CardTitle>
          <CardDescription>
            Nöbet dağıtımında uygulanacak kuralları belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ardışık Nöbet Yasağı</Label>
              <p className="text-sm text-muted-foreground">
                Doktorlar üst üste nöbet tutamaz
              </p>
            </div>
            <Switch
              checked={settings.rules.no_consecutive_duties}
              onCheckedChange={(checked) => updateRule('no_consecutive_duties', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Eşit Dağıtım</Label>
              <p className="text-sm text-muted-foreground">
                Nöbet hakları eşit şekilde dağıtılır
              </p>
            </div>
            <Switch
              checked={settings.rules.equal_distribution}
              onCheckedChange={(checked) => updateRule('equal_distribution', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Kırmızı Gün Kuralı</Label>
              <p className="text-sm text-muted-foreground">
                Kırmızı günlerde nöbet atanmaz
              </p>
            </div>
            <Switch
              checked={settings.rules.respect_red_days}
              onCheckedChange={(checked) => updateRule('respect_red_days', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Mavi Gün Kuralı</Label>
              <p className="text-sm text-muted-foreground">
                Mavi gün seçilen doktorlar kesinlikle o gün nöbet tutmalı
              </p>
            </div>
            <Switch
              checked={settings.rules.respect_blue_days}
              onCheckedChange={(checked) => updateRule('respect_blue_days', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Gün Aşırı Nöbet Kuralı</Label>
              <p className="text-sm text-muted-foreground">
                Doktorlar gün aşırı nöbet tutabilir (1-3-5-7 gibi)
              </p>
            </div>
            <Switch
              checked={settings.rules.alternate_day_duty}
              onCheckedChange={(checked) => updateRule('alternate_day_duty', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Ay İçinde Değişiklik</Label>
              <p className="text-sm text-muted-foreground">
                Ay içinde mavi/kırmızı gün ve gün aşırı ayarları değiştirilebilir
              </p>
            </div>
            <Switch
              checked={settings.rules.allow_monthly_changes}
              onCheckedChange={(checked) => updateRule('allow_monthly_changes', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Vardiya Değişimi</Label>
              <p className="text-sm text-muted-foreground">
                İki doktor vardiya saatini veya gününü değiştirebilir
              </p>
            </div>
            <Switch
              checked={settings.rules.allow_shift_swaps}
              onCheckedChange={(checked) => updateRule('allow_shift_swaps', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bildirim Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Bildirim Ayarları
          </CardTitle>
          <CardDescription>
            Sistem bildirimlerini yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Program Oluşturma Bildirimi</Label>
              <p className="text-sm text-muted-foreground">
                Nöbet programı oluşturulduğunda bildirim göster
              </p>
            </div>
            <Switch
              checked={settings.notifications.schedule_generated}
              onCheckedChange={(checked) => updateNotification('schedule_generated', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Nöbet Hatırlatıcıları</Label>
              <p className="text-sm text-muted-foreground">
                Yaklaşan nöbetler için hatırlatıcı göster
              </p>
            </div>
            <Switch
              checked={settings.notifications.duty_reminders}
              onCheckedChange={(checked) => updateNotification('duty_reminders', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Çakışma Uyarıları</Label>
              <p className="text-sm text-muted-foreground">
                Nöbet çakışmaları için uyarı göster
              </p>
            </div>
            <Switch
              checked={settings.notifications.conflict_alerts}
              onCheckedChange={(checked) => updateNotification('conflict_alerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dışa Aktarma Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle>Dışa Aktarma Ayarları</CardTitle>
          <CardDescription>
            PDF ve Excel çıktı ayarlarını yapılandırın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Doktor Bilgilerini Dahil Et</Label>
              <p className="text-sm text-muted-foreground">
                Çıktıya doktor bilgilerini ekle
              </p>
            </div>
            <Switch
              checked={settings.export.include_doctor_info}
              onCheckedChange={(checked) => updateExport('include_doctor_info', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>İstatistikleri Dahil Et</Label>
              <p className="text-sm text-muted-foreground">
                Çıktıya nöbet istatistiklerini ekle
              </p>
            </div>
            <Switch
              checked={settings.export.include_statistics}
              onCheckedChange={(checked) => updateExport('include_statistics', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DutySettings

