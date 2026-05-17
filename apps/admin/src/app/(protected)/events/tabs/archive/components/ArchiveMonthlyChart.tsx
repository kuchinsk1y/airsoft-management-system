'use client'

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface ArchiveMonthlyChartProps {
  labels: string[]
  data: number[]
}

export default function ArchiveMonthlyChart({ labels, data }: ArchiveMonthlyChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<Chart | null>(null)

  useEffect(() => {
    const primaryColor = '#ea580c'
    const gridColor = 'rgba(255, 255, 255, 0.1)'
    const textColor = 'rgba(255, 255, 255, 0.7)'

    if (!chartRef.current) return
    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.45)')
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0)')

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Події',
            data,
            backgroundColor: gradient,
            borderColor: primaryColor,
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 36,
          },
        ],
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
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          y: {
            ticks: { color: textColor, precision: 0 },
            grid: { color: gridColor },
            beginAtZero: true,
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
