const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
} as const

const thicknessMap = {
  thin: 'border-2',
  normal: 'border-[3px]',
  thick: 'border-4',
} as const

interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap
  thickness?: keyof typeof thicknessMap
  className?: string
  ariaLabel?: string
}

export default function LoadingSpinner({
  size = 'lg',
  thickness = 'thin',
  className = '',
  ariaLabel = 'Завантаження...'
}: LoadingSpinnerProps) {
  const sizeClass = sizeMap[size]
  const thicknessClass = thicknessMap[thickness]

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`animate-spin rounded-full border-solid border-[rgba(255,255,255,0.08)] border-t-(--color-primary) ${sizeClass} ${thicknessClass} ${className}`.trim()}
    />
  )
}
