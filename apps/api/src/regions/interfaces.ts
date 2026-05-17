export interface FaqItem {
  question: string;
  answer: string;
}

export interface RegionsResponse {
  id: number;
  name: string;
  slug: string;
  seoText: string | null;
  seoFaq: FaqItem[] | null;
  createdAt: Date;
}

export type RegionsFilters = {
  id?: number;
  slug?: string;
  name?: string;
  hasEvents?: boolean;
};

export interface UpdateRegionSeoDto {
  seoText?: string | null;
  seoFaq?: FaqItem[] | null;
}
