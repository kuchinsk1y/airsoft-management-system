'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { importEventsFromCSV, ImportResult } from '@/actions/events-import'
import { getApplications } from '@/actions/applications'
import type { ApplicationResponse } from '@/actions/applications'
import { useApplication } from '@/contexts/ApplicationContext'

interface EventsImportContentProps {
  onSuccess?: () => void
}

export default function EventsImportContent({ onSuccess }: EventsImportContentProps) {
  const { isAdmin, currentApplication } = useApplication()
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin && currentApplication) {
      setSelectedAppId(currentApplication.id.toString())
    }
  }, [isAdmin, currentApplication])

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const result = await getApplications()
        setApplications(result.status === 'success' ? result.applications : [])
        // Не выбираем первую организацию по умолчанию
        // setSelectedAppId(apps[0].id.toString())
      } catch (error) {
        console.error('Error loading applications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Если организация не выбрана, ничего не делаем (кнопка будет disabled)
    if (!selectedAppId) return

    setIsImporting(true)
    setResult(null)

    try {
      // Используем papaparse для парсинга CSV
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data as string[][]
            const appId = parseInt(selectedAppId)
            const importResult = await importEventsFromCSV(rows, appId)
            setResult(importResult)
            
            if (importResult.success > 0 && onSuccess) {
              setTimeout(() => onSuccess(), 2000)
            }
          } catch (error) {
            console.error('Import error:', error)
            alert('Помилка при імпорті: ' + (error instanceof Error ? error.message : 'Невідома помилка'))
          } finally {
            setIsImporting(false)
          }
        },
        error: (error) => {
          console.error('Parse error:', error)
          alert('Помилка при читанні файлу: ' + error.message)
          setIsImporting(false)
        },
      })
    } catch (error) {
      console.error('Import error:', error)
      alert('Помилка при імпорті: ' + (error instanceof Error ? error.message : 'Невідома помилка'))
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
          Формат CSV файлу (перший рядок - заголовки):
        </p>
        <div className="bg-white/5 border border-white/10 p-2 sm:p-3 rounded-lg space-y-2">
          <div>
            <p className="text-xs font-semibold text-white mb-1">Українською:</p>
            <code className="block text-xs text-gray-400 break-all">
              Назва,Зображення,Дата початку,Місто,Місце проведення,Макс учасників,Тип змагання,Ціна
            </code>
          </div>
          <div>
            <p className="text-xs font-semibold text-white mb-1">Або англійською:</p>
            <code className="block text-xs text-gray-400 break-all">
              name,image,startDate,city,address,maxParticipants,competitionType,price
            </code>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-400">
            Тип змагання: <span className="text-white font-semibold">Командне</span> | <span className="text-white font-semibold">Індивідуальне</span> | <span className="text-white font-semibold">Тренувальне</span>
          </p>
          <p className="text-xs text-gray-400">
            Дата початку: <span className="text-white font-semibold">2026-01-20</span> або <span className="text-white font-semibold">2026-01-20T10:00:00</span>
          </p>
        </div>
      </div>

      {/* Селект организации */}
      {isAdmin && !isLoading && (
        <div>
          <label htmlFor="org-select" className="block text-xs text-gray-400 mb-2">Організація *</label>
          <select
            id="org-select"
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            disabled={isImporting}
            className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Виберіть організацію...</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id.toString()}>
                {app.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block">
          <span className="sr-only">Вибрати CSV файл</span>
          <div className="relative border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-6 hover:border-white/40 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting || !selectedAppId}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="text-center pointer-events-none">
              <p className="text-sm text-gray-300">Перетягніть файл сюди або натисніть для вибору</p>
              <p className="text-xs text-gray-500 mt-1">Тільки CSV файли</p>
            </div>
          </div>
        </label>
      </div>

      {isImporting && (
        <div className="flex flex-col items-center justify-center py-4 sm:py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-blue-500 mb-2 sm:mb-3"></div>
          <p className="text-sm text-gray-300">Імпорт...</p>
        </div>
      )}

      {result && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
          <h3 className="text-sm sm:text-base font-semibold text-white">Результати імпорту:</h3>
          <div className="space-y-1 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Всього рядків:</span>
              <span className="text-white font-semibold">{result.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">✓ Успішно:</span>
              <span className="text-green-400 font-semibold">{result.success}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-400">✗ Помилок:</span>
              <span className="text-red-400 font-semibold">{result.failed}</span>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-white/10">
              <h4 className="font-semibold text-sm text-white mb-2">Помилки:</h4>
              <div className="max-h-32 sm:max-h-48 overflow-y-auto space-y-1">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="text-xs text-red-400">
                    Рядок <span className="font-semibold">{err.row}</span>: {err.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
