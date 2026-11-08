import { api } from './client';

export const paymentsApi = {
  // payment: { reservationId, method: 'CARD' | 'CASH', cardNumber?, receivedBy? }
  pay: (payment) => api.post('/payments', payment),
  forReservation: (reservationId) => api.get(`/reservations/${reservationId}/payments`),
};
