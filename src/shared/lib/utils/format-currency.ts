/**
 * Format Vietnamese Dong (VND) prices for display
 *
 * @param price - The price in VND
 * @returns Formatted string with triệu/tỷ suffix
 *
 * Examples:
 * - 2000000000 → "2 tỷ"
 * - 20000000 → "20 triệu"
 * - 2500000000 → "2.5 tỷ"
 * - 15500000 → "15.5 triệu"
 */
export const formatVND = (price: number): string => {
  if (price >= 1000000000) {
    // Format as tỷ (billion)
    const billionValue = price / 1000000000;
    return billionValue % 1 === 0 ? `${billionValue} tỷ` : `${billionValue.toFixed(1)} tỷ`;
  } else if (price >= 1000000) {
    // Format as triệu (million)
    const millionValue = price / 1000000;
    return millionValue % 1 === 0 ? `${millionValue} triệu` : `${millionValue.toFixed(1)} triệu`;
  } else {
    // Less than 1 million, show full number with Vietnamese formatting
    return price.toLocaleString('vi-VN');
  }
};
