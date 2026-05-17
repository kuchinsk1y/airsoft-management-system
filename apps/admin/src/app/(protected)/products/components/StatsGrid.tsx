type StatsCounts = {
  total: number
  active: number
  inStock: number
  rent: number
  sale: number
}

interface StatsGridProps {
  stats: StatsCounts
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: 'Всього', value: stats.total, accentClass: 'text-white' },
    { label: 'Активні', value: stats.active, accentClass: 'text-green-400' },
    { label: 'В наявності', value: stats.inStock, accentClass: 'text-blue-400' },
    { label: 'Оренда', value: stats.rent, accentClass: 'text-(--color-primary)' },
    { label: 'Продаж', value: stats.sale, accentClass: 'text-purple-400' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-black/30 border-2 border-white/10 rounded-lg p-3 sm:p-4 shadow-lg shadow-black/20 hover:shadow-black/30 transition-all"
        >
          <p className="text-gray-400 text-xs sm:text-sm mb-1">{item.label}</p>
          <p className={`text-xl sm:text-2xl font-bold ${item.accentClass}`}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}
