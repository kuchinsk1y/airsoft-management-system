'use client';

import { ApplicationResponse } from '@/actions/applications';
import { useApplication } from '@/contexts/ApplicationContext';
import { SOCIAL_NETWORKS_CONFIG } from '@/config/socialNetworks';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { MdChevronRight, MdClose } from 'react-icons/md';
import CityCombobox from '../../../components/CityCombobox';
import { COMPETITION_TYPES } from '../constants';
import { EventFormData, PaymentMethodOption } from '../types';
import styles from './EventFormModal.module.css';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import * as ratingsApi from '@/actions/ratings';
import { getRegions } from '@/actions/regions';

const EVENT_TIME_ZONE = 'Europe/Kyiv';
const DEFAULT_SIDES = [
  { name: 'Сторона 1', sideCapacity: 10 },
  { name: 'Сторона 2', sideCapacity: 10 },
];

const getTimeZoneOffsetMinutes = (
  date: Date,
  timeZone: string,
): number | null => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  }).formatToParts(date);

  const tzName = parts.find((part) => part.type === 'timeZoneName')?.value;
  if (!tzName) return null;

  const match = tzName.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return null;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3] || '0', 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return sign * (hours * 60 + minutes);
};

const parseDateTimeLocalAsKyiv = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw] = match;
  const year = Number.parseInt(yearRaw, 10);
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);

  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n)))
    return null;

  const targetClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let utcMillis = targetClockAsUtc;

  // Recalculate offset after correction to handle DST transitions around boundary dates.
  for (let i = 0; i < 2; i++) {
    const offset = getTimeZoneOffsetMinutes(
      new Date(utcMillis),
      EVENT_TIME_ZONE,
    );
    if (offset === null) {
      const fallback = new Date(value);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    utcMillis = targetClockAsUtc - offset * 60_000;
  }

  const parsed = new Date(utcMillis);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateTimeLocal = (value: Date | string) => {
  const dateObj = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateObj.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dateObj);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  const hours = parts.find((part) => part.type === 'hour')?.value;
  const minutes = parts.find((part) => part.type === 'minute')?.value;

  if (!year || !month || !day || !hours || !minutes) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  }

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const DRAFT_STORAGE_KEY = 'event-form-draft';

interface DraftData {
  formData: EventFormData;
  startDateInput: string;
  gameStartDateInput: string;
  endDateInput: string;
}

const saveDraftToLocalStorage = (
  formData: EventFormData,
  startDateInput: string,
  gameStartDateInput: string,
  endDateInput: string,
) => {
  if (typeof window === 'undefined') return;
  try {
    const draft: DraftData = {
      formData,
      startDateInput,
      gameStartDateInput,
      endDateInput,
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Failed to save draft:', error);
  }
};

const loadDraftFromLocalStorage = (): DraftData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
};

const clearDraftFromLocalStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear draft:', error);
  }
};

const createDefaultFormData = (
  selectedDate: Date | undefined,
  applicationId: number | undefined,
  gameTypeId = 0,
): EventFormData => ({
  name: '',
  image: '',
  startDate: selectedDate || new Date(),
  gameStartDate: selectedDate || new Date(),
  endDate: selectedDate || new Date(),
  description: '',
  city: '',
  address: '',
  regionId: 0,
  maxParticipants: 20,
  competitionType: 'Командне',
  gameTypeId,
  price: 0,
  paymentMethods: ['BANK', 'CASH'],
  isActive: true,
  applicationId,
  sides: DEFAULT_SIDES,
  socialLinks: {},
});

function RequiredMark() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block text-sm font-semibold leading-none text-orange-400"
    >
      *
    </span>
  );
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData, imageFile?: File) => Promise<void>;
  initialData?: EventFormData;
  selectedDate?: Date;
  isLoading?: boolean;
}

