import { MdImage } from 'react-icons/md'

interface MainInfoSectionProps {
  title: string
  description: string
  imagePreview: string | null
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function MainInfoSection({ title, description, imagePreview, onTitleChange, onDescriptionChange, onImageChange }: MainInfoSectionProps) {
  return (
    <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
      <div>
        <h2 className="text-lg font-semibold text-white">Основні дані</h2>
        <p className="text-xs text-gray-400 mt-1">Заголовок, опис і головне зображення сторінки.</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-xs text-gray-400 font-medium">Заголовок</label>
            <input name="title" id="title" value={title} onChange={e => onTitleChange(e.target.value)} placeholder="Введіть title сторінки" className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs text-gray-400 font-medium">Опис</label>
            <textarea name="description" id="description" value={description} onChange={e => onDescriptionChange(e.target.value)} placeholder="Введіть опис сторінки для SEO" className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"/>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="image" className="text-xs text-gray-400 font-medium">Головне зображення</label>
            <label className="cursor-pointer">
              <div className="flex items-center gap-3 bg-neutral-900/60 border-2 border-dashed border-white/10 rounded-lg px-4 py-3 hover:border-(--color-primary) hover:bg-(--color-primary-hover)/5 transition-all">
                <MdImage className="text-2xl text-gray-400" />
                <div>
                  <p className="text-sm text-white font-medium">Оберіть файл</p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WEBP до 5MB. Рекомендовано: 1920x1080.
                  </p>
                </div>
              </div>
              <input name="image" id="image" type="file" accept="image/*" onChange={onImageChange} className="hidden"/>
            </label>
          </div>
        </div>
        {imagePreview && (
          <div className="w-full lg:w-80 h-64 rounded-lg overflow-hidden border-2 border-white/10 shrink-0">
            <img src={imagePreview} alt="Preview" className="object-cover w-full h-full"/>
          </div>
        )}
      </div>
    </section>
  )
}
