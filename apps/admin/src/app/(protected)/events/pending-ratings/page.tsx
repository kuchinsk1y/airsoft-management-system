import PendingRatingsTab from '../tabs/pending-ratings/PendingRatingsTab'
import TabsNavigation from '../components/TabsNavigation'

export default function PendingRatingsPage() {
  return (
    <div className="space-y-6">
      <TabsNavigation />
      <PendingRatingsTab />
    </div>
  )
}
