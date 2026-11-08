import { site } from '../config/site';

export const bookingRef = (id) => `${site.refPrefix}${String(id).padStart(5, '0')}`;

export const digitsOnly = (value) => value.replace(/\D/g, '');

export function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(value) {
  const d = digitsOnly(value).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Luhn checksum: catches mistyped card numbers before they are sent anywhere. */
export function luhn(number) {
  const d = digitsOnly(number);
  if (d.length < 12 || d.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (double) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(number) {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  return 'Card';
}

/** A card is good through the last day of its expiry month. */
export function expiryValid(value, now = new Date()) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > now;
}

export function validateCard({ number, name, expiry, cvc }, now = new Date()) {
  const errors = {};
  if (!luhn(number)) errors.number = 'Check the card number';
  if (!name.trim()) errors.name = 'Enter the name on the card';
  if (!expiryValid(expiry, now)) errors.expiry = 'Use MM/YY, in the future';
  const cvcLength = cardBrand(number) === 'Amex' ? 4 : 3;
  if (digitsOnly(cvc).length !== cvcLength) errors.cvc = `${cvcLength} digits`;
  return errors;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+\- ]{7,20}$/;

/** Same rules as the server, so people see problems before submitting. */
export function validateDetails({ name, email, phone }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Enter your name';
  else if (name.length > 100) errors.name = 'That name is too long';
  if (!email.trim()) errors.email = 'Enter your email';
  else if (!EMAIL.test(email.trim())) errors.email = 'Enter a valid email';
  if (phone.trim() && !PHONE.test(phone.trim())) errors.phone = 'Enter a valid phone number';
  return errors;
}

export function validateAccount({ username, password, confirm }) {
  const errors = {};
  if (username.trim().length < 3 || username.trim().length > 30) errors.username = 'Use 3 to 30 characters';
  if (password.length < 8) errors.password = 'Use at least 8 characters';
  else if (password.length > 72) errors.password = 'Use 72 characters or fewer';
  if (confirm !== password) errors.confirm = 'The passwords do not match';
  return errors;
}
