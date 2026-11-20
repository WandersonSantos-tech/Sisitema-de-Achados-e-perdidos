import * as SecureStore from "expo-secure-store";
import { fetch as expoFetch } from "expo/fetch";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "https://api-ondeta-5170584.wonderfulstone-40977343.canadacentral.azurecontainerapps.io/api/v1"
).replace(/\/+$/, "");

export const storage = {
  getToken: () => SecureStore.getItemAsync("access_token"),
  setToken: (token) =>
    SecureStore.setItemAsync("access_token", token),
  clear: () => SecureStore.deleteItemAsync("access_token"),
};

let onExpired = () => {};

export function setSessionExpiredHandler(handler) {
  onExpired = handler;
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const {
    public: isPublic = false,
    timeoutMs,
    ...request
  } = options;

  const token = isPublic ? null : await storage.getToken();
  const multipart = request.body instanceof FormData;

  const headers = new Headers(request.headers || {});

  headers.set("Accept", "application/json");

  if (multipart) {
    // O transporte gera o Content-Type com o boundary correto.
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  let expirou = false;

  const timer = setTimeout(() => {
    expirou = true;
    controller.abort();
  }, timeoutMs ?? (multipart ? 120000 : 25000));

  const metodo = request.method || "GET";
  const caminho = endpoint.split("?")[0];

  try {
    // Usa o transporte do Expo para arquivos locais.
    const enviar = multipart ? expoFetch : fetch;

    const response = await enviar(`${API_URL}${endpoint}`, {
      ...request,
      headers,
      signal: controller.signal,
    });

    const raw = await response.text();

    let data = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      // Respostas sem JSON são tratadas pelo status HTTP.
    }

    if (!response.ok) {
      if (response.status === 401 && !isPublic) {
        await storage.clear();
        onExpired();
      }

      let detalhe = data?.detail || data?.message;

      if (Array.isArray(detalhe)) {
        detalhe = detalhe
          .map(
            (erro) =>
              `${erro.loc?.slice(1).join(".") || "Campo"}: ${erro.msg}`
          )
          .join("\n");
      }

      if (typeof detalhe !== "string") {
        detalhe =
          response.status === 401
            ? "Sessão expirada. Entre novamente."
            : `O servidor retornou HTTP ${response.status} em ${metodo} ${caminho}.`;
      }

      console.warn(
        `[OndeTá API] ${metodo} ${caminho}: HTTP ${response.status}`
      );

      throw new ApiError(detalhe, response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const causa =
      typeof error?.message === "string"
        ? error.message
        : "Falha de transporte.";

    // Não registra token, cabeçalhos ou conteúdo dos arquivos.
    console.warn(
      `[OndeTá API] ${metodo} ${caminho}: ${
        expirou ? "tempo esgotado" : causa
      }`
    );

    if (expirou) {
      throw new ApiError(
        multipart
          ? "O envio das imagens ultrapassou 2 minutos. Confira o registro antes de tentar novamente."
          : "O servidor demorou para responder. Tente novamente."
      );
    }

    throw new ApiError(
      multipart
        ? `Não foi possível concluir o envio das imagens. Detalhe: ${causa}`
        : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
    );
  } finally {
    clearTimeout(timer);
  }
}

export function imageURL(path) {
  if (!path) return null;

  if (/^(https?:|file:|content:|data:)/i.test(path)) {
    return path;
  }

  const base = API_URL.replace(/\/api\/v1$/, "");

  return `${base}/${path.replace(/^\/+/, "")}`;
}