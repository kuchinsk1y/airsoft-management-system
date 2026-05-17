"use client";
import React from 'react';
import { GeneralButton } from '../generics/button/Button';
import { CloseIcon } from '../icons/CloseIcon';
import { updateMyEquipmentAction } from '@/actions/equipment';
import type { EquipmentSlotKey } from '@/constants/equipment';
import { EQUIPMENT_SLOT_KEYS } from '@/constants/equipment';
import { EquipmentModalProps } from '@/interfaces';

export default function EquipmentModal({
  equipment,
  onClose,
  onSaved,
}: EquipmentModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  const [error, setError] = React.useState<{ errors: Record<string, string> }>({
    errors: {},
  });

  React.useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  async function handleForm(formData: FormData) {
    if (isSubmitting) return;

    const payload = {} as Record<EquipmentSlotKey, string>;
    for (const key of EQUIPMENT_SLOT_KEYS) {
      payload[key] = String(formData.get(key) ?? '');
    }

    try {
      setIsSubmitting(true);
      const result = await updateMyEquipmentAction(payload);

      if (result?.success) {
        onSaved?.();
        onClose();
      } else {
        setError({
          errors: result?.message ? { message: result.message } : {},
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/80 p-4 transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`relative w-full max-w-110 border border-white bg-[#000000] p-6 shadow-2xl transform-gpu transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-6 right-6 text-white cursor-pointer disabled:opacity-50"
          aria-label="Закрити модальне вікно"
          title="Закрити"
        >
          <CloseIcon />
        </button>

        <div className="">
          <h2 className="text-lg font-bold uppercase">
            Редагувати екіпірування
          </h2>
          <p className="text-[#999999] text-sm mt-2">
            Укажіть ваше спорядження
          </p>
        </div>

        {error.errors.message ? (
          <p className="text-red-400 text-sm mt-3">{error.errors.message}</p>
        ) : null}

        <form action={handleForm} className="flex flex-col gap-3 mt-5">
          {equipment &&
            equipment.map((item) => (
              <div key={item.slotKey} className="flex flex-col gap-3">
                <label
                  htmlFor={`eq-${item.slotKey}`}
                  className="text-white text-xs font-bold uppercase tracking-wider"
                >
                  {item.label}
                </label>
                <input
                  id={`eq-${item.slotKey}`}
                  type="text"
                  name={item.slotKey}
                  defaultValue={item.value}
                  title={item.label}
                  placeholder={item.label}
                  className="border-[#FFFFFF] w-full bg-transparent border text-sm text-[#808080] p-4"
                />
              </div>
            ))}

          <GeneralButton
            type="submit"
            text={isSubmitting ? 'ЗБЕРЕЖЕННЯ...' : 'ЗБЕРЕГТИ ЗМІНИ'}
            variant="orange-bg"
            className="border-0 mt-4 cursor-pointer"
            disabled={isSubmitting}
          />
        </form>
      </div>
    </div>
  );
}
