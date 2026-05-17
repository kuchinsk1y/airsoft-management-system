import { getRegions } from '@/actions/regions'
import { getCities } from '@/actions/cities'
import RegionsCitiesSeoClient from './RegionsCitiesSeoClient'

export default async function RegionsCitiesSeoPage() {
  const [regions, allCities] = await Promise.all([getRegions(), getCities()])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          SEO: Регіони та міста
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Редагування SEO тексту та FAQ для сторінок регіонів і міст
        </p>
      </div>

      <RegionsCitiesSeoClient regions={regions} allCities={allCities} />
    </div>
  )
}
