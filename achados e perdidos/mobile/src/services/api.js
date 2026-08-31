import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  "http://192.168.15.11:8000/api/v1";

export async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    await AsyncStorage.getItem(
      "access_token"
    );

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
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
    let message =
      data?.detail ||
      data?.message ||
      "Erro na requisição.";

    if (Array.isArray(message)) {
      message = message
        .map((item) => item.msg)
        .join("\n");
    }

    throw new Error(message);
  }

  return data;
}

export { API_URL };