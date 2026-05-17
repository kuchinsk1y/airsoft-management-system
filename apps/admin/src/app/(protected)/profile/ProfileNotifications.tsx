'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Toast, { ToastMessage } from '@/app/components/Toast'

interface ProfileNotificationsProps {
  showSmsSaved: boolean
}

export default function ProfileNotifications({ showSmsSaved }: ProfileNotificationsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const shownRef = useRef(false)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    if (!showSmsSaved || shownRef.current) return
    shownRef.current = true

    const id = `${Date.now()}-${Math.random()}`
    setToasts([
      {
        id,
        type: 'success',
        message: 'Налаштування SMS успішно збережено',
      },
    ])

    router.replace(pathname)
  }, [pathname, router, showSmsSaved])

  return <Toast messages={toasts} onRemove={removeToast} />
}
