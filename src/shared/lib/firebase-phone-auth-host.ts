/**
 * True when the browsed host is an IPv4 literal (e.g. LAN dev server at 192.168.x.x).
 * Firebase Phone Auth + reCAPTCHA often fails until this host is listed under
 * Authentication → Authorized domains — and some consoles disallow IPs, forcing 127.0.0.1 / HTTPS tunnel.
 */
export function isIpv4LiteralHostname(host: string): boolean {
  return /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(host);
}

/** Use localized hint when Firebase returns captcha / hostname rejection for Phone Auth */
export function isFirebasePhoneAuthHostnameCaptchaIssue(errorMessage: string | undefined, hostname: string): boolean {
  const m = errorMessage ?? '';
  if (/hostname/i.test(m)) return true;
  return isIpv4LiteralHostname(hostname);
}
