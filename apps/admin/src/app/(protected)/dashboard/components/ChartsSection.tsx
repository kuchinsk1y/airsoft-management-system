'use client'

import { Chart, registerables } from 'chart.js'
import { motion, Variants } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

Chart.register(...registerables)

const fadeUp: Variants = {
  hidden: { opacity: 0, scale: 0.985 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
}

interface ChartsSectionProps {
  dailyLabels: string[]
  dailyData: number[]
  eventTypeLabels: string[]
  eventTypeData: number[]
}

export default function ChartsSection({
  dailyLabels,
  dailyData,
  eventTypeLabels,
  eventTypeData
}: ChartsSectionProps) {
  const [mobileChart, setMobileChart] = useState<'registrations' | 'types'>('registrations')
  const userActivityChartRef = useRef<HTMLCanvasElement>(null)
  const eventStatsChartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const primaryColor = '#ea580c'
    const gridColor = 'rgba(255, 255, 255, 0.1)'
    const textColor = 'rgba(255, 255, 255, 0.7)'

    if (!userActivityChartRef.current) return

    const userActivityCtx = userActivityChartRef.current.getContext('2d')
    if (!userActivityCtx) return

    const gradient = userActivityCtx.createLinearGradient(0, 0, 0, userActivityCtx.canvas.height)
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.5)')
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0)')

    const userActivityChart = new Chart(userActivityCtx, {
      type: 'line',
      data: {
        labels: dailyLabels,
        datasets: [{
          label: 'Події',
          data: dailyData,
          borderColor: primaryColor,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: primaryColor,
          pointBorderColor: '#000',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: primaryColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: primaryColor,
            borderWidth: 1
          }
        },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    })

    return () => userActivityChart.destroy()
  }, [dailyLabels, dailyData])

  useEffect(() => {
    const primaryColor = '#ea580c'
    const textColor = 'rgba(255, 255, 255, 0.7)'

    if (!eventStatsChartRef.current) return

    const eventStatsCtx = eventStatsChartRef.current.getContext('2d')
    if (!eventStatsCtx) return

    const eventStatsChart = new Chart(eventStatsCtx, {
      type: 'doughnut',
      data: {
        labels: eventTypeLabels,
        datasets: [{
          data: eventTypeData,
          backgroundColor: ['#ea580c', '#f59e0b', '#d97706', '#b45309', '#f97316'],
          borderColor: '#111111',
          borderWidth: 4,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              padding: 20,
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            backgroundColor: '#111',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: primaryColor,
            borderWidth: 1
          }
        }
      }
    })

    return () => eventStatsChart.destroy()
  }, [eventTypeLabels, eventTypeData])

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="inline-flex lg:hidden rounded-lg border border-(--color-primary)/30 bg-black/40 p-1 gap-1">
        <button
          type="button"
          onClick={() => setMobileChart('registrations')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            mobileChart === 'registrations'
              ? 'bg-(--color-primary) text-white'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          Динаміка
        </button>
        <button
          type="button"
          onClick={() => setMobileChart('types')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            mobileChart === 'types'
              ? 'bg-(--color-primary) text-white'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          Типи
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 transition-[grid-template-columns,gap] duration-300 ease-out">
        <motion.div
          variants={fadeUp}
          whileHover={{ y: -2, scale: 1.005 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`lg:col-span-2 flex flex-col gap-4 rounded-xl p-[clamp(1rem,2.2vw,1.5rem)] border-2 border-(--color-primary) bg-black/40 backdrop-blur-sm transition-[padding,gap,transform] duration-300 ease-out ${mobileChart === 'types' ? 'hidden lg:flex' : 'flex'}`}
        >
          <h3 className="text-white text-[clamp(1.125rem,2vw,1.25rem)] font-bold transition-[font-size] duration-300 ease-out">
            Динаміка подій
          </h3>
          <p className="text-gray-400 text-sm">Кількість подій за останні 30 днів.</p>
          <div className="w-full h-[clamp(12rem,30vw,16rem)] transition-[height] duration-300 ease-out">
            <canvas ref={userActivityChartRef}></canvas>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          whileHover={{ y: -2, scale: 1.005 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={`flex flex-col gap-4 rounded-xl p-[clamp(1rem,2.2vw,1.5rem)] border-2 border-(--color-primary) bg-black/40 backdrop-blur-sm transition-[padding,gap,transform] duration-300 ease-out ${mobileChart === 'registrations' ? 'hidden lg:flex' : 'flex'}`}
        >
          <h3 className="text-white text-[clamp(1.125rem,2vw,1.25rem)] font-bold transition-[font-size] duration-300 ease-out">
            Статистика подій
          </h3>
          <p className="text-gray-400 text-sm">Співвідношення за типами ігор.</p>
          <div className="w-full h-[clamp(12rem,30vw,16rem)] flex items-center justify-center transition-[height] duration-300 ease-out">
            <canvas ref={eventStatsChartRef}></canvas>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
