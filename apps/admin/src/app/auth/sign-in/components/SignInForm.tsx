'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { login } from '@/actions/auth'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { useApplication } from '@/contexts/ApplicationContext'

export default function SignInForm() {
  const router = useRouter()
  const { refreshApplications } = useApplication()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login(formData.email, formData.password)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      const { isAdmin } = await refreshApplications()
      router.push(isAdmin ? '/dashboard' : '/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка під час входу')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <div className="p-3 text-sm text-red-500 bg-red-100/10 rounded-lg">{error}</div>}

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">Email</p>
        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Введіть свою електронну адресу" className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500" required/>
      </label>

      <label className="flex flex-col">
        <p className="text-white text-base font-medium pb-2">Пароль</p>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} placeholder="Введіть ваш пароль" className="form-input w-full rounded-lg p-4 text-white bg-transparent border border-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500" required/>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
            title={showPassword ? 'Сховати пароль' : 'Показати пароль'}
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        </div>
        <div className="mt-2 text-right">
          <Link href="/auth/forgot-password" className="text-sm text-orange-500 hover:text-orange-400 font-medium">
            Забули пароль?
          </Link>
        </div>
      </label>

      <button type="submit" disabled={isLoading} className="w-full h-12 bg-(--color-primary) text-white rounded-lg font-bold hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50">
        {isLoading ? 'Вхід...' : 'Вхід'}
      </button>
        {isLoading ? (
              <div className=" flex items-center justify-center backdrop-blur-[1px]">
                <LoadingSpinner size="sm" thickness="thin" />
              </div>
            ) : (
              <div className="h-6"></div>
            )}

      <div className="-mt-4 text-center">
        <p className="text-white/70 text-sm">
          Не маєте облікового запису?{' '}
          <Link href="/auth/sign-up" className="text-orange-500 hover:text-orange-400 font-medium">
            Зареєструватися
          </Link>
        </p>
      </div>
    </form>
  )
}
