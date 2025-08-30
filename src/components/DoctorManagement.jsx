import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, Users, Calendar, CalendarX } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { useIndexedDB } from '../hooks/useIndexedDB.js'

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    duty_rights_24h: 6,
    duty_rights_16h: 2,
    has_red_days: false,
    red_days: [],
    has_blue_days: false,
    blue_days: []
  })

  const { isDBReady, addDoctor, getDoctors, updateDoctor, deleteDoctor } = useIndexedDB()

  useEffect(() => {
    if (isDBReady) {
      loadDoctors()
    }
  }, [isDBReady])

  const loadDoctors = async () => {
    try {
      const doctorList = await getDoctors()
      setDoctors(doctorList)
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Form validasyonu
    if (!formData.name.trim() || !formData.specialty.trim()) {
      alert('Lütfen doktor adı ve branşını girin!')
      return
    }
    
    try {
      const doctorData = {
        ...formData,
        red_days: formData.has_red_days ? formData.red_days : [],
        blue_days: formData.has_blue_days ? formData.blue_days : []
      }

      if (editingDoctor) {
        await updateDoctor({ ...doctorData, id: editingDoctor.id })
        alert('Doktor başarıyla güncellendi!')
      } else {
        await addDoctor({
          ...doctorData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        })
        alert('Doktor başarıyla eklendi!')
      }
      await loadDoctors()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving doctor:', error)
      alert('Doktor kaydedilirken hata oluştu: ' + error.message)
    }
  }

  const handleEdit = (doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      name: doctor.name,
      specialty: doctor.specialty,
      duty_rights_24h: doctor.duty_rights_24h,
      duty_rights_16h: doctor.duty_rights_16h,
      has_red_days: (doctor.red_days && doctor.red_days.length > 0),
      red_days: doctor.red_days || [],
      has_blue_days: (doctor.blue_days && doctor.blue_days.length > 0),
      blue_days: doctor.blue_days || []
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (doctorId) => {
    if (confirm('Bu doktoru silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoctor(doctorId)
        await loadDoctors()
      } catch (error) {
        console.error('Error deleting doctor:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      duty_rights_24h: 6,
      duty_rights_16h: 2,
      has_red_days: false,
      red_days: [],
      has_blue_days: false,
      blue_days: []
    })
    setEditingDoctor(null)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addRedDay = () => {
    const dateInput = document.getElementById('red-day-input')
    const date = dateInput.value
    if (date && !formData.red_days.includes(date)) {
      setFormData(prev => ({
        ...prev,
        red_days: [...prev.red_days, date]
      }))
      dateInput.value = ''
    }
  }

  const removeRedDay = (date) => {
    setFormData(prev => ({
      ...prev,
      red_days: prev.red_days.filter(d => d !== date)
    }))
  }

  const addBlueDay = () => {
    const dateInput = document.getElementById('blue-day-input')
    const date = dateInput.value
    if (date && !formData.blue_days.includes(date)) {
      setFormData(prev => ({
        ...prev,
        blue_days: [...prev.blue_days, date]
      }))
      dateInput.value = ''
    }
  }

  const removeBlueDay = (date) => {
    setFormData(prev => ({
      ...prev,
      blue_days: prev.blue_days.filter(d => d !== date)
    }))
  }

  if (!isDBReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Veritabanı hazırlanıyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Doktor Yönetimi</h2>
          <p className="text-muted-foreground">Doktor bilgilerini ekleyin, düzenleyin ve yönetin</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Doktor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>
                {editingDoctor ? 'Doktor Düzenle' : 'Yeni Doktor Ekle'}
              </DialogTitle>
              <DialogDescription>
                Doktor bilgilerini girin. Kırmızı ve mavi günler opsiyoneldir.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-1">
                  <TabsTrigger value="basic" className="text-xs sm:text-sm">Temel</TabsTrigger>
                  <TabsTrigger value="red-days" className="text-xs sm:text-sm">Kırmızı</TabsTrigger>
                  <TabsTrigger value="blue-days" className="text-xs sm:text-sm">Mavi</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Dr. Ahmet Yılmaz"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Branş</Label>
                      <Input
                        id="specialty"
                        value={formData.specialty}
                        onChange={(e) => handleInputChange('specialty', e.target.value)}
                        placeholder="Kardiyoloji"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duty_24h">24 Saat Nöbet Hakkı</Label>
                      <Input
                        id="duty_24h"
                        type="number"
                        min="0"
                        max="31"
                        value={formData.duty_rights_24h}
                        onChange={(e) => handleInputChange('duty_rights_24h', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duty_16h">16 Saat Nöbet Hakkı</Label>
                      <Input
                        id="duty_16h"
                        type="number"
                        min="0"
                        max="31"
                        value={formData.duty_rights_16h}
                        onChange={(e) => handleInputChange('duty_rights_16h', parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="red-days" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="has_red_days"
                      checked={formData.has_red_days}
                      onCheckedChange={(checked) => handleInputChange('has_red_days', checked)}
                    />
                    <Label htmlFor="has_red_days">Bu doktorun kırmızı günleri var</Label>
                  </div>
                  
                  {formData.has_red_days && (
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          id="red-day-input"
                          type="date"
                          placeholder="Kırmızı gün seçin"
                        />
                        <Button type="button" onClick={addRedDay}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.red_days.map((date) => (
                          <div key={date} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span>{new Date(date).toLocaleDateString('tr-TR')}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRedDay(date)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="blue-days" className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="has_blue_days"
                      checked={formData.has_blue_days}
                      onCheckedChange={(checked) => handleInputChange('has_blue_days', checked)}
                    />
                    <Label htmlFor="has_blue_days">Bu doktorun mavi günleri var</Label>
                  </div>
                  
                  {formData.has_blue_days && (
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          id="blue-day-input"
                          type="date"
                          placeholder="Mavi gün seçin"
                        />
                        <Button type="button" onClick={addBlueDay}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.blue_days.map((date) => (
                          <div key={date} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <span>{new Date(date).toLocaleDateString('tr-TR')}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBlueDay(date)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Kaydet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <Card key={doctor.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{doctor.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(doctor)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doctor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{doctor.specialty}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>24 Saat Nöbet:</span>
                  <Badge variant="secondary">{doctor.duty_rights_24h}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>16 Saat Nöbet:</span>
                  <Badge variant="secondary">{doctor.duty_rights_16h}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kırmızı Günler:</span>
                  <Badge variant={doctor.red_days && doctor.red_days.length > 0 ? "destructive" : "outline"}>
                    {doctor.red_days && doctor.red_days.length > 0 ? `${doctor.red_days.length} gün` : "Yok"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mavi Günler:</span>
                  <Badge variant={doctor.blue_days && doctor.blue_days.length > 0 ? "default" : "outline"}>
                    {doctor.blue_days && doctor.blue_days.length > 0 ? `${doctor.blue_days.length} gün` : "Yok"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {doctors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz doktor eklenmemiş</h3>
            <p className="text-muted-foreground text-center mb-4">
              Nöbet sistemi için doktor bilgilerini ekleyerek başlayın
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              İlk Doktoru Ekle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DoctorManagement

