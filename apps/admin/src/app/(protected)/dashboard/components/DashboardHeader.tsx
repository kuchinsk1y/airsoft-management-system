'use client'

import { motion, Variants } from 'framer-motion'
import Link from 'next/link'
import { MdBusiness, MdEdit, MdEvent, MdRateReview, MdShoppingCart } from 'react-icons/md'

const fadeUp: Variants = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
}

const quickActions = [
  {
    title: 'Створити подію',
    icon: MdEvent,
    action: '/events',
  },
  {
    title: 'Замовлення',
    icon: MdShoppingCart,
    action: '/orders',
  },
  {
    title: 'Модерація подій',
    icon: MdRateReview,
    action: '/events/moderation',
  },
  {
    title: 'Редагувати головну',
    icon: MdEdit,
    action: '/pages/basic/main',
  },
]

interface DashboardHeaderProps {
  hasApplications: boolean
  showCreateApplicationAction: boolean
  onQuickAction: (action: string) => void
}

export default function DashboardHeader({ hasApplications, showCreateApplicationAction, onQuickAction }: DashboardHeaderProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 transition-[gap] duration-300 ease-out"
    >
      <div className="lg:shrink-0">
        <h1 className="text-[clamp(1.75rem,3.6vw,2.25rem)] font-black tracking-[-0.033em] transition-[font-size] duration-300 ease-out">
          Панель керування
        </h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 lg:justify-end w-full lg:w-auto">
        {showCreateApplicationAction && !hasApplications && (
          <Link
            href="/create-application"
            className="inline-flex items-center justify-center gap-2 bg-(--color-primary) hover:bg-(--color-primary-hover) text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold whitespace-nowrap min-h-10"
          >
            <MdBusiness className="text-lg" />
            Створити організацію
          </Link>
        )}
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.title}
              onClick={() => onQuickAction(action.action)}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="bg-(--color-primary) hover:bg-(--color-primary-hover) text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap min-h-10"
            >
              <Icon className="text-lg" />
              <span>{action.title}</span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
