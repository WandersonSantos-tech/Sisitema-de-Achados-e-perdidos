import { apiRequest } from "./api";

export const categoryService = {
  async listar() {
    return apiRequest("/categories", {
      method: "GET",
    });
  },
};