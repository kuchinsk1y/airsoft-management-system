export interface Partner {
  id: number;
  logo: string;
  link: string;
  alt: string;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface ContactLocation {
  id?: string;
  city: string;
  phones: string[];
  address: string;
  mapUrl: string;
}

export interface Banner {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
  isActive: boolean;
}
