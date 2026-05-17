'use client'

import { motion, Variants } from 'framer-motion'
import { IconType } from 'react-icons'
import { MdTrendingUp } from 'react-icons/md'

const fadeUp: Variants = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
}

const cardsStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 }
  }
}

const cardReveal: Variants = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  }
}

export interface StatCardData {
  title: string
  value: string
  delta?: string
  icon: IconType
  color: string
  bgColor: string
  href?: string
}

interface StatsCardsProps {
  stats: StatCardData[]
  onCardClick?: (href: string) => void
}

export default function StatsCards({ stats, onCardClick }: StatsCardsProps) {
  return (
    <motion.div variants={fadeUp}>
      <h2 className="text-[clamp(1.125rem,2.2vw,1.25rem)] font-bold mb-4 flex items-center gap-2 transition-[font-size] duration-300 ease-out">
        <MdTrendingUp className="text-(--color-primary) text-2xl" />
        Статистика сайту
      </h2>
      <motion.div
        className="grid grid-cols-1 min-[520px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 transition-[grid-template-columns,gap] duration-300 ease-out"
        variants={cardsStagger}
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              variants={cardReveal}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => {
                if (stat.href && onCardClick) {
                  onCardClick(stat.href)
                }
              }}
              className={`bg-black/50 backdrop-blur-sm p-[clamp(0.9rem,2.1vw,1.25rem)] rounded-xl border-2 border-(--color-primary) hover:bg-black/60 transition-[padding,background-color,transform] duration-300 ease-out min-h-31 ${stat.href ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-[clamp(0.55rem,1.3vw,0.65rem)] rounded-lg transition-[padding] duration-300 ease-out ${stat.bgColor}`}>
                  <Icon className={`text-xl ${stat.color}`} />
                </div>
                {stat.delta && (
                  <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded">
                    {stat.delta}
                  </span>
                )}
              </div>
              <h3 className="text-sm text-gray-400 mb-1">{stat.title}</h3>
              <p className="text-[clamp(1.5rem,3.1vw,2rem)] font-black text-white leading-none transition-[font-size] duration-300 ease-out">
                {stat.value}
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
