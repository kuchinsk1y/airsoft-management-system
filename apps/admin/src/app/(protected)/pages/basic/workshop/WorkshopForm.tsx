'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageSeoSection from '@/app/components/seo/PageSeoSection';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Toast, { ToastMessage } from '@/app/components/Toast';
import WorkshopMetaSection from './components/WorkshopMetaSection';
import WorkshopContactsSection from './components/WorkshopContactsSection';
import SaveButton from '../main/components/SaveButton';
import { deepClone } from '@/app/utils/helpers';
import {
  patchTemplate,
  updateTemplate,
  uploadTemplateImage,
} from '@/actions/template';
import type {
  WorkshopPageData,
  WorkshopContactsBlock,
} from '@/types';


interface Props {
  initialData: WorkshopPageData;
}

export default function WorkshopForm({ initialData }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  const resolvePreviewUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('/uploads')) return url;

    const uploadsIndex = url.indexOf('/uploads/');
    if (uploadsIndex >= 0) {
      return url.slice(uploadsIndex);
    }

    return url;
  };

  const [formData, setFormData] = useState<WorkshopPageData>(
    deepClone(initialData),
  );
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(
    resolvePreviewUrl(initialData.heroImage),
  );
  const [pendingHeroImage, setPendingHeroImage] = useState<File | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const initialRef = useRef<WorkshopPageData>(deepClone(initialData));

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const replaceContactsBlock = (updated: WorkshopContactsBlock) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content.map((b) => (b.type === updated.type ? updated : b)),
    }));
  };

  const contactsBlock: WorkshopContactsBlock = (formData.content.find(
    (b) => b.type === 'contacts',
  ) as WorkshopContactsBlock | undefined) ?? {
    type: 'contacts',
    title: '',
    address: [],
    phone: [],
    workingHours: [],
  };

  const hasChanges =
    JSON.stringify(formData) !== JSON.stringify(initialRef.current) ||
    !!pendingHeroImage;

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingHeroImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setHeroImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTitleChange = (v: string) => {
    setFormData((prev) => ({ ...prev, title: v }));
  };

  const handleDescriptionChange = (v: string) => {
    setFormData((prev) => ({ ...prev, description: v }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const nextData = deepClone(formData);
      nextData.content = nextData.content.filter(
        (block): block is WorkshopContactsBlock => block.type === 'contacts',
      );

      const cfg: Record<string, unknown> = {
        title: nextData.title,
        description: nextData.description,
        seo: nextData.seo,
        heroImage: nextData.heroImage,
        content: nextData.content,
      };

      let saveResult = await patchTemplate('workshop', cfg);
      if (!saveResult.success && saveResult.error.includes('404')) {
        saveResult = await updateTemplate('workshop', cfg);
      }
      if (!saveResult.success) {
        addToast('Помилка при збереженні: ' + saveResult.error, 'error');
        setIsSaving(false);
        return;
      }

      if (pendingHeroImage) {
        const r = await uploadTemplateImage(
          'workshop',
          pendingHeroImage,
          'heroImage',
        );
        if (!r.success) {
          addToast('Помилка завантаження зображення: ' + r.error, 'error');
          setIsSaving(false);
          return;
        }
        const uploaded = r.data as { url?: string };
        if (uploaded.url) {
          nextData.heroImage = uploaded.url;
          setHeroImagePreview(resolvePreviewUrl(uploaded.url));
        }
        setPendingHeroImage(undefined);
      }

      const finalCfg: Record<string, unknown> = {
        title: nextData.title,
        description: nextData.description,
        seo: nextData.seo,
        heroImage: nextData.heroImage,
        content: nextData.content,
      };

      let finalResult = await patchTemplate('workshop', finalCfg);
      if (!finalResult.success && finalResult.error.includes('404')) {
        finalResult = await updateTemplate('workshop', finalCfg);
      }
      if (!finalResult.success) {
        addToast(
          'Помилка фінального збереження: ' + finalResult.error,
          'error',
        );
        setIsSaving(false);
        return;
      }

      setFormData(nextData);
      initialRef.current = deepClone(nextData);
      router.refresh();
      addToast('Зміни успішно збережені!', 'success');
    } catch (e) {
      addToast(
        'Помилка мережі: ' + (e instanceof Error ? e.message : ''),
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${activeTab === 'content' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          Контент
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`h-9 px-4 rounded-lg text-sm transition-colors ${activeTab === 'seo' ? 'bg-(--color-primary) text-white font-semibold' : 'text-gray-300 hover:bg-white/5'}`}
        >
          SEO
        </button>
      </div>

      {activeTab === 'content' && (
        <>
          <WorkshopMetaSection
            title={formData.title}
            description={formData.description}
            imagePreview={heroImagePreview}
            onTitleChange={handleTitleChange}
            onDescriptionChange={handleDescriptionChange}
            onImageChange={handleHeroImageChange}
          />

          <WorkshopContactsSection block={contactsBlock} onChange={replaceContactsBlock} />
        </>
      )}

      {activeTab === 'seo' && (
        <PageSeoSection
          seo={formData.seo}
          onChange={(seo) => setFormData((prev) => ({ ...prev, seo }))}
          heading="SEO налаштування сторінки майстерні"
          idPrefix="workshop"
          canonicalPlaceholder="/workshop"
          ogImagePlaceholder="/uploads/og-workshop.jpg"
        />
      )}

      {isSaving && (
       <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] rounded-xl">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center gap-2">
          <LoadingSpinner thickness="normal" />
          <p className="text-sm text-gray-200">Зберігаємо зміни...</p>
        </div>
        </div>
      )}

      <SaveButton
        isSaving={isSaving}
        onClick={handleSave}
        disabled={!hasChanges}
      />
      <Toast messages={toasts} onRemove={removeToast} />
    </div>
  );
}
