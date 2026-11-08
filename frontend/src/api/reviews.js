import { api } from './client';

export const reviewsApi = {
  // review: { reservationId, rating, comment }
  add: (review) => api.post('/reviews', review),
};
