'use client';

import { GeneralButton } from '@/components/generics/button/Button';
import { GeneralInput } from '@/components/generics/input/Input';
import { UnionIcon } from '@/components/icons/UnionIcon';
import { Calendar } from '@/components/ui/calendar';
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { BaseFormProps } from '@/interfaces';
import { cn } from '@/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FieldValues, Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';
import Loader from '../loader/Loader';

export default function BaseForm<T extends z.ZodObject<z.ZodRawShape>>({
  title,
  schema,
  fields,
  submitText,
  onSubmit,
  bypassValidation,
  topRightLink,
  bottomLink,
  successContent,
  getLocalizedError,
  className,
  additionalMessage,
}: BaseFormProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const defaultValues = useMemo(() => {
    const defaultValues: Record<string, unknown> = {};
    for (const field of fields)
      defaultValues[field.name] = field.type === 'checkbox' ? false : '';
    return defaultValues as z.infer<T>;
  }, [fields]);

  const form = useForm({
    resolver: zodResolver(schema) as unknown as Resolver<
      FieldValues,
      unknown,
      FieldValues
    >,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
  });

  const allValues = form.watch();
  const allFieldsFilled = fields.every((field) => {
    if (!field.required) return true;

    const value = allValues[field.name];
    if (field.type === 'checkbox') {
      return value === true || value === 'on' || value === 'true';
    }
    return value && value.toString().trim() !== '';
  });

  const isFormReady = bypassValidation
    ? true
    : title === 'РЕЄСТРАЦІЯ'
      ? form.formState.isSubmitted
        ? allFieldsFilled && form.formState.isValid
        : allFieldsFilled
      : allFieldsFilled;

  const handleSubmit = async (data: z.infer<T>) => {
    setIsLoading(true);
    setRootError(null);
    setSuccess(false);

    try {
      await onSubmit(data);
      if (successContent) setSuccess(true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'ПОМИЛКА ПРИ ОБРОБЦІ ЗАПИТУ';
      const localizedError = getLocalizedError
        ? getLocalizedError(errorMessage)
        : errorMessage;

      if (error instanceof Error && 'fields' in error) {
        const fieldNames = (error as Error & { fields: string[] }).fields;
        fieldNames.forEach((name: string) => {
          form.setError(name as string, { type: 'server', message: '' });
        });
        setRootError(localizedError);
      } else if (error instanceof Error && 'field' in error) {
        const fieldName = (error as Error & { field: string }).field;
        form.setError(fieldName as string, {
          type: 'server',
          message: localizedError,
        });
      } else {
        setRootError(localizedError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success && successContent) {
    return (
      <div className="relative">
        <div className="p-5 lg:py-20 sm:max-w-[70%] sm:mx-auto lg:max-w-[50%] lg:mx-auto lg:gap-10 desktop:max-w-none desktop:mx-0 desktop:px-80 flex flex-col gap-5 xl:gap-10 desktop:gap-10">
          {successContent}
        </div>
        <UnionIcon className="absolute top-2.5 right-[9.55px] 1440:top-5.25 1440:right-[13.75px] w-12 h-5 375:w-[49.455px] 1440:w-[118.255px] 1440:h-[47.824px] lg:w-20 lg:h-7.5 min1441:w-20 min1441:h-7.5" />
      </div>
    );
  }

  return (
    <>
      <div className="relative">
      <div
        className={cn(
          '375:p-5 min376:px-10 px-10 pt-10 pb-5 min376:pt-10 md:w-[50vw] lg:w-[40vw] mx-auto 1440:mx-0 1440:py-20 1440:w-auto 1440:px-80 min1441:mx-auto min1441:pb-5 min1441:pt-10 min1441:w-[40vw]  min1441:px-10 flex flex-col gap-5 1440:gap-10 min1441:gap-6',
          className,
        )}
      >
        <div className="flex justify-between items-end min1441:items-center">
          <h1 className="text-white 375:text-[40px] min376:text-[28px] text-[28px] min1441:text-[40px] font-semibold leading-[100%] uppercase 1440:text-[80px]">
            {title}
          </h1>
          {topRightLink && (
            <Link
              href={topRightLink.href}
              className={cn(
                'text-white text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] underline uppercase',
                topRightLink.alwaysVisible ? 'block' : 'hidden sm:block',
              )}
            >
              {topRightLink.text}
            </Link>
          )}
        </div>

        <form
          onSubmit={form.handleSubmit(
            handleSubmit as (data: unknown) => Promise<void>,
          )}
          className="flex flex-col gap-5 1440:gap-10 min1441:gap-6"
          noValidate
        >
          {fields.map((field) => (
            <Field
              key={field.name}
              className="gap-1 375:gap-3 min376:gap-1 1440:gap-5 min1441:gap-2"
            >
              {field.type === 'checkbox' ? (
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={field.name}
                    {...form.register(field.name as string)}
                    className="h-3 w-3 border border-gray-400 rounded-none shrink-0 accent-[#FA4616] checked:bg-[#FA4616] checked:border-[#FA4616]"
                  />
                  <div className="grid gap-1 leading-none">
                    <label
                      htmlFor={field.name}
                      className="text-sm font-medium leading-none text-white cursor-pointer"
                    >
                      {field.label}
                    </label>
                    {field.checkboxDescription && (
                      <p className="text-xs text-white opacity-80">
                        {field.checkboxDescription}
                      </p>
                    )}
                  </div>
                </div>
              ) : field.type === 'calendar' ? (
                <>
                  <FieldLabel
                    htmlFor={field.name}
                    className={`text-sm 1440:text-xl font-bold uppercase flex flex-col items-start gap-3 1440:gap-5 ${form.formState.errors[field.name as string] ? 'text-[#FA4616]' : 'text-white'}`}
                  >
                    {field.label}
                  </FieldLabel>
                  <FieldContent className="gap-0">
                    <Calendar
                      value={form.watch(field.name as string) || ''}
                      onChange={(value) =>
                        form.setValue(field.name as string, value || '', {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder="ДД.ММ.РРРР"
                      error={!!form.formState.errors[field.name as string]}
                    />
                  </FieldContent>
                </>
              ) : (
                <>
                  <FieldLabel
                    htmlFor={field.name}
                    className={`text-xs 375:text-sm min376:text-xs 1440:text-xl font-bold uppercase flex flex-col items-start gap-1 375:gap-3 min376:gap-1 1440:gap-5 ${form.formState.errors[field.name as string] ? 'text-[#FA4616]' : 'text-white'}`}
                  >
                    {field.label}
                  </FieldLabel>
                  <FieldContent className="gap-0">
                    {(() => {
                      const reg = form.register(field.name as string);
                      return (
                        <GeneralInput
                          {...reg}
                          type={
                            field.type as 'text' | 'email' | 'password' | 'tel'
                          }
                          id={field.name}
                          placeholder={field.placeholder}
                          variant="form"
                          className={
                            form.formState.errors[field.name as string]
                              ? 'border-[#FA4616] placeholder:text-[#FA4616] text-[#FA4616]'
                              : ''
                          }
                        />
                      );
                    })()}
                  </FieldContent>
                </>
              )}
              {form.formState.errors[field.name as string] && (
                <FieldError
                  errors={[form.formState.errors[field.name as string]]}
                  className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] mt-0.5"
                />
              )}
            </Field>
          ))}

          <GeneralButton
            type="submit"
            disabled={isLoading || !isFormReady}
            text={submitText}
            variant="gray-bg"
            className={
              isFormReady
                ? 'bg-white text-black hover:bg-white hover:text-black'
                : ''
            }
          />

          {additionalMessage && (
            <p
              className={`text-left text-xs 1440:text-base 1440:leading-5 font-medium leading-4.5 uppercase ${
                additionalMessage.includes('Помилка')
                  ? 'text-red-500'
                  : 'text-green-500'
              }`}
            >
              {additionalMessage}
            </p>
          )}

          {rootError && (
            <p className="text-[#FA4616] text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] -mt-4 375:-mt-4 min376:-mt-4 1440:-mt-9 min1441:-mt-5">
              {rootError}
            </p>
          )}
        </form>

        {bottomLink && (
          <Link
            href={bottomLink.href}
            className={cn(
              'text-white text-[10px] 375:text-xs min376:text-[10px] 1440:text-base min1441:text-sm font-normal leading-[150%] underline uppercase',
              bottomLink.className,
            )}
          >
            {bottomLink.text}
          </Link>
        )}
      </div>
      <UnionIcon className="absolute top-2.5 right-[9.55px] 1440:top-5.25 1440:right-[13.75px] w-12 h-5 375:w-[49.455px] 1440:w-[118.255px] 1440:h-[47.824px] lg:w-20 lg:h-7.5 min1441:w-20 min1441:h-7.5" />
    </div>
    {isLoading && (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60">
        <Loader text=""  />
      </div>
    )}
    </>
    
  );
}
