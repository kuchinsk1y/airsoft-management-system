'use client'

import Image from 'next/image'
import { MdVerified, MdEmail, MdPhone, MdLocationOn, MdCalendarToday, MdBadge, MdPerson } from 'react-icons/md'
import { UserProfile } from '@/actions/users'

interface ProfileClientProps {
  user: UserProfile
}

export default function ProfileClient({ user }: ProfileClientProps) {

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-neutral-900 via-[#1a1a1a] to-black p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-(--color-primary)/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 bottom-0 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Профіль</h1>
            <p className="text-sm text-gray-400 mt-1">Персональні дані та статус акаунта</p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-gray-300">
            ID: {user.id}
          </div>
        </div>

        <div className="relative mt-6 flex flex-col md:flex-row gap-6 md:items-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-800 border-2 border-(--color-primary) shrink-0 shadow-[0_0_30px_rgba(255,120,40,0.2)]">
            {user.logoUrl ? (
              <Image src={user.logoUrl} alt={user.nickName} width={96} height={96} className="w-full h-full object-cover"/>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold bg-linear-to-br from-(--color-primary) to-orange-600">
                {user.nickName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-60">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{user.nickName}</h2>
              {user.isVerified && (
                <MdVerified size={20} className="text-(--color-primary)" title="Підтверджений акаунт" />
              )}
            </div>
            {user.fullName && (
              <p className="text-base text-gray-300 mb-2 flex items-center gap-2"><MdPerson className="text-gray-500" />{user.fullName}</p>
            )}
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <MdBadge className="text-gray-500" />
              Зареєстровано {formatDate(user.createdAt)}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              {user.isVerified ? 'Верифікований' : 'Не верифікований'}
            </span>
            <span className="rounded-full border border-(--color-primary)/30 bg-(--color-primary)/10 px-3 py-1 text-xs text-orange-200">
              Активний профіль
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
        <h3 className="text-white font-semibold mb-4">Контактна інформація</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <MdEmail className="text-(--color-primary) text-lg shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-white">{user.email}</p>
            </div>
          </div>

          {user.phoneNumber && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <MdPhone className="text-(--color-primary) text-lg shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Телефон</p>
                <p className="text-sm text-white">{user.phoneNumber}</p>
              </div>
            </div>
          )}

          {user.dateOfBirth && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <MdCalendarToday className="text-(--color-primary) text-lg shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Дата народження</p>
                <p className="text-sm text-white">{formatDate(user.dateOfBirth)}</p>
              </div>
            </div>
          )}

          {(user.country || user.region || user.city) && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              <MdLocationOn className="text-(--color-primary) text-lg shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Локація</p>
                <p className="text-sm text-white">
                  {[user.city, user.region, user.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
