export interface SocialNetworkConfig {
  key: string
  label: string
  placeholder?: string
}

export const SOCIAL_NETWORKS_CONFIG: SocialNetworkConfig[] = [
  { key: 'phone', label: 'Телефон', placeholder: '+380...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'whatsApp', label: 'WhatsApp', placeholder: 'https://wa.me/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...' },
  { key: 'email', label: 'Email', placeholder: 'mail@example.com' },
]
