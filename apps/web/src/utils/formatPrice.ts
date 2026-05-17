export const formatPrice = (price: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price);
};
