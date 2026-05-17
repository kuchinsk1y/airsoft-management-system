import type { MetadataRoute } from 'next';
import { getSitemapEntries } from './utils/sitemap-entries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapEntries();
}
