'use client';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  blockName?: string;
}

export default function DeleteBlockConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
  blockName = 'Елемент',
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center  bg-black/70 backdrop-blur-sm p-4 text-white ">
      <div className="flex flex-col justify-center items-center gap-6 p-6 w-full max-w-75 bg-black/80 border-2 border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center justify-center gap-2">
          <h2 className="text-lg font-bold ">Видалити?</h2>
          {blockName && (
            <p className="text-center text-sm text-gray-400">
              &quot;{blockName}&quot; буде видалено назавжди.
            </p>
          )}
        </div>
        <div className="  flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {isLoading ? 'Видалення...' : 'Видалити'}
          </button>
        </div>
      </div>
    </div>
  );
}
