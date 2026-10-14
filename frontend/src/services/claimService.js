import { apiRequest } from './api';

export const claimService = {
  create: (itemId, data) => apiRequest(`/claims/items/${itemId}/claims`, { method: 'POST', body: JSON.stringify(data) }),
  listByItem: (itemId) => apiRequest(`/claims/items/${itemId}/claims`),
  myClaims: () => apiRequest('/claims/my-claims'),
  updateStatus: (claimId, data) => apiRequest(`/claims/claims/${claimId}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
};
