import { apiRequest } from './api';

export const reportService = {
  create: (data) => apiRequest('/reports', { method: 'POST', body: JSON.stringify(data) }),
  get: (reportId) => apiRequest(`/reports/${reportId}`),
};
