'use client'

import WorkshopItemEditorPageClient from '../WorkshopItemEditorPageClient'
import { useParams } from 'next/navigation'

export default function WorkshopItemEditPage() {
  const params = useParams<{ id: string }>()
  const workshopItemId = Number(params.id)

  if (!workshopItemId || Number.isNaN(workshopItemId)) {
    return (
      <div className="p-4 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-300">
        Некоректний ідентифікатор послуги
      </div>
    )
  }

  return <WorkshopItemEditorPageClient mode="edit" workshopItemId={workshopItemId} />
}
