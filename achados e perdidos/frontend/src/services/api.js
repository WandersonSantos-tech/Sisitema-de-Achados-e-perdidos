const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
  const isFormData = options.body instanceof FormData;
  const headers = { ...options.headers };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Não foi possível acessar a API. Confira se o backend está rodando em http://localhost:8000 e se VITE_API_URL está correto."
    );
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail || data?.message;

    if (Array.isArray(detail)) {
      throw new Error(
        detail.map((erro) => erro.msg).join("; ")
      );
    }

    if (typeof detail === "string") {
      throw new Error(detail);
    }

    if (response.status === 401) {
      throw new Error(
        "Sua sessão expirou ou sua conta está bloqueada. Entre novamente."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Sua conta não tem permissão para executar esta operação."
      );
    }

    if (response.status >= 500) {
      throw new Error(
        "O backend apresentou um erro. Confira os logs do serviço api."
      );
    }

    throw new Error(
      `Não foi possível concluir a operação. HTTP ${response.status}.`
    );
  }

  return data;
}