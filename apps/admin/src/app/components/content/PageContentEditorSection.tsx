'use client'

import TinyMceEditor from '@/app/components/TinyMceEditor'

interface PageContentEditorSectionProps {
  title: string
  content: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onImageUpload: (file: File) => Promise<string>
  disabled?: boolean
  titleLabel?: string
  titlePlaceholder?: string
  contentLabel?: string
  contentPlaceholder?: string
}

export default function PageContentEditorSection({
  title,
  content,
  onTitleChange,
  onContentChange,
  onImageUpload,
  disabled = false,
  titleLabel = 'Заголовок сторінки',
  titlePlaceholder = 'Введіть заголовок',
  contentLabel = 'Контент',
  contentPlaceholder = '',
}: PageContentEditorSectionProps) {
  return (
    <section className="p-5 rounded-xl border-2 border-white/10 bg-black/30 space-y-4">
      <div>
        <label className="block text-sm text-gray-300 mb-2">{titleLabel}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder={titlePlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">{contentLabel}</label>
        <TinyMceEditor
          value={content}
          onChange={onContentChange}
          onImageUpload={onImageUpload}
          disabled={disabled}
          placeholder={contentPlaceholder}
        />
      </div>
    </section>
  )
}
