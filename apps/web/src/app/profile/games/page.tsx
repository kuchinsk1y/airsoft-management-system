import { getUserEvents } from '@/actions/events';
import Card from '@/components/content/events/Card';
import { buildNoIndexMetadata } from '../../utils/noindex-metadata';

export const metadata = buildNoIndexMetadata({
  title: 'Заплановані ігри | Strike Shop Action',
  canonicalPath: '/profile/games',
  description: 'Приватна сторінка активних ігор користувача.',
});

export default async function GamesPage() {
  const allEvents = await getUserEvents();
  const events = allEvents.filter((event) => event.isActive);

  return (
    <>
      <h1 className="text-2xl font-bold p-2.5 min991:px-0 min991:pt-0">ЗАПЛАНОВАНІ ІГРИ</h1>
      
      {events.length === 0 ? (
        <div className="text-center py-10 px-4 min991:px-0">
          <p className="text-gray-400 text-lg">
            У вас немає активних ігор
          </p>
        </div>
      ) : (
        <div className="min991:-mx-10 border-t border-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-white md:[&>*:nth-child(odd)]:border-r lg:[&>*:nth-child(3n+1)]:border-r lg:[&>*:nth-child(3n+2)]:border-r">
            {events.map((event) => (
              <Card key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
