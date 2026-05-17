import type { Metadata } from 'next';
import { toAbsoluteUrl } from './template-metadata';
import { localizePath } from './locale-seo';

type BuildNoIndexMetadataParams = {
  title: string;
  canonicalPath: string;
  description?: string;
  follow?: boolean;
};

export function buildNoIndexMetadata({
  title,
  canonicalPath,
  description,
  follow = false,
}: BuildNoIndexMetadataParams): Metadata {
  const localizedCanonicalPath = localizePath(canonicalPath, 'uk');
  const ukPath = localizePath(canonicalPath, 'uk');
  const ruPath = localizePath(canonicalPath, 'ru');

  return {
    title,
    description,
    alternates: {
      languages: {
        uk: toAbsoluteUrl(ukPath),
        ru: toAbsoluteUrl(ruPath),
        'x-default': toAbsoluteUrl(ukPath),
      },
      canonical: toAbsoluteUrl(localizedCanonicalPath),
    },
    robots: {
      index: false,
      follow,
    },
  };
}
