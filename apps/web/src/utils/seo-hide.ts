const SEO_HIDE_PATH = '/go';

const isExternalHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const toSeoSafeHref = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '#') {
    return null;
  }

  if (isExternalHttpUrl(trimmed)) {
    return `${SEO_HIDE_PATH}?to=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
};
