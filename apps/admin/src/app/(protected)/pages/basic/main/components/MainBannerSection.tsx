import { uploadTemplateImage } from '@/actions/template';
import { useEffect, useState } from 'react';
import { NEXT_PUBLIC_API_URL } from '@/app/utils/config';
import {
  MdAdd,
  MdBusiness,
  MdDelete,
  MdEdit,
  MdImage,
} from 'react-icons/md';
import Image from 'next/image';

type Banner = {
  id: number;
  title: string;
  image: string;
  description: string;
  link: string;
  isActive: boolean;
};

interface MainBannerSectionProps {
  section?: {
    items: Banner[];
  };
  onChange: (items: Banner[]) => void;
}

export default function MainBannerSection({
  section,
  onChange,
}: MainBannerSectionProps) {
  const [uploading, setUploading] = useState<number | null>(null);
  const banners = section?.items ?? [];
  const activeBannersCount = banners.filter((item) => item.isActive).length;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [localPreviews, setLocalPreviews] = useState<Record<number, string>>({});

  useEffect(() => {
    return () => {
      Object.values(localPreviews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [localPreviews]);

  const setLocalPreview = (index: number, nextUrl?: string) => {
    setLocalPreviews((prev) => {
      const currentUrl = prev[index];
      if (currentUrl && currentUrl !== nextUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      if (!nextUrl) {
        const { [index]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [index]: nextUrl,
      };
    });
  };

  const resolveBannerImage = (index: number, image: string) => {
    const preview = localPreviews[index];
    if (preview) {
      return preview;
    }

    if (image.startsWith('/uploads')) {
      return `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${image}`;
    }

    return image;
  };

  const handleBannerUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(index, previewUrl);
    setUploading(index);
    const field = `banners[${index}].image`;

    try {
      const result = await uploadTemplateImage('main', file, field);
      if (!result.success) throw new Error(result.error);
      const url = (result.data as { url: string }).url;
      updateBanner(index, 'image', url);
    } catch (err) {
      setLocalPreview(index);
      console.error('Upload error:', err);
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const addBanner = () => {
    const newBanner: Banner = {
      id: banners.length + 1,
      title: '',
      image: '',
      link: '',
      description: '',
      isActive: false,
    };
    const newItems = [...banners, newBanner];
    //setBanners(newBanners);
    onChange(newItems);
    setEditingIndex(banners.length);
  };

  const removeBanner = (indexToRemove: number) => {
    setLocalPreview(indexToRemove);
    const newItems = banners.filter((_, index) => index !== indexToRemove);
    //setBanners(newBanners);
    onChange(newItems);
    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
    }
  };

  const updateBanner = (
    index: number,
    field: keyof Banner,
    value: string | boolean,
  ) => {
    const updated = banners.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );

    onChange(updated);
  };

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.08),transparent_40%),rgba(255,255,255,0.02)] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Баннер</h2>
          <p className="mt-1 text-xs text-gray-400">
          Рекламний банер на головній сторінці
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-gray-300">
          <span>Всього: {banners.length}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="text-emerald-300">Активних: {activeBannersCount}</span>
        </div>
      </div>

      <div className="space-y-4">
        {banners.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 transition-all sm:p-5 ${
              editingIndex === index
                ? 'border-(--color-primary)/55 bg-black/45 shadow-[0_14px_40px_rgba(255,107,0,0.08)]'
                : 'border-white/10 bg-black/25 hover:border-white/20'
            }`}
          >
            <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${editingIndex === index ? 'mb-5' : 'mb-0'}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-lg bg-(--color-primary)/10 p-2.5">
                  <MdBusiness className="text-xl text-(--color-primary)" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold leading-tight text-white">
                      {item.title || `Баннер ${index + 1}`}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        item.isActive
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-gray-600/40 bg-gray-600/10 text-gray-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.isActive ? 'bg-emerald-400' : 'bg-gray-500'
                        }`}
                      />
                      {item.isActive ? 'Активний' : 'Вимкнений'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() =>
                    setEditingIndex(editingIndex === index ? null : index)
                  }
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                    editingIndex === index
                      ? 'bg-(--color-primary) text-white hover:bg-(--color-primary-hover)'
                      : 'border border-white/10 text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <MdEdit className="text-base" />
                  <span>{editingIndex === index ? 'Завершити' : 'Редагувати'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeBanner(index)}
                  title="Видалити банер"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/25 text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <MdDelete className="text-base" />
                </button>
              </div>
            </div>

            {editingIndex === index ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-medium">
                    Назва партнера, який рекламується
                  </label>
                  <input
                    name={`items[${index}][title]`}
                    value={item.title}
                    onChange={(e) =>
                      updateBanner(index, 'title', e.target.value)
                    }
                    placeholder="Введіть назву"
                    title="Назва банера"
                    className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs text-gray-400 font-medium">
                    Опис банера
                  </label>

                  <textarea
                    name={`items[${index}][description]`}
                    value={item.description}
                    onChange={(e) =>
                      updateBanner(index, 'description', e.target.value)
                    }
                    placeholder="Введіть опис банера"
                    className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-h-20 focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-medium">
                    URL сайту партнера який рекламується на банері
                  </label>
                  <input
                    name={`items[${index}][link]`}
                    value={item.link}
                    onChange={(e) =>
                      updateBanner(index, 'link', e.target.value)
                    }
                    placeholder="https://example.com"
                    title="Посилання на сайт партнера"
                    type="url"
                    className="bg-neutral-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-xs text-gray-400 font-medium">
                    Зображення банера
                  </label>
                  <div className="flex gap-4 items-start">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3 bg-neutral-900/60 border-2 border-dashed border-white/10 rounded-lg px-4 py-3 hover:border-(--color-primary) hover:bg-(--color-primary-hover)/5 transition-all">
                        <MdImage className="text-2xl text-gray-400" />
                        <div>
                          <p className="text-sm text-white font-medium">
                            {uploading === index
                              ? 'Завантаження...'
                              : 'Оберіть зображення'}
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, WEBP до 5MB. Рекомендовано: 1920x1080.
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBannerUpload(index, e)}
                        disabled={uploading === index}
                        className="hidden"
                      />
                    </label>
                    {item.image && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-white/10 shrink-0 relative">
                        <Image
                          src={resolveBannerImage(index, item.image)}
                          alt={item.title}
                          fill
                          className="object-contain bg-white/5"
                          unoptimized={Boolean(localPreviews[index])}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between md:col-span-2 mt-2">
                  <span className="text-sm text-gray-300">
                    Показувати банер
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateBanner(index, 'isActive', !item.isActive)
                    }
                    title={item.isActive ? 'Вимкнути банер' : 'Увімкнути банер'}
                    aria-label={item.isActive ? 'Вимкнути банер' : 'Увімкнути банер'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.isActive
                        ? 'bg-(--color-primary)'
                        : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 flex items-start gap-4 border-t border-white/6 pt-3.5">
                <div className="relative h-18 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  {item.image ? (
                    <Image
                      src={resolveBannerImage(index, item.image)}
                      alt={item.title || `Баннер ${index + 1}`}
                      fill
                      className="object-contain bg-white/5"
                      unoptimized={Boolean(localPreviews[index])}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center gap-1.5 text-xs text-gray-600">
                      <MdImage className="text-base" />
                      <span>Фото</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Опис</p>
                  {item.description ? (
                    <p className="mt-1 line-clamp-3 text-sm text-gray-300">{item.description}</p>
                  ) : (
                    <p className="mt-1 text-sm italic text-gray-600">—</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addBanner}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 text-gray-300 transition-all hover:border-(--color-primary) hover:bg-(--color-primary-hover)/5 hover:text-(--color-primary)"
      >
        <MdAdd className="text-xl" />
        <span className="font-medium">Додати рекламний банер</span>
      </button>
    </section>
  );
}
