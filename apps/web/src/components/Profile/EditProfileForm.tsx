// 

import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { updateUserSchema } from './schemas/updateUserSchema';
import { User, UserUpdateFieldConfig } from '@/interfaces';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const normalizeDateOfBirthValue = (rawValue: unknown): string | undefined => {
  if (!rawValue) return undefined;

  if (typeof rawValue === 'string') {
    const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const uaMatch = rawValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (uaMatch) return `${uaMatch[3]}-${uaMatch[2]}-${uaMatch[1]}`;
  }

  const date = new Date(rawValue as any);
  if (Number.isNaN(date.getTime())) return undefined;
  return format(date, 'yyyy-MM-dd');
};

export default function EditProfileForm({
  fields,
  user,
  onSubmit,
  onAnyChange,
}: {
  fields: UserUpdateFieldConfig[];
  user: User | null;
  onSubmit: SubmitHandler<z.infer<typeof updateUserSchema>>;
  onAnyChange?: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user?.fullName.split(' ')[0],
      lastName: user?.fullName.split(' ')[1],
      nickName: user?.nickName,
      dateOfBirth: normalizeDateOfBirthValue(user?.dateOfBirth),
      phoneNumber: user?.phoneNumber || '',
      country: user?.country,
      region: user?.region,
      city: user?.city,
    },
  });

  return (
    <form
      id="userForm"
      onSubmit={handleSubmit(onSubmit)}
      onChangeCapture={() => onAnyChange?.()}
      className="flex flex-col gap-6 mt-6 p-2.5 min991:p-0 min991:flex-wrap min991:flex-row "
    >
      {fields.map((field) => (
        <div
          key={field.id}
          className="flex flex-col grow gap-2 min991:w-[45%] "
        >
          <label
            htmlFor={field.id}
            className="text-[15px] font-bold text-[#FFFFFF] uppercase"
          >
            {field.label}
          </label>

          {field.id === 'dateOfBirth' ? (
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field: { value, onChange } }) => (
                <Calendar
                  value={value ?? ''}
                  onChange={(val) => {
                    onAnyChange?.();
                    onChange(val || undefined);
                  }}
                  placeholder="ДД.ММ.РРРР"
                  error={!!errors.dateOfBirth}
                   className="font-medium leading-5.5 uppercase border border-[#FFFFFF]  py-4! pl-5"
                   textStyle='text-[#999999] next-[16px]'
                />
              )}
            />
          ) : (
            <input
              {...register(field.id as keyof z.infer<typeof updateUserSchema>)}
              type="text"
              readOnly={field.id === 'nickName'}
              id={field.id}
              title={field.label}
              aria-label={field.label}
              placeholder={field.label}
              className=" font-medium  leading-5.5 uppercase border border-[#FFFFFF] text-[#999999] py-4 pl-5"
            />
          )}

          {(errors[field.id as keyof typeof errors] && (
            <span className=" h-2 text-[red] text-xs block mt-1">
              {errors[field.id as keyof typeof errors]?.message}
            </span>
          )) ||
            (field.helperText && (
              <span className=" h-2 text-[#999999] text-xs block mt-1 uppercase">
                {field.helperText}
              </span>
            )) || (
              <div className="h-4"></div>
            )}
        </div>
      ))}
    </form>
  );
}
