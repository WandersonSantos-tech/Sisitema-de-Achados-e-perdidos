const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("access_token");
const isFormData = options.body instanceof FormData;

const headers = {
  ...options.headers,
};

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
      "Não foi possível conectar ao servidor."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const mensagem =
      data?.detail ||
      data?.message ||
      "Não foi possível concluir a operação.";

    throw new Error(mensagem);
  }

  return data;
}