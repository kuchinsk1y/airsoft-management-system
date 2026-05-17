'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveComment,
  CommentDto,
  CommentScope,
  CommentStatus,
  getCommentsByStatus,
  rejectComment,
} from '@/actions/comments'
import {
  MdStar,
  MdCheckCircle,
  MdCancel,
  MdHourglassEmpty,
  MdPerson,
  MdBusiness,
  MdEvent,
} from 'react-icons/md'

const SCOPES: { value: CommentScope; label: string; icon: React.ReactNode }[] = [
  { value: 'COMPANY', label: 'До компанії', icon: <MdBusiness className="text-base" /> },
  { value: 'EVENT', label: 'До подій', icon: <MdEvent className="text-base" /> },
]

const STATUSES: { value: CommentStatus; label: string }[] = [
  { value: 'PENDING', label: 'Очікують' },
  { value: 'APPROVED', label: 'Активні' },
  { value: 'REJECTED', label: 'Відхилені' },
]

function StatusBadge({ status }: { status: CommentStatus }) {
  if (status === 'APPROVED')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
        <MdCheckCircle className="text-xs" /> Активний
      </span>
    )
  if (status === 'REJECTED')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
        <MdCancel className="text-xs" /> Відхилений
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-300">
      <MdHourglassEmpty className="text-xs" /> Очікує
    </span>
  )
}

function CommentCard({
  comment,
  onApprove,
  onReject,
  isUpdating,
}: {
  comment: CommentDto
  onApprove: () => void
  onReject: () => void
  isUpdating: boolean
}) {
  const author = comment.author.fullName || comment.author.nickName

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 transition-all hover:border-white/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
            <MdPerson className="text-lg text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{author}</p>
            <p className="truncate text-xs text-gray-500">
              {comment.scope === 'COMPANY' ? 'Відгук про компанію' : (comment.event?.name ?? 'Відгук про подію')}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={comment.status} />
        </div>
      </div>

      {/* Message */}
      <p className="text-sm leading-relaxed text-gray-300">{comment.message}</p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-3">
        <p className="text-xs text-gray-600">
          {new Date(comment.createdAt).toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>

        <div className="flex gap-2">
          {comment.status === 'PENDING' && (
            <>
              <button
                type="button"
                onClick={onApprove}
                disabled={isUpdating}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/10 px-3 text-xs font-semibold text-(--color-primary) transition-colors hover:bg-(--color-primary)/20 disabled:opacity-50"
              >
                <MdCheckCircle className="text-sm" />
                Схвалити
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={isUpdating}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <MdCancel className="text-sm" />
                Відхилити
              </button>
            </>
          )}
          {comment.status === 'APPROVED' && (
            <button
              type="button"
              onClick={onReject}
              disabled={isUpdating}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              <MdCancel className="text-sm" />
              Зняти з публікації
            </button>
          )}
          {comment.status === 'REJECTED' && (
            <button
              type="button"
              onClick={onApprove}
              disabled={isUpdating}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-(--color-primary)/30 bg-(--color-primary)/10 px-3 text-xs font-semibold text-(--color-primary) transition-colors hover:bg-(--color-primary)/20 disabled:opacity-50"
            >
              <MdCheckCircle className="text-sm" />
              Повернути в активні
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReviewsPageClient() {
  const [scope, setScope] = useState<CommentScope>('COMPANY')
  const [status, setStatus] = useState<CommentStatus>('PENDING')
  const [updatingIds, setUpdatingIds] = useState<number[]>([])
  const queryClient = useQueryClient()

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', status, scope],
    queryFn: () => getCommentsByStatus(status, scope),
  })

  const { data: pendingCompany = [] } = useQuery({
    queryKey: ['comments', 'PENDING', 'COMPANY'],
    queryFn: () => getCommentsByStatus('PENDING', 'COMPANY'),
    staleTime: 60 * 1000,
  })
  const { data: pendingEvent = [] } = useQuery({
    queryKey: ['comments', 'PENDING', 'EVENT'],
    queryFn: () => getCommentsByStatus('PENDING', 'EVENT'),
    staleTime: 60 * 1000,
  })
  const pendingTotal = pendingCompany.length + pendingEvent.length

  const handleApprove = async (comment: CommentDto) => {
    setUpdatingIds((prev) => [...prev, comment.id])
    await approveComment(comment.id)
    setUpdatingIds((prev) => prev.filter((id) => id !== comment.id))
    queryClient.invalidateQueries({ queryKey: ['comments'] })
  }

  const handleReject = async (comment: CommentDto) => {
    setUpdatingIds((prev) => [...prev, comment.id])
    await rejectComment(comment.id)
    setUpdatingIds((prev) => prev.filter((id) => id !== comment.id))
    queryClient.invalidateQueries({ queryKey: ['comments'] })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Відгуки</h1>
          <p className="mt-1 text-sm text-gray-400">Модерація відгуків від користувачів</p>
        </div>
        {pendingTotal > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-300">
            <MdHourglassEmpty className="text-sm" />
            Очікують модерації: {pendingTotal}
          </div>
        )}
      </div>

      {/* Scope tabs */}
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/25 p-1.5">
        {SCOPES.map((s) => {
          const pendingCount = s.value === 'COMPANY' ? pendingCompany.length : pendingEvent.length
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setScope(s.value)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                scope === s.value
                  ? 'bg-(--color-primary) text-white shadow-[0_2px_12px_rgba(255,107,0,0.25)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {s.icon}
              {s.label}
              {pendingCount > 0 && scope !== s.value && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Status sub-tabs */}
      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatus(s.value)}
            className={`flex h-9 items-center rounded-lg px-4 text-sm font-medium transition-colors ${
              status === s.value
                ? 'border border-(--color-primary)/40 bg-(--color-primary)/10 text-(--color-primary)'
                : 'border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Comments grid */}
      {isLoading ? (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          Завантаження...
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/6 bg-black/20 py-16 text-center">
          <MdStar className="text-4xl text-gray-700" />
          <p className="text-sm text-gray-500">Немає відгуків у цьому статусі</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onApprove={() => handleApprove(comment)}
              onReject={() => handleReject(comment)}
              isUpdating={updatingIds.includes(comment.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
