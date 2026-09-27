import { apiRequest } from './api';

const list = (name, params = {}) => apiRequest(`/admin/${name}?${new URLSearchParams(params)}`);
export const adminService = {
  stats: () => apiRequest('/admin/stats'),
  items: (params) => list('items', params),
  item: (id) => apiRequest(`/admin/items/${id}`),
  status: (id, status) => apiRequest(`/admin/items/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  matches: (id) => apiRequest(`/admin/items/${id}/matches`),
  sendMatch: (foundId, lostId) => apiRequest(`/admin/items/${foundId}/matches/${lostId}/send`, { method: 'POST' }),
  claims: () => list('claims'),
  claimStatus: (id, status) => apiRequest(`/claims/claims/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  users: (params) => list('users', params),
  userStatus: (id, is_active) => apiRequest(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  categories: () => apiRequest('/admin/categories'),
  createCategory: (data) => apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
  reports: () => list('reports'),
  resolveReport: (id) => apiRequest(`/admin/reports/${id}/resolve`, { method: 'PATCH' }),
};
