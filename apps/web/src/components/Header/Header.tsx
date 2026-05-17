'use client';

import { RegionDropdown } from '@/components/Header/RegionDropdown';
import { HeaderMobileNav } from '@/components/Header/HeaderMobileNav';
import { HeaderNav } from '@/components/Header/HeaderNav';
import UserDropdown from '@/components/Header/UserDropdown';
import { Cart } from '@/components/content/products/Cart';
import { useUser } from '@/contexts/UserContext';
import { useCartStore } from '@/stores/cartStore';
import { Menu, ShoppingCart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GeneralButton } from '../generics/button/Button';
import TelegramIcon from '../icons/TelegramIcon';
import MessagesIcon from '../icons/MessagesIcon';
import BackdropModal from '../generics/banners/BackdropModal';
import WarningIcon from '../icons/WarningIcon';
import { getNotificationsBadgeData } from '@/actions/notifications';
import { toSeoSafeHref } from '@/utils/seo-hide';

const NOTIFICATIONS_REFRESH_COOLDOWN_MS = 60 * 1000;

type HeaderOrgData = {
  phone?: string | null;
  socialLinks: { provider: string; url: string }[];
};

export default function Header({ orgData }: { orgData?: HeaderOrgData }) {
  const searchParams = useSearchParams();
  const regionSlug = searchParams?.get('region');
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] =
    useState(false);
  const { user, isLoading, handleLogout } = useUser();
  const openCart = useCartStore((state) => state.openCart);
  const totalItems = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const notificationsLastRefreshAtRef = useRef(0);
  const notificationsRefreshInFlightRef = useRef(false);
  const totalCartItems = isClientMounted ? totalItems : 0;
  const telegramUrl = (orgData?.socialLinks ?? []).find((l) => l.provider === 'telegram')?.url?.trim();
  const telegramHref = telegramUrl ? toSeoSafeHref(telegramUrl) : null;
  const phoneLinks = (orgData?.socialLinks ?? [])
    .filter((link) => link.provider === 'phone' && link.url?.trim())
    .map((link) => link.url.trim());
  const headerPhones = [orgData?.phone?.trim(), ...phoneLinks]
    .filter((phone): phone is string => Boolean(phone))
    .filter((phone, index, arr) => arr.indexOf(phone) === index)
    .slice(0, 2);

  const homeLink = useMemo(() => (regionSlug ? `/?region=${regionSlug}` : '/'), [regionSlug]);
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [menuOpen]);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setPendingInvitesCount(0);
      setUnreadNotificationsCount(0);
      return;
    }

    let mounted = true;

    const refresh = async (force = false) => {
      const now = Date.now();
      if (notificationsRefreshInFlightRef.current) return;
      if (
        !force &&
        now - notificationsLastRefreshAtRef.current <
          NOTIFICATIONS_REFRESH_COOLDOWN_MS
      ) {
        return;
      }

      notificationsRefreshInFlightRef.current = true;
      notificationsLastRefreshAtRef.current = now;

      try {
        const { pendingInvitesCount: invites, unreadNotificationsCount: unread } =
          await getNotificationsBadgeData();
        if (!mounted) return;
        setPendingInvitesCount(invites);
        setUnreadNotificationsCount(unread);
      } catch {
        if (!mounted) return;
        setPendingInvitesCount(0);
        setUnreadNotificationsCount(0);
      } finally {
        notificationsRefreshInFlightRef.current = false;
      }
    };

    refresh(true);

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const onNotificationsUpdated = () => refresh(true);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('notifications-updated', onNotificationsUpdated);
    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('notifications-updated', onNotificationsUpdated);
    };
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white py-2 px-2 min991:py-3 min991:px-6 min-[1480px]:px-16">
      {isAuthRequiredModalOpen ? (
        <BackdropModal
          icon={WarningIcon}
          text="Необхідно увійти в систему"
        >
          <GeneralButton
            text="ЗРОЗУМІЛО"
            variant="orange-bg"
            className="uppercase w-full border-none"
            onClick={() => setIsAuthRequiredModalOpen(false)}
          />
        </BackdropModal>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center min-w-0">
          <Link href={homeLink} className="shrink-0 min-w-24">
            <Image
              src="/Strikeshop_Action_logo.png"
              alt="Strikeshop Action Logo"
              width={96}
              height={46}
              className="w-24 h-[45.75px] shrink-0"
              priority
            />
          </Link>

          <div className="hidden max991:hidden md:flex min-w-0">
            <HeaderNav />
          </div>
        </div>

        <div className="flex items-center gap-2 min991:gap-2 min-[1400px]:gap-3">
          <div className="flex items-center gap-3">
            <div className="hidden min-[1400px]:flex min-[1400px]:flex-col">
              {headerPhones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="block hover:underline text-sm whitespace-nowrap"
                >
                  {phone}
                </a>
              ))}
            </div>
            {telegramHref ? (
              <a
                href={telegramHref}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="Telegram Strikeshop Action Ukraine"
                title="Telegram Strikeshop Action Ukraine"
                className="hidden min991:flex relative items-center justify-center border border-white w-9 h-9 transition text-white/70 hover:bg-gray-800 hover:text-white"
              >
                <TelegramIcon className="w-4.5 h-4.5" />
              </a>
            ) : null}

            <button
              type="button"
              className="relative flex items-center justify-center border border-white w-9 h-9 hover:bg-gray-800 transition text-white/70 hover:text-white"
              aria-label="Мої повідомлення"
              onClick={() => {
                if (isLoading) return;
                if (!user) {
                  setIsAuthRequiredModalOpen(true);
                  return;
                }
                router.push('/profile/notifications');
              }}
            >
              <MessagesIcon className="w-4 h-4" />
              {pendingInvitesCount + unreadNotificationsCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-[#FA4616] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingInvitesCount + unreadNotificationsCount > 99
                    ? '99+'
                    : pendingInvitesCount + unreadNotificationsCount}
                </span>
              ) : null}
            </button>

            <button
              className="relative flex items-center justify-center border border-white w-9 h-9 hover:bg-gray-800 transition text-white/70 hover:text-white"
              onClick={openCart}
              aria-label="Відкрити кошик"
            >
              <ShoppingCart className="w-4 h-4" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FA4616] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalCartItems > 99 ? '99+' : totalCartItems}
                </span>
              )}
            </button>
          </div>

          <div className="flex mx-2">
            <RegionDropdown />
          </div>

          {isClientMounted && !isLoading && (
            <>
              {user ? (
                <div className="hidden min991:flex">
                  <UserDropdown fullName={user.fullName} />
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <GeneralButton
                      text="Вхід"
                      variant="white-border"
                      className="hidden min991:flex"
                    />
                  </Link>

                  <Link href="/register">
                    <GeneralButton
                      text="Реєстрація"
                      variant="white-border"
                      className="hidden min-[1280px]:flex "
                    />
                  </Link>
                </>
              )}
            </>
          )}

          <button
            className="border border-white p-2 hover:bg-gray-800 transition min991:hidden"
            onClick={toggleMenu}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div
        className={`fixed inset-y-0 right-0 flex h-dvh w-full max-w-100 flex-col gap-4 justify-between overflow-hidden bg-[#212529] px-4 pt-11.5 pb-[calc(env(safe-area-inset-bottom)+1rem)] transform transition-transform duration-500 ${
          menuOpen
            ? 'translate-x-0'
            : 'translate-x-100 min320:max-w-screen min401:max-w-100'
        }`}
      >
        <X
          className="w-7 h-7 absolute top-2.25 right-2.25 cursor-pointer"
          onClick={() => setMenuOpen(false)}
        />

        <HeaderMobileNav setMenuOpen={setMenuOpen} />

        <div className="shrink-0">
          <div className="flex flex-col gap-3 text-white">
            <div className="flex flex-col text-lg font-medium">
              {headerPhones.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className="hover:underline">
                  {phone}
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setMenuOpen(false)}>
                      <GeneralButton
                        text="Мій обліковий запис"
                        variant="white-border"
                        className="w-full"
                      />
                    </Link>

                    <GeneralButton
                      text="Вихід"
                      variant="white-border"
                      className="w-full"
                      onClick={async () => {
                        await handleLogout();
                        setMenuOpen(false);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)}>
                      <GeneralButton text="Увійти" variant="white-border" className="w-full" />
                    </Link>

                    <Link href="/register" onClick={() => setMenuOpen(false)}>
                      <GeneralButton text="Реєстрація" variant="white-border" className="w-full" />
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Cart />
    </header>
  );
}
