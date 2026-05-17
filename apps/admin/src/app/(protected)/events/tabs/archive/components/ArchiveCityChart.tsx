'use client'

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface ArchiveCityChartProps {
  labels: string[]
  data: number[]
}

export default function ArchiveCityChart({ labels, data }: ArchiveCityChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<Chart | null>(null)

  useEffect(() => {
    const primaryColor = '#ea580c'
    const textColor = 'rgba(255, 255, 255, 0.7)'
    const colors = ['#ea580c', '#f59e0b', '#d97706', '#b45309', '#f97316', '#c2410c', '#9a3412']

    if (!chartRef.current) return
    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: labels.map((_, idx) => colors[idx % colors.length]),
            borderColor: '#111111',
            borderWidth: 4,
            hoverOffset: 8,
          },
        ],
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
              padding: 16,
              usePointStyle: true,
              pointStyle: 'rectRounded',
            },
          },
          tooltip: {
            backgroundColor: '#111',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: primaryColor,
            borderWidth: 1,
          },
        },
      },
    })

    return () => {
      chartInstanceRef.current?.destroy()
      chartInstanceRef.current = null
    }
  }, [labels, data])

  return <canvas ref={chartRef}></canvas>
}
