import { apiRequest } from "./api";
import { File } from "expo-file-system";

const json = (method, data) => ({
  method,
  body: JSON.stringify(data),
});

export const itemService = {
  list: (page = 1) =>
    apiRequest(
      `/items?page=${page}&page_size=100&item_type=PERDIDO`
    ),

  get: (id) => apiRequest(`/items/${id}`),

  matches: (id) => apiRequest(`/items/${id}/matches`),

  create: (data) =>
    apiRequest(
      "/items/lost",
      json("POST", { ...data, type: "PERDIDO" })
    ),

  update: (id, data) =>
    apiRequest(`/items/${id}`, json("PATCH", data)),

  remove: (id) =>
    apiRequest(`/items/${id}`, { method: "DELETE" }),

  async upload(id, assets) {
    if (!id) {
      throw new Error(
        "O objeto precisa estar cadastrado antes do envio das imagens."
      );
    }

    if (!Array.isArray(assets) || assets.length === 0) {
      return [];
    }

    if (assets.length > 3) {
      throw new Error(
        "Você pode adicionar no máximo 3 imagens."
      );
    }

    const body = new FormData();

    for (let index = 0; index < assets.length; index++) {
      const asset = assets[index];

      if (!asset?.uri) {
        throw new Error(
          `A imagem ${index + 1} não possui um arquivo válido.`
        );
      }

      const arquivo = new File(asset.uri);

      if (!arquivo.exists) {
        throw new Error(
          `A imagem ${
            index + 1
          } não está mais disponível no celular. Selecione a foto novamente.`
        );
      }

      if (arquivo.size > 5 * 1024 * 1024) {
        throw new Error(
          "Cada imagem pode ter no máximo 5 MB."
        );
      }

      const nome =
        asset.fileName ||
        arquivo.name ||
        `foto-${index + 1}.jpg`;

      body.append("files", arquivo, nome);
    }

    return apiRequest(`/items/${id}/images`, {
      method: "POST",
      body,
      timeoutMs: 120000,
    });
  },
};

export const categories = () =>
  apiRequest("/categories");

export const claimService = {
  list: (page = 1) =>
    apiRequest(
      `/claims/my-claims?page=${page}&page_size=20`
    ),

  create: (id, proof_description) =>
    apiRequest(
      `/claims/items/${id}/claims`,
      json("POST", { proof_description })
    ),

  contact: (id) =>
    apiRequest(`/messages/claims/${id}/contact`),
};

export const messageService = {
  conversation: (item, user) =>
    apiRequest(
      `/messages/items/${item}/messages?interlocutor_id=${encodeURIComponent(
        user
      )}`
    ),

  send: (item, user, content) =>
    apiRequest(
      `/messages/items/${item}/messages`,
      json("POST", {
        receiver_id: user,
        content,
      })
    ),
};

export const notificationService = {
  list: (page = 1) =>
    apiRequest(
      `/notifications?page=${page}&page_size=50`
    ),

  read: (id) =>
    apiRequest(`/notifications/${id}/read`, {
      method: "PATCH",
    }),
};

export const reviewService = {
  create: (item, data) =>
    apiRequest(
      `/items/${item}/reviews`,
      json("POST", data)
    ),

  list: (item) =>
    apiRequest(`/items/${item}/reviews`),

  user: (id) =>
    apiRequest(`/users/${id}/reviews`),
};

export async function allLostItems() {
  const items = [];
  let page = 1;
  let response;

  do {
    response = await itemService.list(page++);
    items.push(...(response.items || []));
  } while (
    items.length < response.total &&
    response.items?.length
  );

  return items;
}