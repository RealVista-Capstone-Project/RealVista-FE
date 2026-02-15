import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount * 24000); // Assuming input is USD
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
