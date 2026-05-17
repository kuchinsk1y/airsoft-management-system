import ArchiveTab from '../tabs/archive/ArchiveTab'
import TabsNavigation from '../components/TabsNavigation'

export default function ArchivePage() {
  return (
    <div className="space-y-6">
      <TabsNavigation />
      <ArchiveTab />
    </div>
  )
}
