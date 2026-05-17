'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MdArrowDropDown } from 'react-icons/md'
import { getCities, type City } from '@/actions/cities'

interface CityComboboxProps {
  value: string // slug міста
  onChange: (citySlug: string) => void // передає slug
  error?: string
  title?: ReactNode
  placeholder?: string
  required?: boolean
  inputId?: string
  regionId?: number
}

export default function CityCombobox({
  value,
  onChange,
  error,
  title = 'Виберіть місто',
  placeholder = 'Введіть назву міста...',
  required = false,
  inputId,
  regionId,
}: CityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: cities = [], isLoading, isError } = useQuery({
    queryKey: ['cities', regionId ?? 'all'],
    queryFn: () => getCities(regionId),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })

  // Синхронізувати inputValue: знайти місто по slug і показати його name
  useEffect(() => {
    const city = cities.find((c) => c.slug === value)
    setInputValue(city?.name || value)
  }, [value, cities])

  const filteredCities = !inputValue.trim()
    ? cities
    : cities.filter((city) => {
        const searchLower = inputValue.toLowerCase()
        return (
          city.name.toLowerCase().includes(searchLower) ||
          city.slug.toLowerCase().includes(searchLower)
        )
      })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsOpen(true)
  }

  const handleSelectCity = (city: City) => {
    setInputValue(city.name) // Показуємо name в інпуті
    onChange(city.slug) // Відправляємо slug наверх
    setIsOpen(false)
  }

  const handleInputBlur = () => {
    // Якщо введене значення не співпадає з жодним містом, залишаємо як є
    const matchedCity = cities.find((c) => c.name.toLowerCase() === inputValue.toLowerCase())
    if (matchedCity) {
      onChange(matchedCity.slug)
    }
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs text-gray-400 mb-1">{title}</label>
      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={isLoading}
          required={required}
          className="w-full bg-white/5 text-white px-3 py-2 pr-10 rounded-lg border border-white/10 focus:border-(--color-primary) focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setIsOpen(!isOpen)}
          title="Розкрити список міст"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <MdArrowDropDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 border border-white/10 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-gray-400 text-sm">Завантажую міста...</div>
          ) : isError ? (
            <div className="px-3 py-2 text-gray-400 text-sm">Помилка при завантаженні міст</div>
          ) : filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelectCity(city)
                }}
                className={`w-full text-left px-3 py-2 hover:bg-white/10 transition-colors ${
                  value === city.slug ? 'bg-white/20 text-white' : 'text-gray-200'
                }`}
              >
                <div className="font-medium">{city.name}</div>
                <div className="text-xs text-gray-500">{city.slug}</div>
              </button>
            ))
          ) : inputValue.trim() ? (
            <div className="px-3 py-2 text-gray-400 text-sm">
              Місто не знайдено. Виберіть зі списку.
            </div>
          ) : (
            <div className="px-3 py-2 text-gray-400 text-sm">Почніть вводити назву міста</div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
