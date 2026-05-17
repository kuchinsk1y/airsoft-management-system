import { UserProvider } from '@/contexts/UserContext';
import type { Metadata } from 'next';
import { Sofia_Sans } from 'next/font/google';
import { Suspense } from 'react';
import Footer from '../components/Footer/FooterWrapper';
import Header from '../components/Header/HeaderWrapper';
import './globals.css';
import Script from 'next/script';
import CookiesConsent from '@/components/CookiesConsent/CookiesConsent';
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WEB_URL } from '@/utils/config';
import { getLocalizedAlternates, getRequestLocale } from './utils/locale-seo';

const sofiaSans = Sofia_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export async function generateMetadata(): Promise<Metadata> {
  const alternates = await getLocalizedAlternates('/');

  return {
    title: 'Strike Shop Action',
    description:
      'Strike Shop Action — страйкбол в Києві. Календар подій, прокат спорядження, рейтинги команд та гравців. Телефонуйте!',
    alternates,
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        {
          url: '/favicons/android-icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
      apple: [
        {
          url: '/favicons/apple-touch-icon-180x180.png',
          sizes: '180x180',
          type: 'image/png',
        },
      ],
    },
  };
}

type OrganizationApiResponse = {
  companyName?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  socialLinks?: Array<{
    provider?: string;
    url?: string;
  }>;
};

function resolvePublicUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  if (url.startsWith('/')) return `${NEXT_PUBLIC_WEB_URL}${url}`;

  return undefined;
}

async function getOrganizationSchema() {
  const fallback = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Strike Shop Action',
    url: NEXT_PUBLIC_WEB_URL,
    logo: `${NEXT_PUBLIC_WEB_URL}/TopLogo.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+380688888888',
      contactType: 'customer service',
      availableLanguage: 'Ukrainian',
    },
    sameAs: [
      'https://t.me/StrikeshopActionUkraine',
      'https://www.instagram.com/strikeshopaction',
    ],
  };

  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/organization`,
      {
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as OrganizationApiResponse;
    const sameAs = (data.socialLinks ?? [])
      .map((item) => item.url?.trim())
      .filter((url): url is string => Boolean(url));

    const logo = resolvePublicUrl(data.logoUrl) ?? fallback.logo;
    const websiteUrl = resolvePublicUrl(data.websiteUrl) ?? NEXT_PUBLIC_WEB_URL;
    const phone = data.phone?.trim() || fallback.contactPoint.telephone;

    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.companyName?.trim() || fallback.name,
      url: websiteUrl,
      logo,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: phone,
        contactType: 'customer service',
        availableLanguage: 'Ukrainian',
      },
      sameAs: sameAs.length > 0 ? sameAs : fallback.sameAs,
    };
  } catch {
    return fallback;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = await getOrganizationSchema();
  const locale = await getRequestLocale();
  const htmlLang = locale === 'ru' ? 'ru-UA' : 'uk-UA';

  return (
    <html
      lang={htmlLang}
      className={`${sofiaSans.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <Script
          id="consent-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied'
              });`,
          }}
        />
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
               new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
               j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
               'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','GTM-5TRF2T5K'); `,
          }}
        />
      </head>
      <body
        className={`bg-black text-white flex flex-col min-h-screen h-full `}
      >
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5TRF2T5K"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <UserProvider>
          <div className="flex flex-col flex-1 border border-white h-full min991:mx-4 min320:mx-2 min991:my-4 min320:my-2 box-border">
            <Suspense fallback={<div className="h-16" />}>
              <Header />
            </Suspense>
            <main className="flex min-h-0 grow flex-col">{children}</main>
            <Footer />
          </div>
          <CookiesConsent />
        </UserProvider>
      </body>
    </html>
  );
}
