import { describe, expect, it } from 'vitest';
import { describePayment } from './payments';

const pay = (status, description = 'Visa ending 4242', amount = 55500) => ({ status, description, amount });

describe('describePayment', () => {
  it('says what has happened to the money', () => {
    expect(describePayment([pay('PAID')])).toBe('Paid: Visa ending 4242.');
    expect(describePayment([pay('REFUNDED')], true)).toBe('Refunded: Visa ending 4242.');
    expect(describePayment([pay('REFUND_PENDING', 'Online payment (VISA)')], true))
      .toBe('Refund on its way: the hotel will return LKR 55,500 (Online payment (VISA)).');
  });

  it('falls back sensibly when nothing was paid', () => {
    expect(describePayment([])).toBe('Pay at the front desk when you arrive.');
    expect(describePayment([], true)).toBe('No payment was taken.');
    expect(describePayment([pay('PENDING'), pay('FAILED')])).toBe('Pay at the front desk when you arrive.');
  });

  it('prefers a completed payment over earlier failed attempts', () => {
    expect(describePayment([pay('FAILED'), pay('PAID', 'Online payment (VISA)')])).toBe('Paid: Online payment (VISA).');
  });
});
