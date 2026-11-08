import { describe, expect, it } from 'vitest';
import {
  bookingRef, cardBrand, expiryValid, formatCardNumber, formatExpiry, luhn, validateAccount, validateCard, validateDetails,
} from './booking';

describe('card helpers', () => {
  it('accepts real test numbers and rejects typos', () => {
    expect(luhn('4242 4242 4242 4242')).toBe(true);
    expect(luhn('5555555555554444')).toBe(true);
    expect(luhn('4242 4242 4242 4243')).toBe(false);
    expect(luhn('1234')).toBe(false);
    expect(luhn('')).toBe(false);
  });

  it('formats as you type', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('42a4-2')).toBe('4242');
    expect(formatCardNumber('42424')).toBe('4242 4');
    expect(formatExpiry('0830')).toBe('08/30');
    expect(formatExpiry('083')).toBe('08/3');
    expect(formatExpiry('08')).toBe('08');
  });

  it('names the brand', () => {
    expect(cardBrand('4111')).toBe('Visa');
    expect(cardBrand('5105')).toBe('Mastercard');
    expect(cardBrand('2221')).toBe('Mastercard');
    expect(cardBrand('3782')).toBe('Amex');
    expect(cardBrand('6011')).toBe('Card');
  });

  it('treats a card as valid through the end of its expiry month', () => {
    const now = new Date(2030, 5, 15); // 15 June 2030
    expect(expiryValid('06/30', now)).toBe(true);
    expect(expiryValid('05/30', now)).toBe(false);
    expect(expiryValid('13/30', now)).toBe(false);
    expect(expiryValid('00/30', now)).toBe(false);
    expect(expiryValid('6/30', now)).toBe(false);
    expect(expiryValid('12/29', now)).toBe(false);
  });

  it('validates a whole card', () => {
    const now = new Date(2030, 0, 1);
    const good = { number: '4242 4242 4242 4242', name: 'A Person', expiry: '12/30', cvc: '123' };
    expect(validateCard(good, now)).toEqual({});
    expect(Object.keys(validateCard({ number: '1', name: '', expiry: '01/20', cvc: '1' }, now)).sort()).toEqual(['cvc', 'expiry', 'name', 'number']);
    expect(validateCard({ ...good, number: '3782 822463 10005', cvc: '123' }, now).cvc).toBeDefined(); // Amex needs 4
    expect(validateCard({ ...good, number: '378282246310005', cvc: '1234' }, now)).toEqual({});
  });
});

describe('form validation', () => {
  it('checks contact details like the server does', () => {
    expect(validateDetails({ name: 'Ann', email: 'ann@example.com', phone: '' })).toEqual({});
    expect(validateDetails({ name: 'Ann', email: 'ann@example.com', phone: '077 123 4567' })).toEqual({});
    expect(Object.keys(validateDetails({ name: ' ', email: 'nope', phone: 'abc' })).sort()).toEqual(['email', 'name', 'phone']);
  });

  it('checks new accounts', () => {
    expect(validateAccount({ username: 'alice', password: 'password123', confirm: 'password123' })).toEqual({});
    expect(Object.keys(validateAccount({ username: 'ab', password: 'short', confirm: 'other' })).sort()).toEqual(['confirm', 'password', 'username']);
    expect(validateAccount({ username: 'alice', password: 'password123', confirm: 'different' }).confirm).toBeDefined();
  });

  it('builds booking references', () => {
    expect(bookingRef(12)).toBe('PH00012');
    expect(bookingRef(123456)).toBe('PH123456');
  });
});
