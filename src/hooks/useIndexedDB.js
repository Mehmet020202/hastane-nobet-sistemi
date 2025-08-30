import { useState, useEffect, useRef } from 'react'

const DB_NAME = 'NobetSistemiDB'
const DB_VERSION = 1

const useIndexedDB = () => {
  const dbRef = useRef(null)
  const [isDBReady, setIsDBReady] = useState(false)

  useEffect(() => {
    const openDB = async () => {
      try {
        const database = await initDB()
        dbRef.current = database
        setIsDBReady(true)
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error)
      }
    }
    openDB()
  }, [])

  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error)
        reject(event.target.error)
      }

      request.onsuccess = (event) => {
        const database = event.target.result
        resolve(database)
      }

      request.onupgradeneeded = (event) => {
        const database = event.target.result

        if (!database.objectStoreNames.contains('doctors')) {
          const doctorStore = database.createObjectStore('doctors', { keyPath: 'id' })
          doctorStore.createIndex('name', 'name', { unique: false })
          doctorStore.createIndex('specialty', 'specialty', { unique: false })
        }

        if (!database.objectStoreNames.contains('duties')) {
          const dutyStore = database.createObjectStore('duties', { keyPath: 'id' })
          dutyStore.createIndex('date', 'date', { unique: false })
          dutyStore.createIndex('doctor_id', 'doctor_id', { unique: false })
          dutyStore.createIndex('shift_type', 'shift_type', { unique: false })
          dutyStore.createIndex('year_month', 'year_month', { unique: false })
        }

        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'id' })
        }

        if (!database.objectStoreNames.contains('red_days')) {
          const redDaysStore = database.createObjectStore('red_days', { keyPath: 'id' })
          redDaysStore.createIndex('doctor_id', 'doctor_id', { unique: false })
          redDaysStore.createIndex('date', 'date', { unique: false })
        }

        if (!database.objectStoreNames.contains('special_assignments')) {
          const specialStore = database.createObjectStore('special_assignments', { keyPath: 'id' })
          specialStore.createIndex('doctor_id', 'doctor_id', { unique: false })
          specialStore.createIndex('date', 'date', { unique: false })
        }
      }
    })
  }

  const getDB = async () => {
    if (dbRef.current) {
      return dbRef.current
    }
    // Wait for DB to be ready if not already
    return new Promise((resolve) => {
      const checkDB = () => {
        if (dbRef.current) {
          resolve(dbRef.current)
        } else {
          setTimeout(checkDB, 50) // Check again after a short delay
        }
      }
      checkDB()
    })
  }

  const executeTransaction = async (storeNames, mode, callback) => {
    const database = await getDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeNames, mode)
      transaction.oncomplete = () => resolve()
      transaction.onerror = (event) => reject(event.target.error)
      callback(transaction)
    })
  }

  // Doctor operations
  const addDoctor = async (doctor) => {
    return executeTransaction(['doctors'], 'readwrite', (transaction) => {
      const store = transaction.objectStore('doctors')
      store.add(doctor)
    })
  }

  const getDoctors = async () => {
    return executeTransaction(['doctors'], 'readonly', (transaction) => {
      const store = transaction.objectStore('doctors')
      const request = store.getAll()
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || []) // Ensure it returns an array even if no doctors
  }

  const updateDoctor = async (doctor) => {
    return executeTransaction(['doctors'], 'readwrite', (transaction) => {
      const store = transaction.objectStore('doctors')
      store.put(doctor)
    })
  }

  const deleteDoctor = async (doctorId) => {
    return executeTransaction(['doctors', 'duties', 'red_days', 'special_assignments'], 'readwrite', (transaction) => {
      const doctorStore = transaction.objectStore('doctors')
      doctorStore.delete(doctorId)

      const dutyStore = transaction.objectStore('duties')
      const dutyIndex = dutyStore.index('doctor_id')
      dutyIndex.openCursor(IDBKeyRange.only(doctorId)).onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) { cursor.delete(); cursor.continue() }
      }

      const redDaysStore = transaction.objectStore('red_days')
      const redDaysIndex = redDaysStore.index('doctor_id')
      redDaysIndex.openCursor(IDBKeyRange.only(doctorId)).onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) { cursor.delete(); cursor.continue() }
      }

      const specialStore = transaction.objectStore('special_assignments')
      const specialIndex = specialStore.index('doctor_id')
      specialIndex.openCursor(IDBKeyRange.only(doctorId)).onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) { cursor.delete(); cursor.continue() }
      }
    })
  }

  // Duty operations
  const saveDuties = async (duties) => {
    return executeTransaction(['duties'], 'readwrite', (transaction) => {
      const store = transaction.objectStore('duties')
      if (duties.length > 0) {
        const firstDuty = duties[0]
        const yearMonth = firstDuty.year_month
        const index = store.index('year_month')
        index.openCursor(IDBKeyRange.only(yearMonth)).onsuccess = (event) => {
          const cursor = event.target.result
          if (cursor) { cursor.delete(); cursor.continue() }
          else { duties.forEach(duty => store.add({ ...duty, id: crypto.randomUUID() })) }
        }
      }
    })
  }

  const getDuties = async (year, month) => {
    return executeTransaction(['duties'], 'readonly', (transaction) => {
      const store = transaction.objectStore('duties')
      const index = store.index('year_month')
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`
      const request = index.getAll(IDBKeyRange.only(yearMonth))
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || [])
  }

  // Red days operations
  const addRedDay = async (doctorId, date) => {
    return executeTransaction(['red_days'], 'readwrite', (transaction) => {
      const store = transaction.objectStore('red_days')
      store.add({ id: crypto.randomUUID(), doctor_id: doctorId, date: date, created_at: new Date().toISOString() })
    })
  }

  const getRedDays = async (doctorId) => {
    return executeTransaction(['red_days'], 'readonly', (transaction) => {
      const store = transaction.objectStore('red_days')
      const index = store.index('doctor_id')
      const request = index.getAll(IDBKeyRange.only(doctorId))
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result.map(item => item.date)
    }).then(result => result || [])
  }

  const deleteRedDay = async (doctorId, date) => {
    return executeTransaction(['red_days'], 'readwrite', (transaction) => {
      const store = transaction.objectStore('red_days')
      const index = store.index('doctor_id')
      index.openCursor(IDBKeyRange.only(doctorId)).onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.date === date) { cursor.delete() }
          else { cursor.continue() }
        }
      }
    })
  }

  // Special assignments operations
  const addSpecialAssignment = async (doctorId, date, shiftType) => {
    return executeTransaction(['special_assignments'], 'readwrite', (transaction) => {
      const store = transaction.objectStore('special_assignments')
      store.add({ id: crypto.randomUUID(), doctor_id: doctorId, date: date, shift_type: shiftType, created_at: new Date().toISOString() })
    })
  }

  const getSpecialAssignments = async (doctorId) => {
    return executeTransaction(['special_assignments'], 'readonly', (transaction) => {
      const store = transaction.objectStore('special_assignments')
      const index = store.index('doctor_id')
      const request = index.getAll(IDBKeyRange.only(doctorId))
      request.onsuccess = (event) => {
        const assignments = {};
        event.target.result.forEach(item => { assignments[item.date] = item.shift_type });
        transaction.oncomplete = () => assignments;
      }
    }).then(result => result || {})
  }

  // Settings operations
  const saveSettings = async (settings) => {
    return executeTransaction(['settings'], 'readwrite', (transaction) => {
      const store = transaction.objectStore('settings')
      store.put({ id: 'app_settings', ...settings, updated_at: new Date().toISOString() })
    })
  }

  const getSettings = async () => {
    return executeTransaction(['settings'], 'readonly', (transaction) => {
      const store = transaction.objectStore('settings')
      const request = store.get('app_settings')
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || null)
  }

  // Backup and restore operations
  const exportAllData = async () => {
    const database = await getDB()
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {}
    }

    // Export doctors
    backup.data.doctors = await executeTransaction(['doctors'], 'readonly', (transaction) => {
      const store = transaction.objectStore('doctors')
      const request = store.getAll()
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || [])

    // Export duties
    backup.data.duties = await executeTransaction(['duties'], 'readonly', (transaction) => {
      const store = transaction.objectStore('duties')
      const request = store.getAll()
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || [])

    // Export settings
    backup.data.settings = await executeTransaction(['settings'], 'readonly', (transaction) => {
      const store = transaction.objectStore('settings')
      const request = store.getAll()
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || [])

    // Export red days
    backup.data.red_days = await executeTransaction(['red_days'], 'readonly', (transaction) => {
      const store = transaction.objectStore('red_days')
      const request = store.getAll()
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || [])

    // Export special assignments
    backup.data.special_assignments = await executeTransaction(['special_assignments'], 'readonly', (transaction) => {
      const store = transaction.objectStore('special_assignments')
      const request = store.getAll()
      request.onsuccess = (event) => transaction.oncomplete = () => event.target.result
    }).then(result => result || [])

    return backup
  }

  const importAllData = async (backupData) => {
    if (!backupData || !backupData.data) {
      throw new Error('Geçersiz yedek dosyası!')
    }

    const database = await getDB()

    // Clear all existing data first
    await executeTransaction(['doctors', 'duties', 'settings', 'red_days', 'special_assignments'], 'readwrite', (transaction) => {
      transaction.objectStore('doctors').clear()
      transaction.objectStore('duties').clear()
      transaction.objectStore('settings').clear()
      transaction.objectStore('red_days').clear()
      transaction.objectStore('special_assignments').clear()
    })

    // Import doctors
    if (backupData.data.doctors && backupData.data.doctors.length > 0) {
      await executeTransaction(['doctors'], 'readwrite', (transaction) => {
        const store = transaction.objectStore('doctors')
        backupData.data.doctors.forEach(doctor => {
          store.add(doctor)
        })
      })
    }

    // Import duties
    if (backupData.data.duties && backupData.data.duties.length > 0) {
      await executeTransaction(['duties'], 'readwrite', (transaction) => {
        const store = transaction.objectStore('duties')
        backupData.data.duties.forEach(duty => {
          store.add(duty)
        })
      })
    }

    // Import settings
    if (backupData.data.settings && backupData.data.settings.length > 0) {
      await executeTransaction(['settings'], 'readwrite', (transaction) => {
        const store = transaction.objectStore('settings')
        backupData.data.settings.forEach(setting => {
          store.add(setting)
        })
      })
    }

    // Import red days
    if (backupData.data.red_days && backupData.data.red_days.length > 0) {
      await executeTransaction(['red_days'], 'readwrite', (transaction) => {
        const store = transaction.objectStore('red_days')
        backupData.data.red_days.forEach(redDay => {
          store.add(redDay)
        })
      })
    }

    // Import special assignments
    if (backupData.data.special_assignments && backupData.data.special_assignments.length > 0) {
      await executeTransaction(['special_assignments'], 'readwrite', (transaction) => {
        const store = transaction.objectStore('special_assignments')
        backupData.data.special_assignments.forEach(assignment => {
          store.add(assignment)
        })
      })
    }
  }

  return {
    isDBReady,
    addDoctor,
    getDoctors,
    updateDoctor,
    deleteDoctor,
    saveDuties,
    getDuties,
    addRedDay,
    getRedDays,
    deleteRedDay,
    addSpecialAssignment,
    getSpecialAssignments,
    saveSettings,
    getSettings,
    exportAllData,
    importAllData
  }
}

export { useIndexedDB }

