/**
 * Philippine Peso currency formatting utilities
 */

export function formatPHP(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₱0.00';
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function formatPHPCompact(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₱0';
  
  if (numAmount >= 1000000) {
    return `₱${(numAmount / 1000000).toFixed(1)}M`;
  } else if (numAmount >= 1000) {
    return `₱${(numAmount / 1000).toFixed(1)}K`;
  }
  
  return formatPHP(numAmount);
}

export function parsePHP(value: string): number {
  // Remove PHP currency symbol, commas, and spaces
  const cleaned = value.replace(/[₱,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatPHPInput(value: string): string {
  // Remove non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2
  if (parts[1] && parts[1].length > 2) {
    return parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return cleaned;
}

export function validatePHPAmount(value: string): boolean {
  const amount = parsePHP(value);
  return amount > 0 && amount <= 999999999.99; // Reasonable upper limit
}
