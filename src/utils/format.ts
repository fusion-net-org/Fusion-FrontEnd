
/**
 * Format date string or Date object to 'dd/MM/yyyy HH:mm'
 */
export function fmtDate(value?: string | Date | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
