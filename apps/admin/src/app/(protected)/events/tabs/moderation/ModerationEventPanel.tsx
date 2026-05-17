'use client'

import { formatDateDisplay, formatTime } from '@/app/utils/events'
import { translateCompetitionType } from '@/utils/i18n'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import {
  MdAccessTime,
  MdArrowOutward,
  MdCalendarToday,
  MdCheckCircle,
  MdClose,
  MdDescription,
  MdGroups,
  MdLocationOn,
  MdOutlinePendingActions,
  MdPerson,
  MdWarningAmber,
} from 'react-icons/md'
import { Event, EventStatus } from '../../types'

interface ModerationEventPanelProps {
  event: Event | null
  open: boolean
  isLoading?: boolean
  onClose: () => void
  onApprove: (event: Event) => void
  onReject: (event: Event) => void
}

const panelTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

const STATUS_META: Record<EventStatus, { label: string; badgeClassName: string; panelClassName: string }> = {
  PENDING: {
    label: 'На модерації',
    badgeClassName: 'border border-amber-500/30 bg-amber-500/10 text-amber-200',
    panelClassName: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  },
  APPROVED: {
    label: 'Схвалено',
    badgeClassName: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    panelClassName: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
  },
  REJECTED: {
    label: 'Відхилено',
    badgeClassName: 'border border-red-500/30 bg-red-500/10 text-red-200',
    panelClassName: 'border-red-500/25 bg-red-500/10 text-red-100',
  },
}

const stripHtml = (value?: string) => value?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() ?? ''

export default function ModerationEventPanel({
  event,
  open,
  isLoading = false,
  onClose,
  onApprove,
  onReject,
}: ModerationEventPanelProps) {
  useEffect(() => {
    if (!open) return

    const handleEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  const description = useMemo(() => stripHtml(event?.description), [event?.description])

  return (
    <AnimatePresence>
      {open && event && (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={panelTransition}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-[1px]"
            onClick={onClose}
            aria-label="Закрити панель модерації"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={panelTransition}
            className="absolute right-0 top-0 h-full w-full sm:max-w-2xl border-l border-white/10 bg-[#0f0f10] shadow-2xl shadow-black/60"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-black/20 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Модерація події</p>
                  <h2 className="truncate text-xl font-bold text-white">{event.name}</h2>
                  <p className="mt-1 text-sm text-gray-300">
                    {event.application.name} • {formatDateDisplay(event.gameStartDate ?? event.startDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Закрити"
                >
                  <MdClose size={20} />
                </button>
              </div>

              <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <section className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <div className="relative h-40 bg-black/40">
                    {event.image ? (
                      <Image
                        src={event.image}
                        alt={event.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 36rem"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                        Зображення події відсутнє
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/45 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${STATUS_META[event.status].badgeClassName}`}>
                        {STATUS_META[event.status].label}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                        {translateCompetitionType(event.competitionType)}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 border-t border-white/10 px-4 py-3 text-xs text-gray-300 sm:grid-cols-2">
                    <div className="inline-flex items-center gap-2">
                      <MdCalendarToday className="text-(--color-primary)" size={15} />
                      <span>{formatDateDisplay(event.gameStartDate ?? event.startDate)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MdAccessTime className="text-(--color-primary)" size={15} />
                      <span>{formatTime(event.gameStartDate ?? event.startDate)}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MdLocationOn className="text-(--color-primary)" size={15} />
                      <span className="truncate">{event.city.name}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MdGroups className="text-(--color-primary)" size={15} />
                      <span>
                        {event.registeredParticipants}/{event.maxParticipants}
                      </span>
                    </div>
                  </div>
                </section>

                <section className={`rounded-xl border p-4 ${STATUS_META[event.status].panelClassName}`}>
                  <div className="flex items-start gap-3">
                    {event.status === 'PENDING' ? (
                      <MdOutlinePendingActions className="mt-0.5 shrink-0" size={20} />
                    ) : event.status === 'APPROVED' ? (
                      <MdCheckCircle className="mt-0.5 shrink-0" size={20} />
                    ) : (
                      <MdWarningAmber className="mt-0.5 shrink-0" size={20} />
                    )}
                    <div>
                      <p className="text-sm font-semibold">Поточний статус: {STATUS_META[event.status].label}</p>
                      <p className="mt-1 text-sm text-current/80">
                        {event.status === 'PENDING'
                          ? 'Подія очікує рішення модератора і не показується в основному каталозі.'
                          : event.status === 'APPROVED'
                            ? 'Подія опублікована в каталозі та доступна для користувачів.'
                            : 'Подія прихована з каталогу. Організатор бачить причину відхилення.'}
                      </p>
                    </div>
                  </div>
                </section>

                {event.statusReason && (
                  <section className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
                    <p className="text-sm font-semibold text-red-100">Остання причина відхилення</p>
                    <p className="mt-2 text-sm leading-6 text-red-50/90">{event.statusReason}</p>
                  </section>
                )}

                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MdPerson className="text-(--color-primary)" size={18} />
                    <h3 className="text-sm font-semibold text-white">Організатор</h3>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {event.application.owner.fullName || event.application.owner.nickName}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">{event.application.name}</p>
                  <p className="mt-1 text-sm text-gray-400">{event.application.phoneNumber || 'Не вказано'}</p>
                  <p className="mt-1 text-sm text-gray-500">{event.address}</p>
                </section>

                <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MdDescription className="text-(--color-primary)" size={18} />
                    <h3 className="text-sm font-semibold text-white">Опис події</h3>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-6 text-gray-300">
                    {description || 'Організатор ще не додав опис події.'}
                  </div>
                </section>

                {event.sides && event.sides.length > 0 && (
                  <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h3 className="text-sm font-semibold text-white">Сторони та місткість</h3>
                    <div className="mt-3 space-y-2.5">
                      {event.sides.map((side) => (
                        <div key={side.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2.5">
                          <p className="text-sm text-white">{side.name}</p>
                          <span className="text-xs text-gray-400">
                            {side.playersCount ?? 0}/{side.sideCapacity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {event.socialLinks && Object.keys(event.socialLinks).length > 0 && (
                  <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <h3 className="text-sm font-semibold text-white">Соціальні посилання</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(event.socialLinks).map(([key, value]) => (
                        <a
                          key={key}
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-(--color-primary)/40 hover:text-white"
                        >
                          <MdArrowOutward size={14} />
                          {key}
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-2.5 border-t border-white/10 bg-black/25 px-5 py-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => onApprove(event)}
                    disabled={isLoading || event.status === 'APPROVED'}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--color-primary) px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-(--color-primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MdCheckCircle size={18} />
                    {isLoading ? 'Збереження...' : 'Схвалити'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onReject(event)}
                    disabled={isLoading || event.status === 'REJECTED'}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MdWarningAmber size={18} />
                    Відхилити
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
