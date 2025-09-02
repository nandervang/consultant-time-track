/**
 * Swedish currency formatting utility
 */

export const formatSEK = (amount: number): string => {
  // Handle NaN, null, undefined values
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 kr';
  }
  
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' kr';
};

export const formatSEKWithDecimals = (amount: number): string => {
  // Handle NaN, null, undefined values
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 kr';
  }
  
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' kr';
};

export const DEFAULT_CURRENCY = 'SEK';
export const CURRENCY_SYMBOL = 'kr';
