export function formatPhoneForHref(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}
