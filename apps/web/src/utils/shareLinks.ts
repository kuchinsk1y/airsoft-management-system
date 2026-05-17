import EmailIcon from '@/components/icons/EmailIcon';
import FacebookShareIcon from '@/components/icons/FacebookShareIcon';
import InstagramIcon from '@/components/icons/InstagramIcon';
import TelegramIcon from '@/components/icons/TelegramIcon';
import ViberIcon from '@/components/icons/ViberIcon';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { ShareLink } from '@/interfaces';
import { toSeoSafeHref } from './seo-hide';

const shareLinksData = (currentUrl: string): Record<string, ShareLink> => ({
  facebook: {
    href:
      toSeoSafeHref(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      ) ?? '#',
    ariaLabel: 'Facebook',
    Icon: FacebookShareIcon,
    rel: 'nofollow noopener noreferrer',
  },
  whatsApp: {
    href: toSeoSafeHref(`https://wa.me/?text=${encodeURIComponent(currentUrl)}`) ?? '#',
    ariaLabel: 'WhatsApp',
    Icon: WhatsAppIcon,
    rel: 'nofollow noopener noreferrer',
  },
  instagram: {
    href: toSeoSafeHref('https://www.instagram.com/') ?? '#',
    ariaLabel: 'Instagram',
    Icon: InstagramIcon,
    rel: 'noopener noreferrer',
  },
  telegram: {
    href:
      toSeoSafeHref(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}`) ?? '#',
    ariaLabel: 'Telegram',
    Icon: TelegramIcon,
    rel: 'nofollow noopener noreferrer',
  },
  viber: {
    href: `viber://forward?text=${encodeURIComponent(currentUrl)}`,
    ariaLabel: 'Viber',
    Icon: ViberIcon,
  },
  email: {
    href: `mailto:?subject=${encodeURIComponent('')}&body=${encodeURIComponent(currentUrl)}`,
    ariaLabel: 'Email',
    Icon: EmailIcon,
    rel: 'nofollow noopener noreferrer',
  },
});

export const getEventShareLinks = (currentUrl: string): ShareLink[] => {
  const link = shareLinksData(currentUrl);
  return [
    link.facebook,
    link.whatsApp,
    link.instagram,
    link.telegram,
    link.viber,
    link.email,
  ];
};

export const getProductShareLinks = (currentUrl: string): ShareLink[] => {
  const link = shareLinksData(currentUrl);
  return [link.facebook, link.whatsApp, link.telegram, link.viber];
};
