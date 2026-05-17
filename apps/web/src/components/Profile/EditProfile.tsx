'use client';

import { updateUserProfile } from '@/actions/update-user';
import { uploadAvatar } from '@/actions/upload-avatar';
import { UserUpdateFieldConfig } from '@/interfaces';
import Loader from '@/components/generics/loader/Loader';
import { useUserStore } from '@/stores/userStore';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { ButtonHTMLAttributes, useRef, useState } from 'react';
import EditProfileForm from './EditProfileForm';
import { UpdateUserData } from './schemas/updateUserSchema';

const formFields: UserUpdateFieldConfig[] = [
  {
    id: 'name',
    label: "ІМ'Я",
    helperText: '(ДЛЯ ВІДПРАВКИ ЗАМОВЛЕНЬ ТА РЕЄСТРАЦІЇ У ГРІ)',
  },
  {
    id: 'lastName',
    label: 'ПРІЗВИЩЕ',
    helperText: '(ДЛЯ ВІДПРАВКИ ЗАМОВЛЕНЬ ТА РЕЄСТРАЦІЇ У ГРІ)',
  },
  { id: 'nickName', label: 'ПОЗИВНИЙ' },
  { id: 'dateOfBirth', label: 'ДАТА НАРОДЖЕННЯ' },
  {
    id: 'phoneNumber',
    label: 'НОМЕР ТЕЛЕФОНУ',
    helperText: '(ДЛЯ ВІДПРАВКИ ЗАМОВЛЕНЬ ТА РЕЄСТРАЦІЇ У ГРІ)',
  },
  { id: 'country', label: 'КРАЇНА' },
  { id: 'region', label: 'РЕГІОН' },
  { id: 'city', label: 'МІСТО' },
];

export default function EditProfile({onCancel}:{onCancel?: ()=>void}) {
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const  currentUser  = useUserStore((state) => state.currentUser);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const avatarSrc = previewUrl || currentUser?.avatarUrl || '/profile-avatar.jpg';

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaveError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFile(file);
  };

  async function onSubmit(data: UpdateUserData) {
    setIsSaving(true);
    setSaveError(null);
    try {
      const avatarPromise = file
        ? (() => {
          const formData = new FormData();
          formData.append('file', file);
          return uploadAvatar(formData);
        })()
        : Promise.resolve(null);

      const profilePromise = updateUserProfile(data);

       await Promise.all([
        avatarPromise,
        profilePromise,
      ]);

      await fetchUser(true);

      handleCancel()
      window.scrollTo({top: 0, behavior: 'smooth'})
    } catch (error) {
      console.error('Помилка при збереженні профілю:', error);
      if (error instanceof Error && error.message) {
        const message = error.message;
        const looksTechnical =
          message.includes('Cannot read properties') ||
          message.includes('undefined') ||
          message.includes('TypeError');

        setSaveError(
          looksTechnical
            ? 'Сталася помилка. Спробуйте ще раз або оновіть сторінку.'
            : message,
        );
      } else {
        setSaveError('Не вдалося зберегти профіль. Спробуйте ще раз.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative flex flex-col">
      {isSaving ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader text="Збереження..." />
        </div>
      ) : null}
      <div className="flex items-center justify-between w-full p-3 border-b border-[#FFFFFF] min991:p-0 min991:border-0 text-xs min991:text-[20px] font-bold upercase">
        <button
          className=" flex items-center bg-transparent text-white border border-white hover:bg-gray-800  text-xs min991:text-[20px] py-2 pr-7 pl-2.5 gap-2.5 min991:pr-7.5 min991:pl-2 font-bold uppercase"
          onClick={handleCancel}
        >
          <ChevronLeft className="w-3 h-4 min991:w-6 min991:h-6" />
          НАЗАД
        </button>
        РЕДАГУВАТИ ПРОФІЛЬ
      </div>
      <div className="flex items-center min991:mt-10 gap-6 p-2.5 border-b border-[#FFFFFF] min991:border-0 min991:p-0">
        <div className="relative w-37.5 h-37.5 min991:w-70 min991:h-70 ">
          <Image
            src={avatarSrc}
            alt="Avatar"
            priority
            fill
            className="object-cover"
          />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          id="avatar-upload"
          aria-label="Завантажити фото профілю"
          title="Завантажити фото профілю"
          className="hidden"
        />
        <button
          onClick={handleButtonClick}
          type="button"
          aria-label="Змінити фото профілю"
          title="Змінити фото профілю"
          className=" flex items-center justify-center  px-6 py-3 text-[#FF4D00] text-xs font-semibold transition-all duration-200 ease-in-out "
        >
          ЗМІНИТИ ФОТО
        </button>
      </div>
      <EditProfileForm
        fields={formFields}
        user={currentUser}
        onSubmit={onSubmit}
        onAnyChange={() => setSaveError(null)}
      />

     <div className="mt-10 mb-4.5 flex flex-col gap-2 
                min991:flex-row 
                min991:items-center 
                min991:justify-end">

  {saveError && (
    <div className="text-red-500 text-xs uppercase ml-2 min991:ml-0 min991:mr-auto">
      {saveError}
    </div>
  )}

  <CustomBtn
    formId="userForm"
    type="submit"
    text="ЗБЕРЕГТИ"
    className="bg-[#FA4616] text-[20px] font-bold text-[#FFFFFF] py-5 min991:w-50"
  />
</div>
    </div>
  );
}

interface CustomBtnProps {
  childrenBefore?: React.ReactNode;
  childrenAfter?: React.ReactNode;
  text: string;
  className: string;
  type: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  formId?: string;
  onClick?: () => void;
}

function CustomBtn({
  formId,
  childrenAfter,
  childrenBefore,
  className,
  type,
  onClick,
  text,
}: CustomBtnProps) {
  return (
    <button type={type} form={formId} className={className} onClick={onClick}>
      {childrenBefore}
      {text}
      {childrenAfter}
    </button>
  );
}
