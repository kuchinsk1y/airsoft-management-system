'use client'

import { useEffect, useState } from 'react'
import { MdCheckCircle, MdError, MdInfo, MdWarning, MdClose } from 'react-icons/md'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  messages: ToastMessage[]
  onRemove: (id: string) => void
}

const toastConfig = {
  success: {
    icon: MdCheckCircle,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-300',
    iconColor: 'text-green-400',
  },
  error: {
    icon: MdError,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-300',
    iconColor: 'text-red-400',
  },
  info: {
    icon: MdInfo,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-300',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: MdWarning,
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-300',
    iconColor: 'text-yellow-400',
  },
}

export default function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className={styles.container}>
      {messages.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

interface ToastItemProps {
  message: ToastMessage
  onRemove: (id: string) => void
}

function ToastItem({ message, onRemove }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false)
  const config = toastConfig[message.type]
  const Icon = config.icon
  const duration = message.duration ?? 4000

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        onRemove(message.id)
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [message.id, duration, onRemove])

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        backdrop-blur-sm
        transition-all duration-300
        ${isExiting ? styles.toastExit : styles.toastEnter}
      `}
    >
      <Icon className={`${config.iconColor} shrink-0`} size={20} />
      <span className={`${config.textColor} text-sm font-medium flex-1`}>
        {message.message}
      </span>
      <button
        onClick={() => {
          setIsExiting(true)
          setTimeout(() => onRemove(message.id), 300)
        }}
        className={`${config.textColor} hover:opacity-70 transition-opacity shrink-0`}
        aria-label="Закрити"
      >
        <MdClose size={18} />
      </button>
    </div>
  )
}
