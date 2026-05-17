import { slugify } from 'transliteration';

export const generateSlug = (name: string): string => {
  let slug = slugify(name, { lowercase: true, separator: '-' });
  slug = slug.replace(/yi/g, 'i').replace(/ye/g, 'e');
  if (slug === 'kiiv' || slug === 'kiyiv') {
    slug = 'kyiv';
  }
  return slug;
};
