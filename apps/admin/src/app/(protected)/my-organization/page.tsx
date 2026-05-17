'use client';

import { updateApplication } from '@/actions/applications';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Toast, { ToastMessage } from '@/app/components/Toast';
import { useApplication } from '@/contexts/ApplicationContext';
import { useCallback, useEffect, useState } from 'react';
import { MdSave } from 'react-icons/md';

export default function MyOrganizationPage() {
  const { currentApplication, refreshApplications } = useApplication();
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [savedData, setSavedData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    description: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    description: '',
  });

  const isDirty =
    formData.name !== savedData.name ||
    formData.address !== savedData.address ||
    formData.phoneNumber !== savedData.phoneNumber ||
    formData.description !== savedData.description;

  const addToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (currentApplication) {
      const data = {
        name: currentApplication.name ?? '',
        address: currentApplication.address ?? '',
        phoneNumber: currentApplication.phoneNumber ?? '',
        description: currentApplication.description ?? '',
      };
      setFormData(data);
      setSavedData(data);
    }
  }, [currentApplication]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentApplication) return;

    if (!formData.name.trim()) {
      addToast("Назва організації обов'язкова", 'error');
      return;
    }

    if (
      formData.phoneNumber.trim() &&
      !/^\+?380[0-9]{9}$/.test(formData.phoneNumber)
    ) {
      addToast(
        'Номер телефону має бути у форматі +380XXXXXXXXX (12-13 символів)',
        'error',
      );
      return;
    }

    try {
      setIsSaving(true);
      await updateApplication(currentApplication.id, {
        name: formData.name,
        address: formData.address || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        description: formData.description || undefined,
      });
      await refreshApplications();
      setSavedData(formData);
      addToast('Дані організації збережено', 'success');
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Помилка при збереженні',
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentApplication) {
    return (
      <div className="flex items-center justify-center h-72">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Toast messages={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Моя організація
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Керуйте даними вашої організації
          </p>
        </div>

        <button
          type="submit"
          form="org-form"
          disabled={isSaving || !isDirty}
          className="h-9 px-4 inline-flex items-center rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <MdSave size={16} className="mr-1" />
              Зберегти
            </>
          )}
        </button>
      </div>

      <form id="org-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="p-5 rounded-xl border-2 border-white/10 bg-black/30">
          <h2 className="text-white font-semibold mb-4">Основна інформація</h2>

          <label className="block text-sm text-gray-300 mb-2">
            Назва організації <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Назва вашої організації"
            className="w-full px-4 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
            disabled={isSaving}
          />

          <label className="block text-sm text-gray-300 mt-4 mb-2">
            Адреса
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="вул. Головна, 123, Київ"
            className="w-full px-4 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
            disabled={isSaving}
          />

          <label className="block text-sm text-gray-300 mt-4 mb-2">
            Контактний номер
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="+380671112233"
            className="w-full px-4 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
            disabled={isSaving}
          />
        </section>

        <section className="p-5 rounded-xl border-2 border-white/10 bg-black/30">
          <h2 className="text-white font-semibold mb-4">Про організацію</h2>

          <label className="block text-sm text-gray-300 mb-2">Опис</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Розкажіть про вашу організацію..."
            rows={5}
            className="w-full min-h-28 px-4 py-3 bg-white/5 text-white rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none resize-y"
            disabled={isSaving}
          />
        </section>
      </form>
    </div>
  );
}
