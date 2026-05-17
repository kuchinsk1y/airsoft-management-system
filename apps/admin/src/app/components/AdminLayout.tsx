'use client'

import { useApplication } from '@/contexts/ApplicationContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import NotFound from '../not-found'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoading, applications, refreshApplications, isLoggingOut, hasResolvedApplications, isAdmin } = useApplication()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)
  const [hasAttemptedDashboardApplicationsCheck, setHasAttemptedDashboardApplicationsCheck] = useState(false)
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  useEffect(() => {
    if (sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [pathname])

  const isAllowedForNonAdmin =
    pathname.startsWith('/events') ||
    pathname.startsWith('/my-organization') ||
    pathname.startsWith('/profile')
  const isAccessDenied = hasResolvedApplications && !isLoggingOut && !isAdmin && !isAllowedForNonAdmin
  const isWaitingForAuth = !isAllowedForNonAdmin && !hasResolvedApplications && !isLoggingOut

  useEffect(() => {
    const wasDismissed = localStorage.getItem('createAppModalDismissed') === 'true'
    if (wasDismissed) {
      setModalDismissed(true)
    }
  }, [])

  useEffect(() => {
    if (pathname !== '/dashboard' || isLoggingOut) {
      setHasAttemptedDashboardApplicationsCheck(false)
      return
    }

    if (!isLoading && !hasResolvedApplications && !hasAttemptedDashboardApplicationsCheck) {
      setHasAttemptedDashboardApplicationsCheck(true)
      void refreshApplications()
    }
  }, [pathname, isLoggingOut, isLoading, hasResolvedApplications, hasAttemptedDashboardApplicationsCheck, refreshApplications])

  useEffect(() => {
    // Не показываем модалку во время логаута
    if (isLoggingOut) {
      if (showCreateModal) {
        setShowCreateModal(false)
      }
      return
    }

    // Не показываем модалку на auth страницах и закрываем если уже открыта
    if (pathname.startsWith('/auth/')) {
      if (showCreateModal) {
        setShowCreateModal(false)
      }
      return
    }

    if (!hasResolvedApplications) {
      if (showCreateModal) {
        setShowCreateModal(false)
      }
      return
    }
    
    // Закрываем модалку если приложения загружены
    if (!isLoading && applications.length > 0 && showCreateModal) {
      setShowCreateModal(false)
      return
    }
    
    // Открываем модалку если приложений нет
    if (!isLoading && applications.length === 0 && pathname !== '/create-application' && !showCreateModal && !modalDismissed) {
      setShowCreateModal(true)
    }
  }, [isLoading, applications.length, pathname, showCreateModal, modalDismissed, isLoggingOut, hasResolvedApplications])

  const handleDismissModal = () => {
    setShowCreateModal(false)
    setModalDismissed(true)
    localStorage.setItem('createAppModalDismissed', 'true')
  }

  if (isLoggingOut) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <>
      {isWaitingForAuth && <div className="min-h-screen bg-black" />}
      {!isWaitingForAuth && isAccessDenied && <NotFound />}
      {!isWaitingForAuth && !isAccessDenied && <>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-white text-xl font-bold mb-4">Створити організацію</h2>
            <p className="text-gray-400 mb-6">
              У вас ще немає організації. Бажаєте створити її зараз?
            </p>
            <div className="flex gap-3">
              <Link
                href="/create-application"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-center"
                onClick={handleDismissModal}
              >
                Так, створити
              </Link>
              <button
                onClick={handleDismissModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
              >
                Пізніше
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen bg-black overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex">
          <Sidebar />
        </aside>

        {/* Mobile Sidebar overlay */}
        <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className={`absolute left-0 top-0 h-full w-64 bg-[#111111] border-r border-gray-800 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">{children}</div>
        </main>
      </div>
      </>}
    </>
  )
}
