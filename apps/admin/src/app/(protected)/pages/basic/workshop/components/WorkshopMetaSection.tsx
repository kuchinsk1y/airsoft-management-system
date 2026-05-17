'use client';

import Image from 'next/image';
import { MdImage } from 'react-icons/md';

interface WorkshopMetaSectionProps {
  title: string;
  description: string;
  imagePreview: string | null;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function WorkshopMetaSection({
  title,
  description,
  imagePreview,
  onTitleChange,
  onDescriptionChange,
  onImageChange,
}: WorkshopMetaSectionProps) {
  return (
    <section className="space-y-5 p-6 rounded-xl border-2 border-white/10 bg-black/30">
      <div>
        <h2 className="text-lg font-semibold text-white">Основні дані</h2>
        <p className="text-xs text-gray-400 mt-1">
          Заголовок, опис і головне зображення сторінки.
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 ">
        <div className="flex-1 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">
              Заголовок
            </label>
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Напр., Майстерня Strikeshop"
              className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Опис</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Короткий опис сторінки"
              className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-medium">
              Головне зображення
            </label>
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
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div className="flex items-center w-full lg:w-80 h-77 pl-5 lg:pl-0 rounded-lg  border-2 border-white/10 shrink-0 bg-black/20">
          <div className="relative w-87 h-67 overflow-hidden rounded-lg lg:w-full lg:h-full">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                quality={50}
                className="object-cover"
                unoptimized={
                  imagePreview.startsWith('data:') ||
                  imagePreview.startsWith('blob:')
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
