import { api } from './client';

export const paymentsApi = {
  // { onlineEnabled, onlineProvider, sandbox, demoCardEnabled }: which ways of paying are switched on
  options: () => api.get('/payments/options'),
  // Starts an online payment. Returns { url, fields }: the browser posts those fields to the gateway's page.
  startOnline: (reservationId) => api.post('/payments/online/checkout', { reservationId }),
  // payment: { reservationId, method: 'CARD' | 'CASH', cardNumber?, receivedBy? }
  pay: (payment) => api.post('/payments', payment),
  forReservation: (reservationId) => api.get(`/reservations/${reservationId}/payments`),
};
