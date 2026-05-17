'use client';

import { submitWorkshopForm } from '@/actions/workshop-services';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { GeneralButton } from '../generics/button/Button';
import { useState } from 'react';
import BackdropModal from '../generics/banners/BackdropModal';
import { useRouter } from 'next/navigation';
import SuccessIcon from '../icons/SuccessIcon';
import WarningIcon from '../icons/WarningIcon';
import Loader from '../generics/loader/Loader';
import { WorkshopFormProps } from '@/interfaces';

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ім'я має бути не менше 2 символів")
    .max(30, "Ім'я не може перевищувати 30 символів"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+380\d{9}$/, 'Номер телефону має бути у форматі +380XXXXXXXXX'),
  email: z
    .string()
    .trim()
    .email('Невірна адреса електронної пошти')
    .max(254, 'Адреса занадто довга'),
  topic: z.string()
    .trim(),
  company: z
    .string()
    .trim()
    .max(50, 'Назва компанії не може перевищувати 50 символів')
    .optional()
    .or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Повідомлення має містити щонайменше 10 символів')
    .max(500, 'Повідомлення не може перевищувати 500 символів'),
});
export type DataForm = z.infer<typeof schema>;

export default function OrderForm({ topic, fields }: WorkshopFormProps) {
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DataForm>({
    resolver: zodResolver(schema),
    defaultValues: { topic },
  });

  const onSubmit: SubmitHandler<DataForm> = async (data) => {
    setIsSubmitting(true);
    const result = await submitWorkshopForm(data);
    setIsSubmitting(false);
    if (result.success) {
      setServerMsg('Форма успішно надіслана, наш менеджер зв\'яжеться з вами найближчим часом');
      setIsSuccess(true);
      reset();
    } else {
       setServerMsg('Сталася помилка при надсиланні форми, спробуйте ще раз пізніше');  
      setIsSuccess(false);
    }
  };

  const handleCloseModal = () => {
    setServerMsg(null);
    if (isSuccess) {
      router.push('/workshop');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col w-full p-10  md:w-[50vw] lg:w-[40vw] mx-auto"
    >
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col w-full gap-1 mx-auto">
          <label
            className={`flex flex-col text-sm 1440:text-xl font-bold uppercase  items-start  `}
            htmlFor={field.name}
          >
            {field.label}
          </label>

          <input
            {...register(field.name as keyof DataForm)}
            className="w-full bg-transparent border border-white px-3 py-2 leading-none text-xs 1440:text-base  placeholder-[#5f6368] not-placeholder-shown:bg-[#E8F0FE] not-placeholder-shown:text-[#292A2D]  uppercase focus:outline-none transition-all"
            placeholder={field.placeholder}
            readOnly={field.name === 'topic'}
          />
          <div>
            {errors[field.name as keyof DataForm] ? (
              <p className="text-red-500 text-xs my-1">
                {errors[field.name as keyof DataForm]?.message}
              </p>
            ) : (
              <div className="h-6"></div>
            )}
          </div>
        </div>
      ))}
      <label
        className={`text-sm 1440:text-xl font-bold uppercase flex flex-col items-start mb-1 `}
        htmlFor="message"
      >
        Ваше звернення
      </label>
      <textarea
        {...register('message' as keyof DataForm)}
        name="message"
        id="message"
        placeholder="Напишіть ваше звернення..."
        className="w-full bg-transparent border border-white px-3 py-2 placeholder-[#5f6368] not-placeholder-shown:bg-[#E8F0FE] not-placeholder-shown:text-[#292A2D] text-xs 1440:text-base  uppercase focus:outline-none transition-all h-32 resize-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      ></textarea>
      <div>
        {errors.message ? (
          <p className="text-red-500 text-xs my-1">{errors.message?.message}</p>
        ) : (
          <div className="h-6"></div>
        )}
      </div>
      {serverMsg && (
        <BackdropModal
          text={serverMsg}
          icon={isSuccess ? SuccessIcon : WarningIcon}
        >
          <GeneralButton
            text="Закрити"
            variant="orange-bg"
            onClick={handleCloseModal}
          />
        </BackdropModal>
      )}
      {isSubmitting && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60">
          <Loader text="" />
        </div>
      )}
      <GeneralButton
        text="Замовити"
        type="submit"
        className=" mt-4"
        variant="orange-bg"
        disabled={isSubmitting}
      />
    </form>
  );
}
