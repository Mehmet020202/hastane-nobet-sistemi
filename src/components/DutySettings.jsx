import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, Calendar, Clock, Users, Calculator, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { useIndexedDB } from '../hooks/useIndexedDB.js'

const DutySettings = () => {
  const [settings, setSettings] = useState({
    schedule_type: 'monthly', // weekly, bi-weekly, monthly
    shifts: {
      duty_24h: { start: '08:00', end: '08:00', count: 1, duration: 24 },
      duty_16h: { start: '08:00', end: '00:00', count: 1, duration: 16 },
      morning: { start: '08:00', end: '16:00', count: 4, duration: 8 },
      evening: { start: '16:00', end: '24:00', count: 4, duration: 8 },
      night: { start: '00:00', end: '08:00', count: 3, duration: 8 }
    },
    dynamic_calculation: true, // Dinamik hesaplama aktif
    duty_requirements: {
      duty_24h_per_doctor: 6,  // Her doktor için 24 saatlik nöbet sayısı
      duty_16h_per_doctor: 2,  // Her doktor için 16 saatlik nöbet sayısı
      duty_8h_per_doctor: 0,   // Her doktor için 8 saatlik nöbet sayısı
      enable_8h_duties: false, // 8 saatlik nöbetleri aktif et
      daily_24h_count: 3,      // Günlük 24 saatlik nöbet sayısı
      daily_16h_count: 1,      // Günlük 16 saatlik nöbet sayısı
      auto_fill_8h: true,      // Boş saatleri 8 saatlik nöbetlerle doldur
      same_day_rest: true      // Aynı gün nöbet tutanlar ertesi gün nöbet almaz
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

  const { getSettings, saveSettings, exportAllData, importAllData } = useIndexedDB()
  const fileInputRef = useRef(null)
  const [backupStatus, setBackupStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await getSettings()
      if (savedSettings) {
        setSettings(savedSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }, [getSettings])

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

  // Backup functions
  const handleExportData = async () => {
    try {
      setBackupStatus({ type: 'loading', message: 'Veriler dışa aktarılıyor...' })
      
      const backupData = await exportAllData()
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `nobet-sistemi-yedek-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setBackupStatus({ type: 'success', message: 'Veriler başarıyla dışa aktarıldı!' })
      setTimeout(() => setBackupStatus({ type: '', message: '' }), 3000)
    } catch (error) {
      console.error('Export error:', error)
      setBackupStatus({ type: 'error', message: 'Veri dışa aktarma hatası: ' + error.message })
      setTimeout(() => setBackupStatus({ type: '', message: '' }), 5000)
    }
  }

  const handleImportData = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setBackupStatus({ type: 'loading', message: 'Veriler içe aktarılıyor...' })
      
      const text = await file.text()
      const backupData = JSON.parse(text)
      
      // Validate backup data
      if (!backupData.version || !backupData.data) {
        throw new Error('Geçersiz yedek dosyası formatı!')
      }
      
      await importAllData(backupData)
      
      // Reload settings after import
      await loadSettings()
      
      setBackupStatus({ type: 'success', message: 'Veriler başarıyla içe aktarıldı!' })
      setTimeout(() => setBackupStatus({ type: '', message: '' }), 3000)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Import error:', error)
      setBackupStatus({ type: 'error', message: 'Veri içe aktarma hatası: ' + error.message })
      setTimeout(() => setBackupStatus({ type: '', message: '' }), 5000)
    }
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

      {/* Dinamik Hesaplama */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Dinamik Nöbet Hesaplama
          </CardTitle>
          <CardDescription>
            Ayın gün sayısı ve doktor sayısına göre otomatik nöbet hesaplama
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Dinamik Hesaplama</Label>
              <p className="text-sm text-muted-foreground">
                Doktor sayısı ve ay gününe göre otomatik nöbet dağılımı
              </p>
            </div>
            <Switch
              checked={settings.dynamic_calculation}
              onCheckedChange={(checked) => setSettings(prev => ({
                ...prev,
                dynamic_calculation: checked
              }))}
            />
          </div>
          
          {settings.dynamic_calculation && (
            <div className="mt-4 p-4 border rounded-lg">
              <h4 className="font-semibold mb-3">Dinamik Hesaplama Ayarları:</h4>
              <div className="space-y-3">
                <div>
                  <Label>Günlük Nöbetçi Sayısı</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.duty_requirements.daily_duty_count || 4}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      duty_requirements: {
                        ...prev.duty_requirements,
                        daily_duty_count: parseInt(e.target.value) || 4
                      }
                    }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Günlük kaç kişinin nöbet tutacağını belirler. Varsayılan: 4 kişi
                  </p>
                </div>
                
                <div>
                  <Label>Aylık Günlük Nöbetçi Sayısı</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {[
                      { name: 'Ocak', key: 'january' },
                      { name: 'Şubat', key: 'february' },
                      { name: 'Mart', key: 'march' },
                      { name: 'Nisan', key: 'april' },
                      { name: 'Mayıs', key: 'may' },
                      { name: 'Haziran', key: 'june' },
                      { name: 'Temmuz', key: 'july' },
                      { name: 'Ağustos', key: 'august' },
                      { name: 'Eylül', key: 'september' },
                      { name: 'Ekim', key: 'october' },
                      { name: 'Kasım', key: 'november' },
                      { name: 'Aralık', key: 'december' }
                    ].map(month => (
                      <div key={month.key} className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="4"
                          value={settings.duty_requirements.monthly_daily_duty_count?.[month.key] || ''}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            duty_requirements: {
                              ...prev.duty_requirements,
                              monthly_daily_duty_count: {
                                ...prev.duty_requirements.monthly_daily_duty_count,
                                [month.key]: parseInt(e.target.value) || null
                              }
                            }
                          }))}
                          className="w-16 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">{month.name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Her ay için ayrı günlük nöbetçi sayısı belirleyebilirsiniz. Boş bırakırsanız genel ayar kullanılır.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {settings.dynamic_calculation && (
            <div className="space-y-4">
              {/* Nöbet Gereksinimleri Ayarları */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Nöbet Gereksinimleri (Doktor Başına):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>24 Saatlik Nöbet Sayısı</Label>
                    <Input
                      type="number"
                      min="0"
                      max="31"
                      value={settings.duty_requirements.duty_24h_per_doctor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        duty_requirements: {
                          ...prev.duty_requirements,
                          duty_24h_per_doctor: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>16 Saatlik Nöbet Sayısı</Label>
                    <Input
                      type="number"
                      min="0"
                      max="31"
                      value={settings.duty_requirements.duty_16h_per_doctor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        duty_requirements: {
                          ...prev.duty_requirements,
                          duty_16h_per_doctor: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>8 Saatlik Nöbet Sayısı</Label>
                    <Input
                      type="number"
                      min="0"
                      max="31"
                      value={settings.duty_requirements.duty_8h_per_doctor}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        duty_requirements: {
                          ...prev.duty_requirements,
                          duty_8h_per_doctor: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.duty_requirements.enable_8h_duties}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          duty_requirements: {
                            ...prev.duty_requirements,
                            enable_8h_duties: checked
                          }
                        }))}
                      />
                      <Label>8 Saatlik Nöbetleri Aktif Et</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Günlük Nöbet Dağılımı Ayarları */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Günlük Nöbet Dağılımı:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Günlük 24 Saatlik Nöbet Sayısı</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={settings.duty_requirements.daily_24h_count}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        duty_requirements: {
                          ...prev.duty_requirements,
                          daily_24h_count: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Günlük 16 Saatlik Nöbet Sayısı</Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={settings.duty_requirements.daily_16h_count}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        duty_requirements: {
                          ...prev.duty_requirements,
                          daily_16h_count: parseInt(e.target.value) || 0
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.duty_requirements.auto_fill_8h}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          duty_requirements: {
                            ...prev.duty_requirements,
                            auto_fill_8h: checked
                          }
                        }))}
                      />
                      <Label>Boş Saatleri 8 Saatlik Nöbetlerle Doldur</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.duty_requirements.same_day_rest}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          duty_requirements: {
                            ...prev.duty_requirements,
                            same_day_rest: checked
                          }
                        }))}
                      />
                      <Label>Aynı Gün Nöbet Tutanlar Ertesi Gün Nöbet Almasın</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hesaplama Mantığı */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Hesaplama Mantığı:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Her doktor: {settings.duty_requirements.duty_24h_per_doctor} adet 24 saatlik nöbet</li>
                  <li>• Her doktor: {settings.duty_requirements.duty_16h_per_doctor} adet 16 saatlik nöbet</li>
                  {settings.duty_requirements.enable_8h_duties && (
                    <li>• Her doktor: {settings.duty_requirements.duty_8h_per_doctor} adet 8 saatlik nöbet</li>
                  )}
                  <li>• Günlük: {settings.duty_requirements.daily_24h_count} adet 24 saatlik nöbet</li>
                  <li>• Günlük: {settings.duty_requirements.daily_16h_count} adet 16 saatlik nöbet</li>
                  {settings.duty_requirements.auto_fill_8h && (
                    <li>• Boş saatler: 8 saatlik vardiyalarla doldurulur</li>
                  )}
                  <li>• Aynı gün nöbet tutanlar: {settings.duty_requirements.same_day_rest ? 'Ertesi gün nöbet almaz' : 'Ertesi gün nöbet alabilir'}</li>
                </ul>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-2">Örnek Günlük Dağılım:</h5>
                  <div className="text-sm text-blue-700 space-y-1">
                    {settings.dynamic_calculation ? (
                      <>
                        <div>• Genel günlük nöbetçi sayısı: {settings.duty_requirements.daily_duty_count || 4} kişi</div>
                        <div>• Aylık özel ayarlar: {Object.keys(settings.duty_requirements.monthly_daily_duty_count || {}).filter(key => settings.duty_requirements.monthly_daily_duty_count[key]).length} ay</div>
                        <div>• Günlük toplam saat: {(settings.duty_requirements.daily_duty_count || 4) * 24} saat</div>
                        <div className="font-semibold">• Sistem otomatik olarak 24h, 16h ve 8h nöbetleri hesaplayacak</div>
                      </>
                    ) : (
                      <>
                        <div>• 24 saatlik nöbet: {settings.duty_requirements.daily_24h_count} kişi ({settings.duty_requirements.daily_24h_count * 24} saat)</div>
                        <div>• 16 saatlik nöbet: {settings.duty_requirements.daily_16h_count} kişi ({settings.duty_requirements.daily_16h_count * 16} saat)</div>
                        {settings.duty_requirements.auto_fill_8h && (
                          <>
                                                    {(() => {
                          // const total24hHours = settings.duty_requirements.daily_24h_count * 24
                          // const total16hHours = settings.duty_requirements.daily_16h_count * 16
                          
                          // 16 saatlik nöbetçiler sadece gündüz (08:00-00:00) çalışır
                          const dayHours = 16
                          const totalDutyHours = (settings.duty_requirements.daily_24h_count * 24) + (settings.duty_requirements.daily_16h_count * dayHours)
                          const remainingHours = 24 - totalDutyHours
                          const total8hShifts = Math.max(0, Math.ceil(remainingHours / 8))
                          const morningShifts = Math.ceil(total8hShifts * 0.4)
                          const eveningShifts = Math.ceil(total8hShifts * 0.35)
                          const nightShifts = Math.ceil(total8hShifts * 0.25)
                          const calculatedTotal = morningShifts + eveningShifts + nightShifts
                          const difference = total8hShifts - calculatedTotal
                          const finalNightShifts = nightShifts + (difference > 0 ? difference : 0)
                          
                          return (
                            <>
                              <div>• 24 saatlik nöbetçiler: {settings.duty_requirements.daily_24h_count} kişi (24 saat)</div>
                              <div>• 16 saatlik nöbetçiler: {settings.duty_requirements.daily_16h_count} kişi (08:00-00:00)</div>
                              <div>• 00:00-08:00 arası: {settings.duty_requirements.daily_24h_count} kişi (sadece 24h nöbetçiler)</div>
                              <div>• Kalan saat: {remainingHours} saat</div>
                              {remainingHours < 0 ? (
                                <div className="text-red-600 font-semibold">⚠️ Uyarı: Günlük saat 24'ü aşıyor!</div>
                              ) : (
                                <>
                                  <div>• 8 saatlik vardiyalar: {total8hShifts} kişi ({remainingHours} saat)</div>
                                  <div>• Sabah vardiyası: {morningShifts} kişi</div>
                                  <div>• Akşam vardiyası: {eveningShifts} kişi</div>
                                  <div>• Gece vardiyası: {finalNightShifts} kişi</div>
                                </>
                              )}
                              <div className="font-semibold">• Toplam: {totalDutyHours + Math.max(0, remainingHours)} saat</div>
                            </>
                          )
                        })()}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
            <div key={shiftType} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div className="font-semibold capitalize">
                {shiftType === 'duty_24h' ? '24 Saat Nöbet' :
                 shiftType === 'duty_16h' ? '16 Saat Nöbet' :
                 shiftType === 'morning' ? 'Sabah' : 
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
              <div className="space-y-2">
                <Label>Süre (Saat)</Label>
                <Input
                  type="number"
                  min="1"
                  max="48"
                  value={shift.duration}
                  onChange={(e) => updateShift(shiftType, 'duration', parseInt(e.target.value))}
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

      {/* Veri Yedekleme ve Geri Yükleme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Veri Yedekleme ve Geri Yükleme
          </CardTitle>
          <CardDescription>
            Tüm verilerinizi JSON formatında yedekleyin veya geri yükleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Alert */}
          {backupStatus.message && (
            <Alert className={backupStatus.type === 'error' ? 'border-red-200 bg-red-50' : 
                             backupStatus.type === 'success' ? 'border-green-200 bg-green-50' : 
                             'border-blue-200 bg-blue-50'}>
              {backupStatus.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
               backupStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
               <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{backupStatus.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Section */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Veri Dışa Aktarma</Label>
                <p className="text-sm text-muted-foreground">
                  Tüm doktorlar, nöbetler, ayarlar ve özel atamaları JSON dosyası olarak indirin
                </p>
              </div>
              <Button 
                onClick={handleExportData}
                disabled={backupStatus.type === 'loading'}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {backupStatus.type === 'loading' ? 'Dışa Aktarılıyor...' : 'Verileri Dışa Aktar'}
              </Button>
            </div>

            {/* Import Section */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Veri İçe Aktarma</Label>
                <p className="text-sm text-muted-foreground">
                  Önceden yedeklenmiş JSON dosyasından verileri geri yükleyin
                </p>
              </div>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-file"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={backupStatus.type === 'loading'}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {backupStatus.type === 'loading' ? 'İçe Aktarılıyor...' : 'Dosya Seç ve İçe Aktar'}
                </Button>
              </div>
            </div>
          </div>

          {/* Backup Info */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Yedekleme Bilgileri:</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Doktorlar:</strong> Tüm doktor bilgileri ve uzmanlık alanları</li>
              <li>• <strong>Nöbetler:</strong> Tüm aylık nöbet programları</li>
              <li>• <strong>Ayarlar:</strong> Sistem ayarları ve nöbet kuralları</li>
              <li>• <strong>Kırmızı Günler:</strong> Doktorların kırmızı gün seçimleri</li>
              <li>• <strong>Özel Atamalar:</strong> Manuel nöbet atamaları</li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Uyarı:</strong> İçe aktarma işlemi mevcut tüm verileri silecek ve yedek dosyasındaki verilerle değiştirecektir!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DutySettings

