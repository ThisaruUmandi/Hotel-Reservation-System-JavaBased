import { api } from './client';

export const roomsApi = {
  list: () => api.get('/rooms'),
  get: (id) => api.get(`/rooms/${id}`),
  // params: { checkIn, checkOut, guests, type } with dates as YYYY-MM-DD
  available: (params) => api.get('/rooms/available', params),
  reviews: (id) => api.get(`/rooms/${id}/reviews`),
};
