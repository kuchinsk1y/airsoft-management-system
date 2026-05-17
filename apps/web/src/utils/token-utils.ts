export const getTokenFromUrl = (searchParams: {
  [key: string]: string | string[] | undefined;
}): string | null => {
  return typeof searchParams.token === 'string' ? searchParams.token : null;
};
