import { getCurrentUser } from '@/actions/users'
import { getApplications } from '@/actions/applications'
import { getOrganization, updateOrganization } from '@/actions/organizations'
import ProfileClient from './ProfileClient'
import ProfileNotifications from './ProfileNotifications'
import SmsRegistrationToggle from './SmsRegistrationToggle'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  searchParams?: Promise<{ smsSaved?: string }> | { smsSaved?: string }
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<{ smsSaved?: string }>).then === 'function'
      ? await (searchParams as Promise<{ smsSaved?: string }>)
      : (searchParams as { smsSaved?: string } | undefined)

  const [result, applicationsResult, organizationResult] = await Promise.all([
    getCurrentUser(),
    getApplications(),
    getOrganization(),
  ])

  if (!result.success || !result.data) redirect('/auth/sign-in')

  const isSuperAdmin =
    applicationsResult.status === 'success' && applicationsResult.isAdmin
  const registrationSmsEnabled =
    organizationResult.status === 'success' && organizationResult.data
      ? organizationResult.data.registrationSmsEnabled
      : true

  async function updateRegistrationSmsSettings(formData: FormData) {
    'use server'

    const apps = await getApplications()
    if (apps.status !== 'success' || !apps.isAdmin) {
      return
    }

    const enabled = formData.get('registrationSmsEnabled') === 'true'
    await updateOrganization({ registrationSmsEnabled: enabled })
    revalidatePath('/profile')
    redirect('/profile?smsSaved=1')
  }

  return (
    <div className="space-y-6">
      <ProfileNotifications showSmsSaved={resolvedSearchParams?.smsSaved === '1'} />
      <ProfileClient user={result.data} />

      {isSuperAdmin && (
        <div className="rounded-2xl border border-gray-800 bg-linear-to-br from-[#1a1a1a] to-black p-6">
          <h2 className="text-lg font-semibold text-white">Налаштування реєстрацій</h2>
          <p className="text-sm text-gray-400 mt-1 mb-5">
            Контролює канал підтвердження: email+SMS або тільки email.
          </p>

          <SmsRegistrationToggle
            enabled={registrationSmsEnabled}
            onChangeAction={updateRegistrationSmsSettings}
          />
        </div>
      )}
    </div>
  )
}
