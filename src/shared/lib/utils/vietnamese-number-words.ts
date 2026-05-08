/**
 * Max decimal digits for price inputs that feed {@link toVietnameseWords}.
 * Above this, the tỷ chunk exceeds 999 and the reader would emit invalid fragments ("undefined").
 */
export const MAX_VIETNAMESE_PRICE_DIGITS = 12;

/** Largest integer the current grouping logic reads correctly (< 1_000 tỷ). */
export const MAX_AMOUNT_FOR_VIETNAMESE_WORDS = 999_999_999_999;

/**
 * Spell a positive integer amount in Vietnamese (đọc số thành lời), ending with "đồng".
 * Same rules as the price fields on the create-property flow.
 */
export function toVietnameseWords(n: number): string {
  if (!n || n <= 0 || !Number.isFinite(n)) return '';
  const int = Math.trunc(n);
  if (int !== n || int > MAX_AMOUNT_FOR_VIETNAMESE_WORDS || !Number.isSafeInteger(int)) {
    return '';
  }
  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(num: number, isFirst: boolean): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    let s = '';
    if (h > 0) {
      s = ones[h] + ' trăm';
    } else if (!isFirst) {
      s = 'không trăm';
    }
    if (t === 0) {
      if (u > 0) s += (s ? ' linh ' : '') + ones[u];
    } else if (t === 1) {
      s += ' mười' + (u === 5 ? ' lăm' : u > 0 ? ' ' + ones[u] : '');
    } else {
      s +=
        ' ' +
        ones[t] +
        ' mươi' +
        (u === 1 ? ' mốt' : u === 5 ? ' lăm' : u > 0 ? ' ' + ones[u] : '');
    }
    return s.trim();
  }

  const ty = Math.floor(int / 1_000_000_000);
  const trieu = Math.floor((int % 1_000_000_000) / 1_000_000);
  const nghin = Math.floor((int % 1_000_000) / 1_000);
  const con = int % 1_000;
  const parts: string[] = [];
  let isFirst = true;

  if (ty > 0) {
    parts.push(readGroup(ty, isFirst) + ' tỷ');
    isFirst = false;
  }
  if (trieu > 0) {
    parts.push(readGroup(trieu, isFirst) + ' triệu');
    isFirst = false;
  }
  if (nghin > 0) {
    parts.push(readGroup(nghin, isFirst) + ' nghìn');
    isFirst = false;
  }
  if (con > 0) {
    parts.push(readGroup(con, isFirst));
  }

  const result = parts.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
}
