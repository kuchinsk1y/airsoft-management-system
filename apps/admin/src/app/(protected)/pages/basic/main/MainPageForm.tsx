'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageSeoSection from '@/app/components/seo/PageSeoSection'
import MainInfoSection from './components/MainInfoSection'
import MainBannerSection from './components/MainBannerSection'
import PartnersSection from './components/PartnersSection'
import FaqSection from './components/FaqSection'
import SaveButton from './components/SaveButton'
import Toast, { ToastMessage } from '@/app/components/Toast'
import { deepClone } from '@/app/utils/helpers'
import { hasMainChanges, buildMainPatchConfig } from '@/app/utils/main'
import { patchTemplate, updateTemplate, uploadTemplateImage } from '@/actions/template'
import { NEXT_PUBLIC_API_URL } from '@/app/utils/config'
import type {
  MainPageData,
  HeroBlock,
  PartnersBlock,
  FaqBlock,
  BannerBlock,
} from '@/types'
import LoadingSpinner from '@/app/components/LoadingSpinner'

interface Props {
  initialData: MainPageData;
}

export default function MainPageForm({ initialData }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
  const [formData, setFormData] = useState(initialData)
  const heroBlock = formData.content.find(b => b.type === 'hero') as HeroBlock | undefined

  const updateMainContentBlock = <T extends MainPageData['content'][number]>(
    type: T['type'],
    updater: (block: T | undefined) => T,
  ) => {
    setFormData((prev) => {
      const content = [...prev.content]
      const index = content.findIndex((block) => block.type === type)
      const currentBlock = (index >= 0 ? content[index] : undefined) as T | undefined
      const nextBlock = updater(currentBlock)

      if (index >= 0) {
        content[index] = nextBlock
      } else {
        content.push(nextBlock)
      }

      return {
        ...prev,
        content,
      }
    })
  }
  
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('/uploads')) {
      return `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${url}`;
    }
    return url;
  };

  const [imagePreview, setImagePreview] = useState<string | null>(
    getImageUrl(heroBlock?.image) || null,
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const initialRef = useRef<MainPageData>(deepClone(initialData));

  const hasChanges =
    hasMainChanges(formData, initialRef.current) || !!pendingImageFile;

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Только сохраняем локальный preview и файл, загружаем только при Save
    setPendingImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Якщо є новий файл картинки, завантажити його
      if (pendingImageFile) {
        const field = 'hero.image';
        const result = await uploadTemplateImage(
          'main',
          pendingImageFile,
          field,
        );
        if (!result.success) throw new Error(result.error);
        const url = (result.data as { url: string }).url;
        setFormData((prev) => ({
          ...prev,
          content: prev.content.map((b) =>
            b.type === 'hero' ? { ...b, image: url } : b,
          ),
        }));
        setPendingImageFile(undefined);
      }

      const cfg = buildMainPatchConfig(formData, initialRef.current);

      let result = await patchTemplate('main', cfg);

      if (!result.success && result.error.includes('404')) {
        result = await updateTemplate('main', {
          title: formData.title,
          description: formData.description,
          seo: formData.seo,
          content: formData.content,
        });
      }

      if (result.success) {
        initialRef.current = deepClone(formData);
        router.refresh();
        addToast('Зміни успішно збережені!', 'success');
      } else {
        addToast('Помилка при збереженні: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      addToast('Помилка мережі', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const partnersBlock = formData.content.find((b) => b.type === 'partners') as
    | PartnersBlock
    | undefined;
  const faqBlock = formData.content.find((b) => b.type === 'faq') as
    | FaqBlock
    | undefined;
  const bannerBlock = formData.content.find((b) => b.type === 'banners') as
    | BannerBlock
    | undefined;

  return (
    <div className=" relative space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Редактор головної сторінки
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Керування контентом головної сторінки сайту
          </p>
        </div>
        <Link
          href="/pages/basic"
          className="h-9 px-4 flex items-center rounded-lg border border-white/10 text-gray-200 text-sm hover:bg-white/5 transition-colors"
        >
          Назад
        </Link>
      </div>

      <form className="space-y-6">
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
            <MainInfoSection title={formData.title} description={formData.description} imagePreview={imagePreview} onTitleChange={(value: string) => setFormData({ ...formData, title: value })} onDescriptionChange={(value: string) => setFormData({ ...formData, description: value })} onImageChange={handleImageChange}/>

            <MainBannerSection
              section={bannerBlock ? { items: bannerBlock.items } : { items: [] }}
              onChange={(items) => {
                updateMainContentBlock<BannerBlock>('banners', (block) => ({
                  type: 'banners',
                  title: block?.title,
                  items,
                }))
              }}
            />

            <PartnersSection section={partnersBlock ? {items: partnersBlock.items} : {items: []}}
              onChange={items => {
                setFormData(prev => ({
                  ...prev,
                  content: prev.content.map(b => b.type === 'partners' ? { ...b, items } : b)
                }))
              }}
            />

            <FaqSection section={faqBlock ? {type: faqBlock.type, title: faqBlock.title, items: faqBlock.items} : undefined}
              onChange={items => {
                setFormData(prev => ({
                  ...prev,
                  content: prev.content.map(b => b.type === 'faq' ? { ...b, items } : b)
                }))
              }}
            />
          </>
        )}

        {activeTab === 'seo' && (
          <PageSeoSection
            seo={formData.seo}
            onChange={(seo) => setFormData(prev => ({ ...prev, seo }))}
            idPrefix="main"
            canonicalPlaceholder="/"
            ogImagePlaceholder="/uploads/og-main.jpg"
            seoTextPlaceholder="Додатковий SEO-текст для сторінки"
            showFaqSection={false}
          />
        )}

        <SaveButton
          isSaving={isSaving}
          onClick={handleSave}
          disabled={!hasChanges}
        />
        <Toast messages={toasts} onRemove={removeToast} />
        {isSaving && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] rounded-xl">
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center gap-2">
              <LoadingSpinner thickness="normal" />
              <p className="text-sm text-gray-200">Зберігаємо зміни...</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
