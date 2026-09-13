import { apiRequest } from "./api";

export const notificationService = {
  async listar({
    page = 1,
    pageSize = 50,
  } = {}) {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("page_size", pageSize);

    return apiRequest(
      `/notifications?${params.toString()}`,
      {
        method: "GET",
      }
    );
  },

  async buscar(id) {
    return apiRequest(
      `/notifications/${id}`,
      {
        method: "GET",
      }
    );
  },

  async marcarComoLida(id) {
    return apiRequest(
      `/notifications/${id}/read`,
      {
        method: "PATCH",
      }
    );
  },
};