import DefaultSocialIcon from '@/components/icons/DefaultSocialIcon'
import EmailIcon from '@/components/icons/EmailIcon'
import FacebookShareIcon from '@/components/icons/FacebookShareIcon'
import InstagramIcon from '@/components/icons/InstagramIcon'
import PhoneIcon from '@/components/icons/PhoneIcon'
import TelegramIcon from '@/components/icons/TelegramIcon'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import type { SocialNetworkConfig } from '../../../../config/socialNetworks'
import { SOCIAL_NETWORKS_CONFIG as BASE_CONFIG } from '../../../../config/socialNetworks'

export type { SocialNetworkConfig }

const SOCIAL_NETWORK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: FacebookShareIcon,
  whatsApp: WhatsAppIcon,
  instagram: InstagramIcon,
  telegram: TelegramIcon,
  phone: PhoneIcon,
  email: EmailIcon,
}

export const SOCIAL_NETWORKS_CONFIG = BASE_CONFIG

export function getSocialNetworkIcon(key: string): React.ComponentType<{ className?: string }> {
  return SOCIAL_NETWORK_ICONS[key] ?? DefaultSocialIcon
}
