import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Calendar, Users, Settings, FileText, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet.jsx'
import DoctorManagement from './components/DoctorManagement.jsx'
import DutyCalendar from './components/DutyCalendar.jsx'
import DutySettings from './components/DutySettings.jsx'
import ExportPage from './components/ExportPage.jsx'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('calendar')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  const navigation = [
    { id: 'calendar', name: 'Nöbet Takvimi', icon: Calendar },
    { id: 'doctors', name: 'Doktor Yönetimi', icon: Users },
    { id: 'settings', name: 'Ayarlar', icon: Settings },
    { id: 'export', name: 'Dışa Aktar', icon: FileText },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'calendar':
        return <DutyCalendar />
      case 'doctors':
        return <DoctorManagement />
      case 'settings':
        return <DutySettings />
      case 'export':
        return <ExportPage />
      default:
        return <DutyCalendar />
    }
  }

  const NavigationItems = ({ mobile = false }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'default' : 'ghost'}
            className={`${mobile ? 'w-full justify-start' : ''} mb-2`}
            onClick={() => {
              setCurrentPage(item.id)
              if (mobile) setIsMobileMenuOpen(false)
            }}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.name}
          </Button>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="py-4">
                  <h2 className="mb-4 text-lg font-semibold">Menü</h2>
                  <NavigationItems mobile={true} />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold">Hastane Nöbet Sistemi</h1>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 border-r bg-card md:block">
          <div className="p-4">
            <nav className="space-y-2">
              <NavigationItems />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App

