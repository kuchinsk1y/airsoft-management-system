'use client'

import NewsEditorPageClient from '../NewsEditorPageClient'
import { useParams } from 'next/navigation'

export default function NewsEditPage() {
  const params = useParams<{ id: string }>()
  const newsId = Number(params.id)

  if (!newsId || Number.isNaN(newsId)) {
    return (
      <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-300">
        Некоректний ідентифікатор новини
      </div>
    )
  }

  return <NewsEditorPageClient mode="edit" newsId={newsId} />
}
