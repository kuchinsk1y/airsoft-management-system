import { getEvents } from '@/actions/events';
import ProfileEventsSection from '@/components/Profile/ProfileEventsSection';

export default async function ProfileEventsSectionServer() {
  const events = await getEvents();
  return <ProfileEventsSection events={events} />;
}
