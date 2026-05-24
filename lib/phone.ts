/** Strip formatting; return 10-digit mobile (India-style), matching API normalization. */
export function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(-10);
  }
  return digits;
}

export function isValidPhoneInput(phone: string): boolean {
  return normalizePhoneDigits(phone).length === 10;
}

export function formatPhoneHint(phone: string): string {
  const d = normalizePhoneDigits(phone);
  if (d.length !== 10) return phone;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
