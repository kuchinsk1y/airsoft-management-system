'use client'

import OrganizationSettingsClient from './OrganizationSettingsClient'

export default function SeoEditorPageClient() {
  return (
    <div className="relative space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Дані організації
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Редагування глобальних даних організації для SEO schema
          </p>
        </div>
      </div>

      <OrganizationSettingsClient />
    </div>
  )
}
