import { apiRequest } from "./api";

export const itemService = {
  async criarItemPerdido(dados) {
    return apiRequest("/items/lost", {
      method: "POST",
      body: JSON.stringify({
        ...dados,
        type: "PERDIDO",
      }),
    });
  },
  

  async criarItemEncontrado(dados) {
    return apiRequest("/items/found", {
      method: "POST",
      body: JSON.stringify({
        ...dados,
        type: "ENCONTRADO",
      }),
    });
  },
  async enviarImagens(itemId, arquivos) {
  const formData = new FormData();

  arquivos.forEach((arquivo) => {
    formData.append("files", arquivo);
  });

  return apiRequest(`/items/${itemId}/images`, {
    method: "POST",
    body: formData,
  });
},

  async listarItens({
    page = 1,
    pageSize = 20,
    itemType = null,
    categoryId = null,
  } = {}) {
    const params = new URLSearchParams();

    params.append("page", page);
    params.append("page_size", pageSize);

    if (itemType) {
      params.append("item_type", itemType);
    }

    if (categoryId) {
      params.append("category_id", categoryId);
    }

    return apiRequest(`/items?${params.toString()}`, {
      method: "GET",
    });
  },

  async listarItensPerdidos(page = 1, pageSize = 20) {
    return this.listarItens({
      page,
      pageSize,
      itemType: "PERDIDO",
    });
  },

  async buscarItem(id) {
    return apiRequest(`/items/${id}`, {
      method: "GET",
    });
  },

  async atualizarItem(id, dados) {
    return apiRequest(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    });
  },

  async excluirItem(id) {
    return apiRequest(`/items/${id}`, {
      method: "DELETE",
    });
  },

  async buscarCorrespondencias(id) {
    return apiRequest(`/items/${id}/matches`, {
      method: "GET",
    });
  },
};