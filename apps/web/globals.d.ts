declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    gtag: any;
  }
}

export {};
