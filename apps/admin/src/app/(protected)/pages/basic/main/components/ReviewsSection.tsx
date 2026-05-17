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

export default function ReviewsSection() {
  const [statusFilter, setStatusFilter] = useState<CommentStatus>('PENDING')
  const [scopeFilter, setScopeFilter] = useState<CommentScope>('COMPANY')
  const [updatingIds, setUpdatingIds] = useState<number[]>([])
  const queryClient = useQueryClient()

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', statusFilter, scopeFilter],
    queryFn: () => getCommentsByStatus(statusFilter, scopeFilter),
  })

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
    <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
      <div>
        <h2 className="text-lg font-semibold text-white">Відгуки</h2>
        <p className="text-xs text-gray-400 mt-1">Модерація відгуків та вибір активних для головної сторінки</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {(['COMPANY', 'EVENT'] as CommentScope[]).map((scope) => (
          <button
            key={scope}
            type="button"
            onClick={() => setScopeFilter(scope)}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              scopeFilter === scope
                ? 'border-(--color-primary) text-white bg-(--color-primary)/10'
                : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {scope === 'COMPANY' ? 'До компанії' : 'До подій'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(['PENDING', 'APPROVED', 'REJECTED'] as CommentStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              statusFilter === status
                ? 'border-(--color-primary) text-white bg-(--color-primary)/10'
                : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {status === 'PENDING' ? 'Очікують' : status === 'APPROVED' ? 'Активні' : 'Відхилені'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="text-sm text-gray-400">Завантаження...</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-gray-500">Немає відгуків у цьому статусі</div>
        ) : (
          comments.map((comment) => {
            const isUpdating = updatingIds.includes(comment.id)

            return (
              <div key={comment.id} className="flex flex-col gap-3 p-4 rounded-xl border-2 border-white/10 bg-black/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-white">{comment.author.fullName || comment.author.nickName}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {comment.scope === 'COMPANY'
                        ? 'Відгук про компанію'
                        : (comment.event?.name || 'Відгук про подію')}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded-full border ${
                    comment.status === 'APPROVED'
                      ? 'border-green-500/40 text-green-300 bg-green-500/10'
                      : comment.status === 'REJECTED'
                        ? 'border-red-500/40 text-red-300 bg-red-500/10'
                        : 'border-yellow-500/40 text-yellow-300 bg-yellow-500/10'
                  }`}>
                    {comment.status === 'APPROVED' ? 'Активний' : comment.status === 'REJECTED' ? 'Відхилений' : 'Очікує'}
                  </span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed wrap-break-word overflow-hidden">{comment.message}</p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">Активність визначається статусом модерації</p>

                  <div className="flex items-center gap-2">
                    {comment.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(comment)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-(--color-primary)/20 text-(--color-primary) border border-(--color-primary)/30 disabled:opacity-60"
                        >
                          Схвалити
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(comment)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 disabled:opacity-60"
                        >
                          Відхилити
                        </button>
                      </>
                    ) : comment.status === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => handleReject(comment)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 disabled:opacity-60"
                      >
                        Зняти з публікації
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApprove(comment)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-(--color-primary)/20 text-(--color-primary) border border-(--color-primary)/30 disabled:opacity-60"
                      >
                        Повернути в активні
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
