import { apiRequest } from './api';

export const reviewService = {
  create: (itemId, data) => apiRequest(`/items/${itemId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
  listByItem: (itemId) => apiRequest(`/items/${itemId}/reviews`),
  listByUser: (userId) => apiRequest(`/users/${userId}/reviews`),
};
