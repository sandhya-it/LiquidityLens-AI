/**
 * Formatting utilities following Indian financial conventions (Lakhs & Crores)
 * and clear precision standards.
 */

export function formatINR(val: number, options?: { showUnit?: boolean; decimals?: number; forcePositive?: boolean }): string {
  if (isNaN(val) || val === null || val === undefined) return '—';
  
  const decimals = options?.decimals ?? 1;
  const showUnit = options?.showUnit ?? true;
  const isNegative = val < 0;
  const absVal = Math.abs(val);

  // Formatting with commas: Indian numbering format (e.g. 12,34,567.89)
  let formatted = '';
  if (absVal >= 1000) {
    formatted = absVal.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else {
    formatted = absVal.toFixed(decimals);
  }

  const sign = isNegative && !options?.forcePositive ? '-' : '';
  const prefix = '₹ ';
  const unit = showUnit ? ' Cr' : '';

  return `${sign}${prefix}${formatted}${unit}`;
}

export function formatCroresWithSign(val: number, decimals: number = 1): string {
  if (isNaN(val)) return '—';
  const prefix = val > 0 ? '+₹ ' : val < 0 ? '-₹ ' : '₹ ';
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${prefix}${formatted} Cr`;
}

export function formatPercent(val: number, decimals: number = 2): string {
  if (isNaN(val) || val === null || val === undefined) return '—';
  return `${val.toFixed(decimals)}%`;
}

export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[monthNum - 1] || parts[1];
  return `${monthName} ${year}`;
}
