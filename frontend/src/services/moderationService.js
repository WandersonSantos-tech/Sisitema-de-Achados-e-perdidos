import { apiRequest } from "./api";
const query = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
export const moderationService = {
  users: (params) => apiRequest(`/admin/users?${query(params)}`),
  user: (id) => apiRequest(`/admin/users/${id}`),
  publications: (params) => apiRequest(`/admin/items?${query(params)}`),
  publication: (id) => apiRequest(`/admin/items/${id}`),
  remove: (id, reason) =>
    apiRequest(`/admin/items/${id}/remove`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  reports: (params) => apiRequest(`/admin/reports?${query(params)}`),
  report: (id) => apiRequest(`/admin/reports/${id}`),
  decide: (id, action, notes) =>
    apiRequest(`/admin/reports/${id}/decision`, {
      method: "PATCH",
      body: JSON.stringify({ action, notes }),
    }),
  submit: (body) =>
    apiRequest("/reports", { method: "POST", body: JSON.stringify(body) }),
  mine: (params) => apiRequest(`/reports?${query(params)}`),
  targets: (params) => apiRequest(`/reports/targets?${query(params)}`),
};
