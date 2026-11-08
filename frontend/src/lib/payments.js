import { formatPrice } from './rooms';

/** One line saying where a booking's money stands, from the payments recorded for it. */
export function describePayment(payments, cancelled = false) {
  const paid = payments.find((p) => p.status === 'PAID');
  const refundPending = payments.find((p) => p.status === 'REFUND_PENDING');
  const refunded = payments.find((p) => p.status === 'REFUNDED');
  if (paid) return `Paid: ${paid.description}.`;
  if (refundPending) return `Refund on its way: the hotel will return ${formatPrice(refundPending.amount)} (${refundPending.description}).`;
  if (refunded) return `Refunded: ${refunded.description}.`;
  if (cancelled) return 'No payment was taken.';
  return 'Pay at the front desk when you arrive.';
}
