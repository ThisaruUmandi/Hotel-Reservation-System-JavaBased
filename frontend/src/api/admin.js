import { api } from './client';

export const adminApi = {
  summary: () => api.get('/admin/summary'),
  // changes: { pricePerNight?, status? }. Prices are admin-only; staff can open or close a room.
  updateRoom: (id, changes) => api.patch(`/admin/rooms/${id}`, changes),
  users: () => api.get('/admin/users'),
  createUser: (user) => api.post('/admin/users', user), // { username, password, role: 'STAFF' | 'ADMIN' }
  setRole: (id, role) => api.patch(`/admin/users/${id}`, { role }),
};
