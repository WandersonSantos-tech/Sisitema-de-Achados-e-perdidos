import { apiRequest } from "./api";
const query = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );
export const moderationService = {
  users: (params) => apiRequest(`/admin/users?${query(params)}`),
  user: (id) => apiRequest(`/admin/users/${id}`),
  publications: (params) => apiRequest(`/admin/items?${query({ ...params, origin: "user" })}`),
  publication: (id) => apiRequest(`/admin/items/${id}`),
  remove: (id, reason) =>
    apiRequest(`/admin/items/${id}/remove`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
