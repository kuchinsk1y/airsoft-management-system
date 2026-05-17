'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { ApplicationResponse, getApplications } from '@/actions/applications'

interface ApplicationContextType {
  currentApplication: ApplicationResponse | null
  applications: ApplicationResponse[]
  isAdmin: boolean
  isLoading: boolean
  hasResolvedApplications: boolean
  isLoggingOut: boolean
  error: string | null
  setCurrentApplication: (app: ApplicationResponse | null) => void
  refreshApplications: () => Promise<{ isAdmin: boolean }>
  clearApplications: () => void
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined)

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [currentApplication, setCurrentApplicationState] = useState<ApplicationResponse | null>(null)
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasResolvedApplications, setHasResolvedApplications] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setCurrentApplication = useCallback((app: ApplicationResponse | null) => {
    setCurrentApplicationState(app)
    if (app) localStorage.setItem('currentApplicationId', app.id.toString())
    else localStorage.removeItem('currentApplicationId')
  }, [])

  const loadApplications = useCallback(async (): Promise<{ isAdmin: boolean }> => {
    try {
      setIsLoading(true)
      setIsLoggingOut(false)
      setError(null)
      const result = await getApplications()
      if (result.status !== 'success') {
        setIsAdmin(false)
        if (result.status === 'error') {
          setError('Помилка при завантаженні організацій')
        }
        return { isAdmin: false }
      }

      const apps = result.applications
      setIsAdmin(result.isAdmin)
      setHasResolvedApplications(true)
      setApplications(apps)

      if (apps.length > 0) {
        const savedAppId = localStorage.getItem('currentApplicationId')
        const defaultApp = savedAppId
          ? apps.find((a) => a.id === parseInt(savedAppId, 10))
          : apps[0]

        if (defaultApp) {
          setCurrentApplication(defaultApp)
        }
      } else {
        setCurrentApplication(null)
      }
      return { isAdmin: result.isAdmin }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Помилка при завантаженні організацій'
      setError(errorMsg)
      console.error('Failed to load applications:', err)
      setHasResolvedApplications(false)
      setApplications([])
      setCurrentApplication(null)
      setIsAdmin(false)
      return { isAdmin: false }
    } finally {
      setIsLoading(false)
    }
  }, [setCurrentApplication])

  useEffect(() => {
    void loadApplications()
  }, [loadApplications])

  const refreshApplications = useCallback(async (): Promise<{ isAdmin: boolean }> => {
    return await loadApplications()
  }, [loadApplications])

  const clearApplications = useCallback(() => {
    setIsLoggingOut(true)
    setApplications([])
    setCurrentApplication(null)
    setIsAdmin(false)
    setHasResolvedApplications(false)
    setIsLoading(false)
    setError(null)
    localStorage.removeItem('currentApplicationId')
  }, [setCurrentApplication])

  const value: ApplicationContextType = useMemo(() => ({
    currentApplication,
    applications,
    isAdmin,
    isLoading,
    hasResolvedApplications,
    isLoggingOut,
    error,
    setCurrentApplication,
    refreshApplications,
    clearApplications,
  }), [
    currentApplication,
    applications,
    isAdmin,
    isLoading,
    hasResolvedApplications,
    isLoggingOut,
    error,
    setCurrentApplication,
    refreshApplications,
    clearApplications,
  ])

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  )
}

export function useApplication() {
  const context = useContext(ApplicationContext)
  if (context === undefined) throw new Error('useApplication должен быть использован внутри ApplicationProvider')
  return context
}
