'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MdAdd, MdDelete, MdImage } from 'react-icons/md';
import type { WorkshopCardData } from '@/types';
import DeleteBlockConfirmModal from './DeleteConfirmModal';

interface WorkshopCardsSectionProps {
  sectionKey: string;
  label: string;
  sectionTitle: string;
  items: WorkshopCardData[];
  imagePreviews: Map<number, string>;
  onSectionTitleChange: (v: string) => void;
  onItemsChange: (items: WorkshopCardData[]) => void;
  onCardImageChange: (index: number, file: File) => void;
}

function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads')) return url;

  const uploadsIndex = url.indexOf('/uploads/');
  if (uploadsIndex >= 0) return url.slice(uploadsIndex);

  return url;
}

interface WorkshopCardRowProps {
  sectionKey: string;
  index: number;
  card: WorkshopCardData;
  displayImage: string;
  onRemove: (i: number) => void;
  onTitleChange: (i: number, value: string) => void;
  onDescriptionChange: (i: number, value: string) => void;
  onImageChange: (i: number, file: File) => void;
}

function WorkshopCardRow({
  sectionKey,
  index,
  card,
  displayImage,
  onRemove,
  onTitleChange,
  onDescriptionChange,
  onImageChange,
}: WorkshopCardRowProps) {
  return (
    <div
      key={`${sectionKey}-card-${index}`}
      className="p-4 rounded-lg border border-white/10 bg-white/3 space-y-3 contain-content"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">
          Картка #{index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Видалити картку"
          title="Видалити картку"
          className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <MdDelete className="text-base" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)] gap-4 items-stretch">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 font-medium">
            Зображення
          </label>
          <label className="cursor-pointer">
            <div className="flex items-center gap-2 bg-neutral-900/60 border border-dashed border-white/10 rounded-lg px-3 py-2 hover:border-(--color-primary) transition-all">
              <MdImage className="text-lg text-gray-400" />
              <span className="text-xs text-gray-400">Завантажити</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImageChange(index, f);
              }}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-gray-500">
            Рекомендовано: 1200x800 (3:2), мінімум 900x600.
          </p>
          <div className="flex items-center lg:w-full h-60 lg:h-29 pl-5 lg:pl-0 rounded overflow-hidden border border-white/10 bg-black/20 mt-auto">
            <div className="relative w-70 h-50 overflow-hidden rounded-lg lg:w-full lg:h-full">
              {displayImage && (
                <Image
                  src={displayImage}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 180px"
                  quality={50}
                  className="object-cover"
                  unoptimized={
                    displayImage.startsWith('data:') ||
                    displayImage.startsWith('blob:')
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 h-full flex-col justify-between items-stretch">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-medium">Назва</label>
            <input
              value={card.title}
              onChange={(e) => onTitleChange(index, e.target.value)}
              placeholder="Назва картки"
              className="w-full bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            />
          </div>
          <div className=" h-full flex gap-2 flex-col justify-between">
            <label className="text-xs text-gray-400 font-medium">Опис</label>
            <textarea
              value={card.description}
              onChange={(e) => onDescriptionChange(index, e.target.value)}
              placeholder="Опис картки"
              className="w-full mt-1 bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkshopCardsSection({
  sectionKey,
  label,
  sectionTitle,
  items,
  imagePreviews,
  onSectionTitleChange,
  onItemsChange,
  onCardImageChange,
}: WorkshopCardsSectionProps) {
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(
    null,
  );

  const addCard = () => {
    onItemsChange([...items, { image: '', title: '', description: '' }]);
  };

  const requestRemoveCard = (i: number) => {
    setPendingDeleteIndex(i);
  };

  const confirmRemoveCard = () => {
    if (pendingDeleteIndex === null) return;
    onItemsChange(items.filter((_, idx) => idx !== pendingDeleteIndex));
    setPendingDeleteIndex(null);
  };

  const updateCard = (
    i: number,
    field: keyof WorkshopCardData,
    value: string,
  ) => {
    onItemsChange(
      items.map((card, idx) =>
        idx === i ? { ...card, [field]: value } : card,
      ),
    );
  };

  return (
    <section className="space-y-4 p-6 rounded-xl border-2 border-white/10 bg-black/30">
      <div>
        <h2 className="text-lg font-semibold text-white">{label}</h2>
        <p className="text-xs text-gray-400 mt-0.5">Картки секції «{label}».</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400 font-medium">
          Заголовок секції
        </label>
        <input
          value={sectionTitle}
          onChange={(e) => onSectionTitleChange(e.target.value)}
          placeholder="Напр., Наші послуги"
          className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
        />
      </div>

      <div className="space-y-4">
        {items.map((card, i) => {
          const displayImage =
            imagePreviews.get(i) || resolveImageUrl(card.image);
          return (
            <WorkshopCardRow
              key={`${sectionKey}-card-${i}`}
              sectionKey={sectionKey}
              index={i}
              card={card}
              displayImage={displayImage}
              onRemove={requestRemoveCard}
              onTitleChange={(idx, value) => updateCard(idx, 'title', value)}
              onDescriptionChange={(idx, value) =>
                updateCard(idx, 'description', value)
              }
              onImageChange={onCardImageChange}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={addCard}
        className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 text-gray-300 hover:border-(--color-primary) hover:text-(--color-primary) hover:bg-(--color-primary-hover)/5 transition-all"
      >
        <MdAdd className="text-base" />
        <span className="text-sm font-medium">Додати картку</span>
      </button>

      <DeleteBlockConfirmModal
        isOpen={pendingDeleteIndex !== null}
        onConfirm={confirmRemoveCard}
        onCancel={() => setPendingDeleteIndex(null)}
        blockName={
          pendingDeleteIndex !== null
            ? items[pendingDeleteIndex]?.title?.trim() ||
              `Картка #${pendingDeleteIndex + 1}`
            : undefined
        }
      />
    </section>
  );
}
