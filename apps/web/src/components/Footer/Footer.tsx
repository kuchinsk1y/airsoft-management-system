'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { getSocialNetworkIcon } from '@/config/socialNetworks';
import { toSeoSafeHref } from '@/utils/seo-hide';

export type FooterOrgData = {
  phone?: string | null;
  socialLinks: { provider: string; url: string }[];
};

function getSocialHref(provider: string, url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (provider === 'phone') return `tel:${trimmed.replace(/\s/g, '')}`;
  if (provider === 'email') return `mailto:${trimmed}`;
  return toSeoSafeHref(trimmed);
}

type FooterLinkItem = {
  title: string;
  href?: string;
};

export default function Footer({ orgData }: { orgData?: FooterOrgData }) {
  const [openSections, setOpenSections] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const liqpayHref = toSeoSafeHref('https://www.liqpay.ua');

  const phoneLinks = (orgData?.socialLinks ?? [])
    .filter((link) => link.provider === 'phone' && link.url?.trim())
    .map((link) => link.url.trim());

  const phones = [orgData?.phone?.trim(), ...phoneLinks]
    .filter((phone): phone is string => Boolean(phone))
    .filter((phone, index, arr) => arr.indexOf(phone) === index);

  const activeSocialLinks = (orgData?.socialLinks ?? []).filter(
    (link) => link.provider && link.url?.trim() && link.provider !== 'phone',
  );

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev === section ? null : section));
  };

  const navLinks: FooterLinkItem[] = [
    { title: 'Календар подій', href: '/events' },
    { title: 'Прокат спорядження', href: '/rental' },
    { title: 'Майстерня', href: '/workshop' },
    { title: 'Новини', href: '/news' },
    { title: 'Контакти', href: '/contacts' },
  ];

  const infoLinks: FooterLinkItem[] = [
    { title: 'Про компанію', href: '/about' },
    { title: 'Правила гри', href: '/rules' },
    { title: 'Карта сайту', href: '/sitemap.html' },
    { title: 'Договір публічної оферти', href: '/public-offer'  },
    { title: 'Політика конфіденційності', href: '/privacy-policy' },
    { title: 'Статутні документи', href: '/legal' },
  ];

  return (
    <footer className=" border-t border-white bg-[#212529] text-white py-10">
      <div className="grid grid-cols-1 max991:grid-cols-1 min991:grid-cols-4 gap-8">
        <div className="flex flex-col gap-3 px-6">
          <Link href="/" className="inline-block mb-3">
            <Image
              src="/Logo_Footer.svg"
              alt="Strikeshop Action Logo"
              width={120}
              height={50}
              className="w-auto h-auto"
            />
          </Link>

					<Link href='/terms' className='text-sm hover:underline'>
						Політика користування сайтом
					</Link>

          <p className="text-xs text-gray-400 mt-2">
            © {currentYear} StrikeShop Action. Усі права захищені.
          </p>

          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Способи оплати
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={liqpayHref ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center opacity-90 transition-opacity hover:opacity-100"
                aria-label="LiqPay — онлайн-платежі"
              >
                <Image
                  src="/liqpay-logo.svg"
                  alt="LiqPay"
                  width={120}
                  height={27}
                  className="h-7 w-auto sm:h-8"
                  unoptimized
                />
              </a>
            </div>
          </div>
        </div>

        <FooterSection
          title="Навігація"
          id="nav"
          openSections={openSections}
          toggleSection={toggleSection}
        >
          {navLinks.map((link, index) =>
            link.href ? (
              <Link
                key={index}
                href={link.href}
                className="hover:underline font-medium block"
              >
                {link.title}
              </Link>
            ) : (
              <span key={index} className="font-medium block text-gray-300">
                {link.title}
              </span>
            ),
          )}
        </FooterSection>

        <FooterSection
          title="Інформація"
          id="info"
          openSections={openSections}
          toggleSection={toggleSection}
        >
          {infoLinks.map((link, index) =>
            link.href ? (
              <Link
                key={index}
                href={link.href}
                className="hover:underline block"
              >
                {link.title}
              </Link>
            ) : (
              <span key={index} className="block text-gray-300">
                {link.title}
              </span>
            ),
          )}
        </FooterSection>

        <FooterSection
          title="Адреса офісу"
          id="contacts"
          openSections={openSections}
          toggleSection={toggleSection}
        >
          <div className="text-xs text-gray-400">
            <p>м. Київ, вул. Саксаганського, 42/80</p>
            <p>Головний офіс StrikeShop Action</p>
          </div>

          <h3 className="uppercase font-semibold text-xl mt-5 mb-2">
            Зв'яжіться з нами
          </h3>

          <div className="flex flex-col text-xs text-gray-400 gap-1 mb-4">
            {phones.length > 0 ? (
              <>
                {phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="block hover:underline text-sm"
                  >
                    {phone}
                  </a>
                ))}
              </>
            ) : (
              <span className="text-sm text-gray-500">Телефон не вказано</span>
            )}
          </div>

          {activeSocialLinks.length > 0 && (
            <div className="flex items-center gap-5">
              {activeSocialLinks.map((link) => {
                const href = getSocialHref(link.provider, link.url);
                const Icon = getSocialNetworkIcon(link.provider);
                if (!href) return null;
                return (
                  <a
                    key={link.provider}
                    href={href}
                    target={link.provider !== 'email' ? '_blank' : undefined}
                    rel={link.provider !== 'email' ? 'nofollow noopener noreferrer' : undefined}
                    aria-label={link.provider}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          )}
        </FooterSection>
      </div>
    </footer>
  );
}

function FooterSection({
  title,
  id,
  openSections,
  toggleSection,
  children,
}: {
  title: string;
  id: string;
  openSections: string | null;
  toggleSection: (id: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = openSections === id;

  return (
    <div className="flex flex-col text-sm border-y border-white max991:border-t min991:border-none px-6 py-2">
      <button
        className="flex justify-between items-center py-3"
        onClick={() => toggleSection(id)}
      >
        <h3
          className={`uppercase font-semibold text-xl whitespace-nowrap transition-colors ${
            isOpen ? 'text-[#FA4616]' : 'text-white'
          }`}
        >
          {title}
        </h3>

        <ChevronDown className={`w-5 h-5 transition-all min991:hidden ${
            isOpen ? 'rotate-180 text-[#FA4616]' : 'text-white'
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 min991:max-h-full min991:opacity-100 ${
          isOpen ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'
        } min991:max-h-full min991:opacity-100 flex flex-col gap-2`}
      >
        {children}
      </div>
    </div>
  );
}
