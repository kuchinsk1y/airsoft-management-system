'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type ConsentType = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export default function CookiesConsent() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [consent, setConsent] = useState<ConsentType>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');

    if (!consent) {
      setIsVisible(true);
      return;
    }

    try {
      const parsedConsent = JSON.parse(consent);
      setConsent(parsedConsent);
      updateConsent(parsedConsent);
    } catch {
      console.error('Error parsing cookie consent from localStorage');
      setIsVisible(true);
    }
  }, []);

  const updateConsent = (consent: ConsentType) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied',
        ad_user_data: consent.marketing ? 'granted' : 'denied',
        ad_personalization: consent.marketing ? 'granted' : 'denied',
      });
    }
  };

  const acceptCookiesAll = () => {
    const newConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setConsent(newConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent));
    updateConsent(newConsent);
    setIsVisible(false);
  };

  const rejectCookiesAll = () => {
    const newConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setConsent(newConsent);
    localStorage.setItem('cookieConsent', JSON.stringify(newConsent));
    updateConsent(newConsent);
    setIsVisible(false);
  };
  const isPrivacyPage = pathname === '/privacy-policy';

  if (!isVisible) return null;

  return (
    <>
      {isVisible && !isPrivacyPage && (
        <div className="fixed inset-0 bg-black/60 z-40" />
      )}
      <div
        className={`
      fixed z-50
      bottom-0 left-0 w-full

      min401:bottom-4 min401:left-1/2 min401:-translate-x-1/2 min401:w-[90%]
      min650:w-105
      min991:bottom-6 min991:right-6 min991:left-auto min991:translate-x-0 min991:w-120
      min1127:w-145

      bg-black text-white
      p-6
      flex flex-col  gap-4
      border border-white
      shadow-2xl 

      transform transition-all duration-700 ease-in-out
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
    `}
      >
        <h3 className="text-sm opacity-80">
          <p className="text-sm opacity-80 leading-relaxed">
            Ми використовуємо cookie для забезпечення роботи сайту, аналізу
            трафіку та покращення користувацького досвіду. Детальніше у{' '}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="underline underline-offset-2 hover:text-[#FA4616] transition-colors"
            >
              Політиці конфіденційності
            </Link>
            .
          </p>
        </h3>
        <div className="flex min650:flex-row gap-3 min650:justify-end">
          <button
            onClick={acceptCookiesAll}
            className="bg-white min650:w-auto text-black px-4 py-2 text-sm"
          >
            ПРИЙНЯТИ ВСІ
          </button>

          <button
            onClick={rejectCookiesAll}
            className="border border-white/40 text-white px-4 py-2 text-sm"
          >
            ВІДХИЛИТИ ВСІ
          </button>
        </div>
      </div>
    </>
  );
}
