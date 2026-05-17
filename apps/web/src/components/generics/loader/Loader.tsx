
export default function Loader({
  text = 'Завантаження...',
}: {text?: string}) {
  return (
    <div
      className="flex flex-col h-full w-full items-center justify-center gap-2 py-10"
      role="status"
      aria-live="polite"
    >
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 min991:h-14 min991:w-14 border-b-2 border-white mx-auto" />
      <p className="  text-gray-400 mt-4">{text}</p>
    </div>
  );
}
