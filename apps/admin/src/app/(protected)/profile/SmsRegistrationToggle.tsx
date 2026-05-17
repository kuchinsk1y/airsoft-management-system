'use client'

import { useTransition } from 'react'

interface SmsRegistrationToggleProps {
  enabled: boolean
  onChangeAction: (formData: FormData) => Promise<void>
}

export default function SmsRegistrationToggle({ enabled, onChangeAction }: SmsRegistrationToggleProps) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (checked: boolean) => {
    const formData = new FormData()
    formData.set('registrationSmsEnabled', checked ? 'true' : 'false')

    startTransition(() => {
      void onChangeAction(formData)
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
        <span>
          <span className="block text-sm text-white font-medium">SMS при реєстрації на подію</span>
          <span className="block text-xs text-gray-400 mt-1">
            Off: тільки email. On: email та SMS (якщо є номер).
          </span>
        </span>

        <span className="relative inline-flex items-center">
          <input
            type="checkbox"
            checked={enabled}
            disabled={isPending}
            onChange={(e) => handleChange(e.target.checked)}
            className="peer sr-only"
          />
          <span className="h-7 w-12 rounded-full border border-white/15 bg-neutral-800 transition-colors peer-checked:bg-(--color-primary) peer-disabled:opacity-50" />
          <span className="pointer-events-none absolute left-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>

      {isPending && (
        <p className="mt-2 text-xs text-gray-400">Зберігаємо...</p>
      )}
    </div>
  )
}
