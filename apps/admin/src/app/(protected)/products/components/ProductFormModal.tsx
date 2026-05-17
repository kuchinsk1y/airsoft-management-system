'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { NEXT_PUBLIC_API_URL } from '@/app/utils/config';
import { DealType, Product, ProductFormData } from '../types';
import { MdClose } from 'react-icons/md';
import CityCombobox from '../../../components/CityCombobox';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: ProductFormData,
    id?: number,
    imageFile?: File,
  ) => void | Promise<void>;
  initialProduct?: Product | null;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: 1,
  image: '',
  inStock: true,
  isActive: true,
  dealType: DealType.RENT,
  city: '',
};

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
}: Props) {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setForm({
          name: initialProduct.name || '',
          description: initialProduct.description || '',
          price: initialProduct.price || 0,
          image: initialProduct.image || '',
          inStock: initialProduct.inStock,
          isActive: initialProduct.isActive,
          dealType: initialProduct.dealType || DealType.RENT,
          city: initialProduct.city?.name || '',
        });
      } else {
        setForm(emptyForm);
      }
      setImageFile(undefined);
    }
  }, [initialProduct, isOpen]);

  const handleChange = (
    key: keyof ProductFormData,
    value: string | number | boolean | DealType | undefined,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await Promise.resolve(onSubmit(form, initialProduct?.id, imageFile));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {initialProduct ? 'Редагувати продукт' : 'Новий продукт'}
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm">
              Заповніть поля та збережіть
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Закрити"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto custom-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Назва</label>
              <input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
                placeholder="Напр., Прокат штурмової гвинтівки"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Ціна, грн
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.price}
                onChange={(e) => handleChange('price', Number(e.target.value))}
                className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
                placeholder="0"
                title="Ціна"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Тип угоди
              </label>
              <select
                value={form.dealType}
                onChange={(e) =>
                  handleChange('dealType', e.target.value as DealType)
                }
                className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
                title="Тип угоди"
              >
                <option value={DealType.RENT}>Оренда</option>
                <option value={DealType.SALE}>Продаж</option>
              </select>
            </div>
            <div>
              <CityCombobox
                value={form.city || ''}
                onChange={(cityName) => handleChange('city', cityName)}
                title="Місто (опційно)"
                placeholder="Введіть назву міста..."
                required={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Опис</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none min-h-20 sm:min-h-25 text-sm"
              placeholder="Короткий опис продукту"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Зображення *
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Формати: JPG, JPEG, PNG, WEBP. Рекомендований розмір для
              карток подій і товарів: 1600x900 (16:9). Мінімальний без
              помітної втрати якості: 1200x675.
            </p>
            {form.image && !imageFile && (
              <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <Image
                  src={getImageUrl(form.image)}
                  alt="Поточне зображення"
                  width={128}
                  height={128}
                  className="max-h-28 sm:max-h-32 max-w-xs rounded-lg object-cover"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Поточне зображення. Завантажте нове для заміни.
                </p>
              </div>
            )}
            {imageFile && (
              <div className="mb-3 p-3 bg-white/5 rounded-lg border border-white/10">
                <Image
                  src={URL.createObjectURL(imageFile)}
                  alt="Нове зображення"
                  width={128}
                  height={128}
                  className="max-h-28 sm:max-h-32 max-w-xs rounded-lg object-cover"
                />
                <p className="text-xs text-green-400 mt-2">
                  Нове зображення до завантаження
                </p>
              </div>
            )}
            <input
              type="file"
              required={!initialProduct || !form.image}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              title="Завантажити зображення"
              aria-label="Завантажити зображення"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImageFile(file || undefined);
                if (file) {
                  handleChange('image', file.name);
                }
              }}
              className="w-full text-xs sm:text-sm text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-(--color-primary) file:text-white hover:file:bg-(--color-primary-hover) cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => handleChange('inStock', e.target.checked)}
                className="accent-(--color-primary)"
              />
              В наявності
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="accent-(--color-primary)"
              />
              Активний
            </label>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-white/15 text-gray-200 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold shadow-lg shadow-(--color-primary)/20 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? 'Обробка...'
                : initialProduct
                  ? 'Оновити'
                  : 'Створити'}
            </button>
          </div>
        </form>
      </div>
      {isSubmitting && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
          <LoadingSpinner size="lg" thickness="thin" />
        </div>
      )}
    </div>
  );
}
