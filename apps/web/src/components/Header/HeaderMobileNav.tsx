'use client';

import { menuItems } from '@/components/Header/HeaderNav';
import { HeaderMobileNavProps } from '@/interfaces';
import { getLinkWithRegion } from '@/utils/url';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function HeaderMobileNav({ setMenuOpen }: HeaderMobileNavProps) {
  const searchParams = useSearchParams();
  const regionSlug = searchParams?.get('region') ?? null;
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (title: string) => {
    setOpenDropdown(prev => (prev === title ? null : title));
  };

  return (
    <nav className="flex min-h-0 grow flex-col gap-2 overflow-y-auto pr-1 overscroll-contain">
      {menuItems.map(menu =>
        menu.items?.length ? (
          <div key={menu.title}>
            <button
              onClick={() => toggleDropdown(menu.title)}
              className="pl-3 flex justify-between items-center w-full text-left text-lg hover:text-gray-300 transition"
            >
              {menu.title}
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${
                  openDropdown === menu.title ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === menu.title && (
              <div className="flex flex-col pl-4 mt-2 gap-2">
                {menu.items.map(item =>
                  item.href ? (
                    <Link
                      key={item.label}
                      href={getLinkWithRegion(item.href, regionSlug)}
                      className="text-sm text-gray-300 hover:text-white transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span key={item.label} className="text-sm text-gray-500">
                      {item.label}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
        ) : menu.href ? (
          <Link
            key={menu.title}
            href={getLinkWithRegion(menu.href, regionSlug)}
            className="pl-3 text-lg hover:text-gray-300 transition"
            onClick={() => setMenuOpen(false)}
          >
            {menu.title}
          </Link>
        ) : (
          <span key={menu.title} className="pl-3 text-lg text-gray-500">
            {menu.title}
          </span>
        ),
      )}
    </nav>
  );
}
