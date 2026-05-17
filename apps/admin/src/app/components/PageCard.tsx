import Link from 'next/link'
import { ComponentType } from 'react'

interface PageCardProps {
  id: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  href: string
  editable?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PageCard({ id, title, description, icon: Icon, href, editable = true }: PageCardProps) {
  return (
    <div className="bg-black/50 backdrop-blur-sm p-6 rounded-xl flex flex-col justify-between gap-4 border-2 border-(--color-primary) hover:bg-black/60 transition-all">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-(--color-primary)/10">
            <Icon className="text-2xl text-(--color-primary)" />
          </div>
          <p className="text-white text-lg font-bold leading-tight">{title}</p>
        </div>
        <p className="text-gray-400 text-sm font-normal leading-normal">{description}</p>
      </div>
      {editable ? (
        <Link href={href} className="flex w-fit items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors">
          <span>Редагувати</span>
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="flex w-fit items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-gray-700/40 text-gray-400 text-sm font-semibold cursor-not-allowed border border-(--color-primary)/30"
        >
          Недоступно
        </button>
      )}
    </div>
  )
}
