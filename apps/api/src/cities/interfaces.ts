export interface FaqItem {
  question: string;
  answer: string;
}

export interface RegionBrief {
  id: number;
  name: string;
  slug: string;
}

export interface CitiesResponse {
  id: number;
  name: string;
  slug: string;
  regionId: number;
  region: RegionBrief;
  seoText: string | null;
  seoFaq: FaqItem[] | null;
  createdAt: Date;
}

export type CitiesFilters = {
  id?: number;
  slug?: string;
  name?: string;
  regionId?: number;
  regionSlug?: string;
};

export interface UpdateCitySeoDto {
  seoText?: string | null;
  seoFaq?: FaqItem[] | null;
}
