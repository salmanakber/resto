import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function isValidPhoneNumber(phone: string, countryCode?: string) {
  const parsed = parsePhoneNumberFromString(phone, countryCode);
  return parsed?.isValid() ?? false;
}

export function formatPhoneNumber(phone: string, countryCode?: string) {
  const parsed = parsePhoneNumberFromString(phone, countryCode);
  return parsed?.isValid() ? parsed.number : null;
}