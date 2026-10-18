import { apiRequest } from './api';

export const claimService = {
  schedule: (id, pickup_at) => apiRequest(`/claims/claims/${id}/pickup`, { method: 'PATCH', body: JSON.stringify({ pickup_at }) }),
  completeReturn: (id, signature) => apiRequest(`/claims/claims/${id}/return`, { method: 'POST', body: JSON.stringify({ signature }) }),
  create: (itemId, data) => apiRequest(`/claims/items/${itemId}/claims`, { method: 'POST', body: JSON.stringify(data) }),
  listByItem: (itemId) => apiRequest(`/claims/items/${itemId}/claims`),
  myClaims: (page = 1) => apiRequest(`/claims/my-claims?page=${page}`),
  updateStatus: (claimId, data) => apiRequest(`/claims/claims/${claimId}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  startNegotiation: (id) =>apiRequest(`/claims/claims/${id}/start-negotiation`, {method: "POST",}),

};
