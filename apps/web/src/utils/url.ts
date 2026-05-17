export const removeTokenFromUrl = (tokenNames: readonly string[]): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  let hasChanges = false;

  tokenNames.forEach(tokenName => {
    if (url.searchParams.has(tokenName)) {
      url.searchParams.delete(tokenName);
      hasChanges = true;
    }
  });

  if (!hasChanges) {
    return window.location.href;
  }

  return url.pathname + (url.search ? url.search : '');
};

export const getCleanUrl = (tokenNames: readonly string[]): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  tokenNames.forEach(tokenName => {
    url.searchParams.delete(tokenName);
  });

  return url.pathname + (url.search ? url.search : '');
};

export const getLinkWithRegion = (href: string, regionSlug: string | null | undefined): string => {
  if (!regionSlug || href === '#' || href.startsWith('#')) return href;
  if (href.startsWith('/')) {
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}region=${regionSlug}`;
  }
  return href;
};
