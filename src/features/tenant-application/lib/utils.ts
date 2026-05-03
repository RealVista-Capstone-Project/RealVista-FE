import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return 'N/A';
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  return `${formatted} vnđ`;
};

export const formatDate = (dateString: any, formatStr: string = 'dd MMM, HH:mm') => {
  try {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    return format(date, formatStr, { locale: vi });
  } catch {
    return 'Lỗi';
  }
};

export const getMediaType = (mimeType: string): 'IMAGE' | 'VIDEO' | 'THREE_D' => {
  if (!mimeType) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('model/') || mimeType.includes('3d')) return 'THREE_D';
  return 'IMAGE';
};
