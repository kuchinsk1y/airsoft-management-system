import { getAllUsers } from '@/actions/users'
import { MdDownload } from 'react-icons/md'
import styles from './page.module.css'

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const buildLocation = (city: string | null, region: string | null, country: string | null) => {
  const parts = [city, region, country].filter(Boolean)
  if (parts.length === 0) return '—'
  return parts.join(', ')
}

export default async function UsersPage() {
  const users = await getAllUsers()

  return (
    <div className="text-white">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.033em]">Користувачі</h1>
          <p className="text-sm text-gray-400 mt-1">Список зареєстрованих користувачів платформи</p>
        </div>
        <div className="flex w-fit items-center gap-2">
          <a
            href="/api/users/export"
            className="inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-(--color-primary-hover)"
          >
            <MdDownload size={18} />
            Експорт контактів
          </a>
          <div className="inline-flex items-center rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-300">
            Всього: <span className="ml-2 font-semibold text-white">{users.length}</span>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="p-12 rounded-xl border-2 border-white/10 bg-black/30 text-center">
          <p className="text-gray-400 text-lg">Користувачів не знайдено</p>
        </div>
      ) : (
        <>
          <div className={`rounded-xl border-2 border-white/10 bg-black/30 overflow-hidden hidden md:block ${styles.tableEnter}`}>
            <div className="grid grid-cols-[4.2rem_1fr_1.1fr_1fr_1fr_0.9fr] gap-3 px-4 py-3 border-b border-white/10 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <span>ID</span>
              <span>Користувач</span>
              <span>Email</span>
              <span>Телефон</span>
              <span>Локація</span>
              <span>Реєстрація</span>
            </div>

            <div className="divide-y divide-white/5">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`${styles.rowReveal} grid grid-cols-[4.2rem_1fr_1.1fr_1fr_1fr_0.9fr] gap-3 px-4 py-3 hover:bg-white/3 transition-colors`}
                  style={{ animationDelay: `${Math.min(index * 32, 320)}ms` }}
                >
                  <span className="text-sm text-gray-300">#{user.id}</span>

                  <div className="min-w-0">
                    <p className="font-semibold truncate">{user.nickName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.fullName || '—'}</p>
                  </div>

                  <p className="text-sm text-gray-300 truncate">{user.email}</p>
                  <p className="text-sm text-gray-300 truncate">{user.phoneNumber || '—'}</p>
                  <p className="text-sm text-gray-300 truncate">{buildLocation(user.city, user.region, user.country)}</p>

                  <p className="text-sm text-gray-400">{formatDate(user.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`md:hidden space-y-3 ${styles.tableEnter}`}>
            {users.map((user, index) => (
              <div
                key={user.id}
                className={`${styles.cardReveal} rounded-xl border border-white/10 bg-black/30 p-4`}
                style={{ animationDelay: `${Math.min(index * 36, 360)}ms` }}
              >
                <div className="min-w-0">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{user.nickName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.fullName || '—'}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="text-gray-300 truncate">{user.email}</p>
                  <p className="text-gray-300">{user.phoneNumber || '—'}</p>
                  <p className="text-gray-400">{buildLocation(user.city, user.region, user.country)}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span>#{user.id}</span>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}