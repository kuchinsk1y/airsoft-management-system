import { getCities } from '@/actions/cities';
import { getTemplate } from '@/actions/template';
import type { ContactItem, TemplateData } from '@/interfaces';
import {
  getCityHref,
  isDefaultCitySlug,
  resolveCitySlug,
} from '@/utils/city-landing';

export type ContactWithCityLink = ContactItem & {
  cityHref: string;
  citySlug: string;
  isDefaultCity: boolean;
};

type ContactsTemplatePayload = TemplateData<ContactItem[]> & {
  description?: string;
};

export async function getResolvedContactsPageData(): Promise<{
  contacts: ContactWithCityLink[];
  title: string;
  subtitle: string;
  seoText: string;
}> {
  const [templateResult, cities] = await Promise.all([
    getTemplate('contacts'),
    getCities(),
  ]);

  if (!templateResult.success) {
    return {
      contacts: [],
      title: 'Контакти',
      subtitle: '',
      seoText: '',
    };
  }

  const data = templateResult.data as ContactsTemplatePayload;
  const contacts = Array.isArray(data.content)
    ? data.content.map(contact => {
        const citySlug = resolveCitySlug(contact.city, cities);
        return {
          ...contact,
          citySlug,
          cityHref: getCityHref(contact.city, cities),
          isDefaultCity: isDefaultCitySlug(citySlug),
        };
      })
    : [];

  return {
    contacts,
    title: data.title || 'Контакти',
    subtitle: data.subtitle || data.description || '',
    seoText:
      typeof (templateResult.data as { seo?: { seoText?: string } })?.seo
        ?.seoText === 'string'
        ? ((templateResult.data as { seo?: { seoText?: string } }).seo?.seoText ?? '')
        : '',
  };
}

export async function getContactByCitySlug(
  citySlug: string,
): Promise<ContactWithCityLink | null> {
  const { contacts } = await getResolvedContactsPageData();
  return contacts.find(contact => contact.citySlug === citySlug) || null;
}