export default function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  selectedDate,
  isLoading = false,
}: EventFormModalProps) {
  const { applications, isAdmin } = useApplication();
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => getRegions(),
    enabled: isOpen,
    staleTime: 30 * 60 * 1000,
  });
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const sideKeyCounterRef = useRef(0);
  const wasOpenRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const makeSideKey = () => `side-${sideKeyCounterRef.current++}`;
  const buildSideKeys = (count: number) =>
    Array.from({ length: count }, () => makeSideKey());
  const initialFormState =
    initialData ||
    createDefaultFormData(selectedDate, applications[0]?.id);
  const [formData, setFormData] = useState<EventFormData>(
    initialFormState,
  );
  const [sideKeys, setSideKeys] = useState<string[]>(
    () => buildSideKeys(initialFormState.sides?.length || 0),
  );
  const { data: gameTypes = [] } = useQuery({
    queryKey: ['rating-game-types'],
    queryFn: () => ratingsApi.getRatingGameTypes(),
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const totalMaxParticipants = (formData.sides ?? []).reduce(
    (sum, side) => sum + Math.max(1, Math.trunc(side.sideCapacity || 0)),
    0,
  );

  const maxParticipantsLabel =
    formData.competitionType === 'Командне'
      ? 'Макс. команд'
      : formData.competitionType === 'Індивідуальне'
        ? 'Макс. учасників'
        : 'Макс. учасників';

  const [startDateInput, setStartDateInput] = useState<string>(
    initialData?.startDate ? toDateTimeLocal(initialData.startDate) : '',
  );
  const [gameStartDateInput, setGameStartDateInput] = useState<string>(
    initialData?.gameStartDate
      ? toDateTimeLocal(initialData.gameStartDate)
      : selectedDate
        ? toDateTimeLocal(selectedDate)
        : '',
  );
  const [endDateInput, setEndDateInput] = useState<string>(
    initialData?.endDate ? toDateTimeLocal(initialData.endDate) : '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [isPriceTouched, setIsPriceTouched] = useState(Boolean(initialData));
  const [isZeroPriceConfirmOpen, setIsZeroPriceConfirmOpen] = useState(false);
  const [isSocialLinksOpen, setIsSocialLinksOpen] = useState(
    Boolean(
      initialData?.socialLinks &&
      Object.keys(initialData.socialLinks).length > 0,
    ),
  );
  const isEditing = Boolean(initialData);

  const validateForm = (): { isValid: boolean; firstErrorKey?: string } => {
    const newErrors: Record<string, string> = {};
    const socialPhone = formData.socialLinks?.phone?.trim();

    if (!formData.name.trim()) newErrors.name = "Назва обов'язкова";
    if (!formData.description?.trim())
      newErrors.description = "Опис обов'язковий";
    if (!imageFile && !formData.image.trim())
      newErrors.image = 'Додайте зображення файлом';
    if (!startDateInput) newErrors.startDate = "Дата початку обов'язкова";
    if (!gameStartDateInput)
      newErrors.gameStartDate = "Дата початку гри обов'язкова";
    if (!endDateInput) newErrors.endDate = "Дата завершення гри обов'язкова";
    if (!formData.city.trim()) newErrors.city = "Місто обов'язкове";
    if (!formData.regionId) newErrors.regionId = "Область обов'язкова";
    if (totalMaxParticipants < 1)
      newErrors.maxParticipants = 'Мінімум 1 учасник';
    if (!formData.gameTypeId) newErrors.gameTypeId = 'Тип гри обовʼязковий';
    if (formData.price < 0) newErrors.price = "Ціна не може бути від'ємною";
    const sides = formData.sides ?? [];
    if (sides.length < 2) newErrors.sides = 'Додайте мінімум 2 сторони';
    const emptySide = sides.find((s) => !s.name?.trim());
    if (emptySide) newErrors.sides = 'Кожна сторона повинна мати назву';
    const invalidSideCapacity = sides.find(
      (s) => !Number.isInteger(s.sideCapacity) || s.sideCapacity < 1,
    );
    if (invalidSideCapacity)
      newErrors.sides = 'Кожна сторона повинна мати місткість не менше 1';

    if (!initialData && !socialPhone) {
      newErrors.socialLinksPhone =
        'Для нової події вкажіть телефон у блоці соціальних мереж';
    }

    if (startDateInput && gameStartDateInput) {
      const registrationEnd = parseDateTimeLocalAsKyiv(startDateInput);
      const gameStart = parseDateTimeLocalAsKyiv(gameStartDateInput);
      if (!registrationEnd || !gameStart) {
        newErrors.gameStartDate = 'Некоректний формат дати';
      } else if (gameStart.getTime() < registrationEnd.getTime()) {
        newErrors.gameStartDate =
          'Дата початку гри не може бути раніше за кінець реєстрації';
      }
    }

    if (gameStartDateInput && endDateInput) {
      const gameStart = parseDateTimeLocalAsKyiv(gameStartDateInput);
      const eventEnd = parseDateTimeLocalAsKyiv(endDateInput);
      if (!gameStart || !eventEnd) {
        newErrors.endDate = 'Некоректний формат дати';
      } else if (gameStart.getTime() > eventEnd.getTime()) {
        newErrors.endDate =
          'Дата початку гри не може бути пізніше за дату завершення гри';
      }
    }

    const errorPriority = [
      'name',
      'startDate',
      'gameStartDate',
      'endDate',
      'description',
      'regionId',
      'city',
      'address',
      'sides',
      'maxParticipants',
      'gameTypeId',
      'price',
      'socialLinksPhone',
      'image',
    ];
    const firstErrorKey =
      errorPriority.find((key) => Boolean(newErrors[key])) ||
      Object.keys(newErrors)[0];

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorKey,
    };
  };

  const scrollToFirstError = (errorKey?: string) => {
    if (!errorKey) return;

    const fieldSelectorMap: Record<string, string> = {
      name: '[data-field="name-input"]',
      startDate: '[data-field="start-date-input"]',
      gameStartDate: '[data-field="game-start-date-input"]',
      endDate: '[data-field="end-date-input"]',
      description: '[data-field="description-input"]',
      regionId: '[data-field="region-id"]',
      city: '[data-field="city"]',
      address: '[data-field="address-input"]',
      sides: '[data-field="side-capacity-0"]',
      maxParticipants: '[data-field="max-participants-input"]',
      gameTypeId: '[data-field="game-type-input"]',
      price: '[data-field="price-input"]',
      socialLinksPhone: '[data-field="social-phone-input"]',
      image: '[data-field="image-input"]',
    };

    const selector = fieldSelectorMap[errorKey];
    if (!selector) return;

    const formScroll = formScrollRef.current;
    const root: ParentNode = formScroll || document;
    const field = root.querySelector<HTMLElement>(selector);
    if (!field) return;

    if (formScroll) {
      const fieldRect = field.getBoundingClientRect();
      const scrollRect = formScroll.getBoundingClientRect();
      const targetTop = Math.max(
        0,
        formScroll.scrollTop + (fieldRect.top - scrollRect.top) - 96,
      );
      formScroll.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      field.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.setTimeout(() => {
      field.focus({ preventScroll: true });
    }, 120);
  };

  const submitForm = () => {
    onSubmit({ ...formData, maxParticipants: totalMaxParticipants }, imageFile);
    // Очищаем черновик после успешной отправки
    clearDraftFromLocalStorage();
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.isValid) {
      scrollToFirstError(validation.firstErrorKey);
      return;
    }

    const isCreating = !initialData;
    const isFreeEvent = formData.price === 0;

    if (isCreating && isFreeEvent) {
      setIsZeroPriceConfirmOpen(true);
      return;
    }

    submitForm();
  };

  const handleConfirmZeroPrice = () => {
    setIsZeroPriceConfirmOpen(false);
    submitForm();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => {
      if (name === 'gameTypeId') {
        return { ...prev, gameTypeId: Number(value) || 0 };
      }

      if (type === 'number') {
        let numVal: number = Number.isFinite(Number(value)) ? Number(value) : 0;

        if (name === 'price') {
          setIsPriceTouched(value.trim().length > 0);
          if (!Number.isFinite(numVal) || numVal < 0) numVal = 0;
          return { ...prev, price: Math.trunc(numVal) };
        }

        return { ...prev, [name]: Math.trunc(numVal) };
      }

      return {
        ...prev,
        [name]: type === 'checkbox' ? target.checked : value,
      };
    });

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    if (!isOpen || initialData || gameTypes.length === 0) return;
    setFormData((prev) => {
      if (prev.gameTypeId) return prev;
      return { ...prev, gameTypeId: gameTypes[0].id };
    });
  }, [gameTypes, initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    const justClosed = !isOpen && wasOpenRef.current;

    if (justOpened) {
      if (initialData) {
        const hydrated = {
          ...initialData,
          sides: initialData.sides,
          socialLinks: initialData.socialLinks || {},
        };
        setFormData(hydrated);
        setSideKeys(buildSideKeys(hydrated.sides?.length || 0));
        setStartDateInput(toDateTimeLocal(initialData.startDate));
        setGameStartDateInput(
          initialData.gameStartDate
            ? toDateTimeLocal(initialData.gameStartDate)
            : toDateTimeLocal(initialData.startDate),
        );
        setEndDateInput(
          initialData.endDate
            ? toDateTimeLocal(initialData.endDate)
            : toDateTimeLocal(initialData.gameStartDate || initialData.startDate),
        );
        setIsPriceTouched(true);
        setIsSocialLinksOpen(
          Boolean(
            initialData.socialLinks &&
            Object.keys(initialData.socialLinks).length > 0,
          ),
        );
      } else {
        // Пытаемся загрузить черновик
        const draft = loadDraftFromLocalStorage();
        if (draft) {
          setFormData(draft.formData);
          setSideKeys(buildSideKeys(draft.formData.sides?.length || 0));
          setStartDateInput(draft.startDateInput);
          setGameStartDateInput(draft.gameStartDateInput);
          setEndDateInput(draft.endDateInput);
        } else {
          const resetData = createDefaultFormData(
            selectedDate,
            applications[0]?.id,
            gameTypes[0]?.id ?? 0,
          );
          setFormData(resetData);
          setSideKeys(buildSideKeys(resetData.sides.length));
          setStartDateInput('');
          setGameStartDateInput(selectedDate ? toDateTimeLocal(selectedDate) : '');
          setEndDateInput(selectedDate ? toDateTimeLocal(selectedDate) : '');
        }
        setIsPriceTouched(false);
        setIsSocialLinksOpen(false);
      }

      setImageFile(undefined);
      setErrors({});
      setIsZeroPriceConfirmOpen(false);
    }

    if (justClosed && !isClosing) {
      setIsZeroPriceConfirmOpen(false);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, isClosing, initialData, selectedDate, applications, gameTypes]);

  useEffect(() => {
    const textarea = descriptionRef.current;
    if (!textarea || !isOpen) return;

    if (!isEditing) {
      textarea.style.height = '';
      textarea.style.overflowY = '';
      return;
    }

    const minHeight = 96;
    const maxHeight = 240;

    textarea.style.height = 'auto';
    const nextHeight = Math.min(
      maxHeight,
      Math.max(minHeight, textarea.scrollHeight),
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [formData.description, isEditing, isOpen]);

  // Автосохранение черновика в localStorage
  useEffect(() => {
    // Сохраняем только если это новая форма (!initialData) и форма открыта
    if (!isOpen || isEditing) return;

    const debounceTimer = setTimeout(() => {
      saveDraftToLocalStorage(
        formData,
        startDateInput,
        gameStartDateInput,
        endDateInput,
      );
    }, 1000); // Сохраняем с задержкой в 1 сек для оптимизации

    return () => clearTimeout(debounceTimer);
  }, [
    formData,
    startDateInput,
    gameStartDateInput,
    endDateInput,
    isOpen,
    isEditing,
  ]);

  const handleClose = () => {
    if (isLoading) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      document.body.style.overflow = '';
      onClose();
    }, 400);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 ${isClosing ? styles.overlayExit : styles.overlay}`}
      >
        <div
          ref={formScrollRef}
          className={`custom-scrollbar w-full max-w-3xl bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-h-[90vh] overflow-y-auto ${isClosing ? styles.modalExit : styles.modal}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-black/80">
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialData ? 'Редагування події' : 'Нова подія'}
              </h2>
              <p className="text-gray-400 text-sm">
                Заповніть поля та збережіть
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Закрити"
            >
              <MdClose size={22} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Назва події
                <RequiredMark />
              </label>
              <input
                data-field="name-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                placeholder="Напр., MilSim 2024"
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Event Dates */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Дата закінчення реєстрації на гру
                  <RequiredMark />
                </label>

                <input
                  data-field="start-date-input"
                  type="datetime-local"
                  title="Виберіть дату закінчення реєстрації"
                  value={startDateInput}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setStartDateInput(nextValue);
                    if (nextValue) {
                      const parsed = parseDateTimeLocalAsKyiv(nextValue);
                      if (parsed) {
                        setFormData((prev) => ({ ...prev, startDate: parsed }));
                      }
                    }
                    if (
                      errors.startDate ||
                      errors.gameStartDate ||
                      errors.endDate
                    ) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.startDate;
                        delete next.gameStartDate;
                        delete next.endDate;
                        return next;
                      });
                    }
                  }}
                  max={endDateInput || undefined}
                  className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                />
                {errors.startDate && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Дата початку гри
                    <RequiredMark />
                  </label>
                  <input
                    data-field="game-start-date-input"
                    type="datetime-local"
                    title="Виберіть дату початку гри"
                    value={gameStartDateInput}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setGameStartDateInput(nextValue);
                      if (nextValue) {
                        const parsed = parseDateTimeLocalAsKyiv(nextValue);
                        if (parsed) {
                          setFormData((prev) => ({
                            ...prev,
                            gameStartDate: parsed,
                          }));
                        }
                      }
                      if (errors.gameStartDate || errors.endDate) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.gameStartDate;
                          delete next.endDate;
                          return next;
                        });
                      }
                    }}
                    min={startDateInput || undefined}
                    max={endDateInput || undefined}
                    className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                  />
                  {errors.gameStartDate && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.gameStartDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Дата завершення гри
                    <RequiredMark />
                  </label>
                  <input
                    data-field="end-date-input"
                    type="datetime-local"
                    title="Виберіть дату завершення"
                    value={endDateInput}
                    required
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setEndDateInput(nextValue);
                      if (nextValue) {
                        const parsed = parseDateTimeLocalAsKyiv(nextValue);
                        if (parsed) {
                          setFormData((prev) => ({ ...prev, endDate: parsed }));
                        }
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          endDate: prev.gameStartDate,
                        }));
                      }
                      if (
                        errors.endDate ||
                        errors.gameStartDate ||
                        errors.startDate
                      ) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.endDate;
                          delete next.gameStartDate;
                          delete next.startDate;
                          return next;
                        });
                      }
                    }}
                    min={gameStartDateInput || startDateInput || undefined}
                    className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                  />
                  {errors.endDate && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Competition Type & Game Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Competition Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Тип змагання
                  <RequiredMark />
                </label>
                <select
                  name="competitionType"
                  title="Виберіть тип змагання"
                  value={formData.competitionType}
                  onChange={handleChange}
                  className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                >
                  {COMPETITION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Game Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Тип гри
                  <RequiredMark />
                </label>
                <select
                  data-field="game-type-input"
                  name="gameTypeId"
                  title="Виберіть тип гри"
                  value={formData.gameTypeId || ''}
                  onChange={handleChange}
                  className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                  required
                >
                  {!formData.gameTypeId && <option value="">Виберіть тип гри</option>}
                  {gameTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.gameTypeId && (
                  <p className="text-red-400 text-xs mt-1">{errors.gameTypeId}</p>
                )}
              </div>
            </div>

            {/* Organization (for Admin, only on create) */}
            {isAdmin && !initialData && applications && applications.length > 0 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Організація
                </label>
                <select
                  title="Виберіть організацію"
                  value={formData.applicationId || ''}
                  onChange={(e) => {
                    const appId = e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined;
                    setFormData((prev) => ({ ...prev, applicationId: appId }));
                  }}
                  className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                >
                  <option value="">Виберіть організацію</option>
                  {applications.map((app: ApplicationResponse) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div data-field="region-id">
                <label className="block text-xs text-gray-400 mb-1">
                  Область
                  <RequiredMark />
                </label>
                <select
                  title="Оберіть область"
                  value={formData.regionId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    setFormData((prev) => ({
                      ...prev,
                      regionId: Number.isFinite(id) && id > 0 ? id : 0,
                      city: '',
                    }));
                  }}
                  className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                >
                  <option value="">Оберіть область</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {errors.regionId && (
                  <p className="text-red-400 text-xs mt-1">{errors.regionId}</p>
                )}
              </div>

              <div data-field="city">
                <CityCombobox
                  value={formData.city}
                  onChange={(citySlug) =>
                    setFormData((prev) => ({ ...prev, city: citySlug }))
                  }
                  regionId={formData.regionId > 0 ? formData.regionId : undefined}
                  error={errors.city}
                  title={
                    <>
                      Місто
                      <RequiredMark />
                    </>
                  }
                  placeholder={
                    formData.regionId
                      ? 'Введіть назву міста...'
                      : 'Спочатку оберіть область'
                  }
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Місце проведення
              </label>
              <input
                data-field="address-input"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                placeholder="Вкажіть місце проведення"
              />
              {errors.address && (
                <p className="text-red-400 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Опис
                <RequiredMark />
              </label>
              <textarea
                data-field="description-input"
                ref={descriptionRef}
                name="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Опис страйкбольної гри..."
                required
                rows={3}
                className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none resize-y"
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-[1fr_180px_auto] gap-2 items-center pr-1">
                  <label className="block text-xs text-gray-400">
                    Сторони події <RequiredMark /> (мінімум 2)
                  </label>

                  <label className="block text-xs text-gray-400">
                    {`Кількість ${formData.competitionType === 'Командне' ? 'команд' : 'учасників'}`}
                    <RequiredMark /> {`(мінімум 1)`}
                  </label>

                  <div />
                </div>
           

                {(formData.sides ?? []).map((side, index) => (
                  <div
                    key={sideKeys[index] || `side-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[1fr_150px_auto] gap-2 items-center"
                  >
                    <div className="space-y-1">
                      {index === 0 && (
                        <label className="block text-xs text-gray-400 md:hidden">
                          Сторони події <RequiredMark /> (мінімум 2)
                        </label>
                      )}
                   
                      <input
                        type="text"
                        value={side.name}
                        onChange={(e) => {
                          const next = [...(formData.sides ?? [])];
                          next[index] = { ...side, name: e.target.value };
                          setFormData((prev) => ({ ...prev, sides: next }));
                        }}
                        placeholder={`Сторона ${index + 1}`}
                        className="flex-1 w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                      />
                    </div>
                    <div className='space-y-1'>
                      {index === 0 && (
                        <label className="block text-xs text-gray-400 md:hidden">
                          {`Кількість ${formData.competitionType === 'Командне' ? 'команд' : 'учасників'}`}
                          <RequiredMark /> {`(мінімум 1)`}
                        </label>
                      )}
               
                      <input
                        data-field={index === 0 ? 'side-capacity-0' : undefined}
                        type="number"
                        min="1"
                        value={side.sideCapacity}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          const sideCapacity =
                            Number.isFinite(raw) && raw >= 1
                              ? Math.trunc(raw)
                              : 1;
                          const next = [...(formData.sides ?? [])];
                          next[index] = { ...side, sideCapacity };
                          setFormData((prev) => ({ ...prev, sides: next }));
                        }}
                        placeholder="Місткість"
                        className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = (formData.sides ?? []).filter(
                          (_, i) => i !== index,
                        );
                        setFormData((prev) => ({ ...prev, sides: next }));
                        setSideKeys((prev) => prev.filter((_, i) => i !== index));
                      }}
                      disabled={(formData.sides ?? []).length <= 2}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Видалити сторону"
                      aria-label="Видалити сторону"
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      sides: [
                        ...(prev.sides ?? []),
                        {
                          name: `Сторона ${(prev.sides?.length ?? 0) + 1}`,
                          sideCapacity: 10,
                        },
                      ],
                    }));
                    setSideKeys((prev) => [...prev, makeSideKey()]);
                  }}
                  className="text-sm text-(--color-primary) hover:underline"
                >
                  + Додати сторону
                </button>
              </div>
              {errors.sides && (
                <p className="text-red-400 text-xs mt-1">{errors.sides}</p>
              )}
            </div>

            {/* Participants & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {maxParticipantsLabel}
                  <RequiredMark />
                </label>
                <input
                  data-field="max-participants-input"
                  type="number"
                  name="maxParticipants"
                  placeholder="20"
                  value={totalMaxParticipants}
                  readOnly
                  min="1"
                  className="w-full bg-white/10 text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none cursor-not-allowed"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Рахується автоматично як сума місткостей усіх сторін
                </p>
                {errors.maxParticipants && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.maxParticipants}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Способи оплати
                  <RequiredMark />
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        formData.paymentMethods?.includes('BANK') ?? true
                      }
                      onChange={(e) => {
                        const next: PaymentMethodOption[] = e.target.checked
                          ? [
                              ...(formData.paymentMethods || []).filter(
                                (m) => m !== 'BANK',
                              ),
                              'BANK',
                            ]
                          : (formData.paymentMethods || []).filter(
                              (m) => m !== 'BANK',
                            );
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethods: next.length ? next : ['CASH'],
                        }));
                      }}
                      className="rounded border-white/20 bg-white/5 text-(--color-primary) focus:ring-(--color-primary)"
                    />
                    <span className="text-white text-sm">Карта</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        formData.paymentMethods?.includes('CASH') ?? true
                      }
                      onChange={(e) => {
                        const next: PaymentMethodOption[] = e.target.checked
                          ? [
                              ...(formData.paymentMethods || []).filter(
                                (m) => m !== 'CASH',
                              ),
                              'CASH',
                            ]
                          : (formData.paymentMethods || []).filter(
                              (m) => m !== 'CASH',
                            );
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethods: next.length ? next : ['BANK'],
                        }));
                      }}
                      className="rounded border-white/20 bg-white/5 text-(--color-primary) focus:ring-(--color-primary)"
                    />
                    <span className="text-white text-sm">Готівка</span>
                  </label>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  Оберіть, які способи оплати доступні для цієї події
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Ціна, грн
                </label>
                <input
                  data-field="price-input"
                  type="number"
                  name="price"
                  value={
                    !initialData && !isPriceTouched && formData.price === 0
                      ? ''
                      : formData.price
                  }
                  onChange={handleChange}
                  min="0"
                  step="50"
                  placeholder="0"
                  className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none"
                />
                {errors.price && (
                  <p className="text-red-400 text-xs mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsSocialLinksOpen((prev) => !prev)}
                className="w-full px-4 py-3 flex items-center justify-between text-left bg-white/2 hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-semibold text-white">
                  Соціальні мережі <span className="text-orange-400">*</span>
                </span>
                <MdChevronRight
                  size={20}
                  className={`text-gray-400 transition-transform ${isSocialLinksOpen ? 'rotate-90 text-white' : ''}`}
                />
              </button>

              {isSocialLinksOpen && (
                <div className="px-4 py-4 border-t border-white/10">
                  <p className="text-gray-500 text-xs mb-3">
                    На сайті відображатимуться лише заповнені посилання
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SOCIAL_NETWORKS_CONFIG.map(
                      ({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1">
                            {label}
                            {key === 'phone' && (
                              <span className="text-orange-400 ml-1">*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={formData.socialLinks?.[key] || ''}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              setFormData((prev) => {
                                const current = prev.socialLinks || {};
                                const next = value
                                  ? { ...current, [key]: value }
                                  : (() => {
                                      const copy = { ...current };
                                      delete copy[key];
                                      return copy;
                                    })();

                                return { ...prev, socialLinks: next };
                              });

                              if (key === 'phone' && errors.socialLinksPhone) {
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.socialLinksPhone;
                                  return next;
                                });
                              }
                            }}
                            placeholder={placeholder}
                            data-field={
                              key === 'phone' ? 'social-phone-input' : undefined
                            }
                            className="w-full bg-white/5 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none text-sm"
                          />
                        </div>
                      ),
                    )}
                  </div>
                  {errors.socialLinksPhone && (
                    <p className="text-red-400 text-xs mt-3">
                      {errors.socialLinksPhone}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Image */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Зображення
                <RequiredMark />
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Формати: JPG, JPEG, PNG, WEBP. Рекомендований розмір для
                карток подій і товарів: 1600x900 (16:9). Мінімальний без
                помітної втрати якості: 1200x675.
              </p>
              <input
                data-field="image-input"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                title="Завантажити зображення"
                aria-label="Завантажити зображення"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImageFile(file || undefined);
                  if (file) {
                    setFormData((prev) => ({ ...prev, image: file.name }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.image;
                      return next;
                    });
                  }
                }}
                className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-(--color-primary) file:text-white hover:file:bg-(--color-primary-hover) cursor-pointer"
              />
              {errors.image && (
                <p className="text-red-400 text-xs mt-1">{errors.image}</p>
              )}

              {/* Image Previews */}
              <div className="mt-3 flex gap-4">
                {initialData && formData.image && !imageFile && (
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500 mb-1">
                      Поточне зображення
                    </p>
                    <Image
                      src={
                        formData.image.startsWith('http')
                          ? formData.image
                          : `${formData.image}`
                      }
                      alt="Current"
                      width={80}
                      height={80}
                      className="object-cover rounded-lg border border-white/20"
                    />
                  </div>
                )}

                {imageFile && (
                  <div className="flex flex-col">
                    <p className="text-xs text-gray-500 mb-1">
                      Нове зображення до завантаження
                    </p>
                    <Image
                      src={URL.createObjectURL(imageFile)}
                      alt="New"
                      width={80}
                      height={80}
                      className="object-cover rounded-lg border border-white/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="accent-(--color-primary)"
                />
                Активна подія
              </label>
            </div>
            {isLoading && (
              <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                <LoadingSpinner size="lg" thickness="thin" />
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-(--color-primary)/30 text-gray-200 hover:bg-(--color-primary)/10 transition-colors disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold shadow-lg shadow-(--color-primary)/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Обробка...' : initialData ? 'Оновити' : 'Створити'}
            </button>
          </div>
        </div>
      </div>

      {isZeroPriceConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-black/90 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">
                Підтвердити безкоштовну подію
              </h3>
              <button
                onClick={() => setIsZeroPriceConfirmOpen(false)}
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Закрити"
              >
                <MdClose size={20} />
              </button>
            </div>

            <div className="px-6 py-6 space-y-2">
              <p className="text-gray-200">Ви встановили ціну події 0 грн.</p>
              <p className="text-sm text-gray-400">
                Після створення ця подія буде відображатися як безкоштовна.
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setIsZeroPriceConfirmOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Скасувати
              </button>
              <button
                onClick={handleConfirmZeroPrice}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Обробка...' : 'Створити безкоштовно'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
