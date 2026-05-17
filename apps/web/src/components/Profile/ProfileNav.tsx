'use client';

import { ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ProfileLinks } from '@/interfaces';
import { useUser } from '@/contexts/UserContext';

export default function ProfileNav({ links }: { links: ProfileLinks[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const isProfileActive = pathname === '/profile';
  const { handleLogout } = useUser();

  const handleLogoutClick = async () => {
    await handleLogout();
  };

  return (
    <div className="min991:sticky min991:top-15 h-fit z-20 w-full min991:w-fit">
      <aside className="text-[#FFFFFF] border-[#FFFFFF] ">
        <div className="flex w-full items-center justify-between p-2.5 min991:hidden border-b hover:bg-gray-800 transition-colors">
          <Link
            href="/profile"
            className={`font-semibold text-2xl uppercase whitespace-nowrap duration-200 ${
              isProfileActive ? 'text-[#FF4500]' : 'text-gray-300 hover:text-white'
            }`}
          >
            Мій профіль
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1"
            aria-label="Toggle profile menu"
          >
            <ChevronDown
              className={`w-6 h-6 min991:hidden ${isOpen ? 'rotate-0 text-[#FA4616]' : '-rotate-90 text-[#FFFFFF]'} duration-200`}
            />
          </button>
        </div>
        <nav
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          } min991:grid-rows-[1fr] min991:opacity-100`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-6 p-2.5 min991:p-10 border-b min991:border-0">
              <Link
                href="/profile"
                className={`hidden min991:block ${
                  isProfileActive ? 'text-[#FF4D00]' : 'text-gray-300 hover:text-white'
                } text-[20px] font-semibold uppercase whitespace-nowrap transition-colors`}
              >
                Мій профіль
              </Link>
              {links.map((link, index) => {
                const isActive = pathname === link.href;
                const isLogout = link.href === '/logout';

                if (isLogout) {
                  return (
                    <button
                      key={index}
                      onClick={handleLogoutClick}
                      className="block text-2xl min991:text-[20px] leading-6 whitespace-nowrap tracking-8 uppercase transition-colors text-red-500 hover:text-red-400 text-left"
                    >
                      {link.title}
                    </button>
                  );
                }

                return (
                  <Link
                    key={index}
                    href={link.href}
                    className={`block text-2xl min991:text-[20px] leading-6 whitespace-nowrap tracking-8 uppercase transition-colors ${
                      isActive ? 'text-[#FF4500]' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {link.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>
    </div>
  );
}
