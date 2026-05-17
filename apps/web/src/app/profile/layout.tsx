import Loader from '@/components/generics/loader/Loader';
import BreadCrumbs from '@/components/Profile/BreadCrumbs';
import ProfileEventsSectionServer from '@/components/Profile/ProfileEventsSectionServer';
import ProfileNav from '@/components/Profile/ProfileNav';
import { Suspense } from 'react';

const navLinks = [
  { title: 'МОЯ КОМАНДА', href: '/profile/team' },
  { title: 'МОЇ ПОВІДОМЛЕННЯ', href: '/profile/notifications' },
  { title: 'МОЇ ВІДГУКИ', href: '/profile/reviews' },
  { title: 'ЗАПЛАНОВАНІ ІГРИ', href: '/profile/games' },
  { title: 'АРХІВ ІГОР', href: '/profile/archive' },
  { title: 'ЗАМОВЛЕННЯ', href: '/profile/orders' },
  { title: 'ВИЙТИ З КАБІНЕТУ', href: '/logout' },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadCrumbs links={navLinks} />

      <div className="flex flex-col min991:flex-row w-full ">
        <ProfileNav links={navLinks} />
        <div className="flex-1 min-h-screen p-2 min991:p-10 min991:border-l">
          <Suspense
            fallback={
              <Loader text="Завантаження профілю..." />
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
      <Suspense
        fallback={
            <Loader text="Завантаження подій..." />
        }
      >
        <ProfileEventsSectionServer />
      </Suspense>
    </>
  );
}
