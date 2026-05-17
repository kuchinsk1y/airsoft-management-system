import { MdSave } from 'react-icons/md'

interface SaveButtonProps {
  isSaving: boolean
  onClick: () => void
  disabled?: boolean
}

export default function SaveButton({ isSaving, onClick, disabled }: SaveButtonProps) {
  return (
    <div className="flex justify-end pt-4">
      <button
        type="button"
        onClick={onClick}
        disabled={isSaving || disabled}
        className="h-10 px-6 flex items-center gap-2 rounded-lg bg-(--color-primary) text-white text-sm font-semibold hover:bg-(--color-primary-hover) transition-colors shadow-lg shadow-[#ea580c]/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MdSave className="text-base" />
        <span>{isSaving ? 'Збереження...' : 'Зберегти всі зміни'}</span>
      </button>
    </div>
  )
}
