import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { useIndexedDB } from '../hooks/useIndexedDB.js'

const DebugPage = () => {
  const [debugInfo, setDebugInfo] = useState({})
  const [testResult, setTestResult] = useState('')
  const { isDBReady, addDoctor, getDoctors } = useIndexedDB()

  useEffect(() => {
    updateDebugInfo()
  }, [isDBReady, updateDebugInfo])

  const updateDebugInfo = useCallback(async () => {
    const info = {
      isDBReady,
      userAgent: navigator.userAgent,
      indexedDBSupport: 'indexedDB' in window,
      timestamp: new Date().toISOString()
    }
    setDebugInfo(info)
  }, [isDBReady])

  const testAddDoctor = async () => {
    try {
      setTestResult('Test başlıyor...')
      
      const testDoctor = {
        id: crypto.randomUUID(),
        name: 'Test Doktor',
        specialty: 'Test Branş',
        duty_rights_24h: 6,
        duty_rights_16h: 2,
        red_days: [],
        blue_days: [],
        created_at: new Date().toISOString()
      }

      console.log('Test doktoru ekleniyor:', testDoctor)
      await addDoctor(testDoctor)
      
      console.log('Doktorlar getiriliyor...')
      const doctors = await getDoctors()
      console.log('Mevcut doktorlar:', doctors)
      
      setTestResult(`Test başarılı! ${doctors.length} doktor bulundu.`)
    } catch (error) {
      console.error('Test hatası:', error)
      setTestResult(`Test hatası: ${error.message}`)
    }
  }

  const clearTestData = async () => {
    try {
      // IndexedDB'yi temizle
      const request = indexedDB.deleteDatabase('nobetDB')
      request.onsuccess = () => {
        setTestResult('Test verileri temizlendi. Sayfayı yenileyin.')
      }
    } catch (error) {
      setTestResult(`Temizleme hatası: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Debug Sayfası</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Sistem Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test İşlemleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={testAddDoctor} disabled={!isDBReady}>
              Doktor Ekleme Testi
            </Button>
            <Button onClick={clearTestData} variant="destructive">
              Test Verilerini Temizle
            </Button>
            <Button onClick={updateDebugInfo}>
              Bilgileri Güncelle
            </Button>
          </div>
          
          {testResult && (
            <div className="p-4 bg-blue-50 rounded">
              <strong>Test Sonucu:</strong> {testResult}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Console Logları</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Tarayıcının Developer Tools (F12) Console sekmesini açın ve test işlemlerini izleyin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default DebugPage
