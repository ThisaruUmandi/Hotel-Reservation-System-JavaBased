import { api } from './client';

export const reservationsApi = {
  mine: () => api.get('/reservations/mine'),
  get: (id) => api.get(`/reservations/${id}`),
  // booking: { roomId, name, email, phone, guests, checkIn, checkOut }
  create: (booking) => api.post('/reservations', booking),
  cancel: (id) => api.delete(`/reservations/${id}`),
  all: () => api.get('/reservations'), // staff and admin only
};
