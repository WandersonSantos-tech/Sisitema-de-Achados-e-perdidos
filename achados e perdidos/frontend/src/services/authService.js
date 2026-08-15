import { apiRequest } from "./api";

const LOGIN_ENDPOINT = "/auth/login";

export const authService = {
  async login(email, senha) {

    const data = await apiRequest(LOGIN_ENDPOINT, {
      method: "POST",

      body: JSON.stringify({
        email,
        senha,
      }),
    });

    const token =
      data.access_token ||
      data.accessToken ||
      data.token;

    const usuario =
      data.usuario ||
      data.user;

    if (!token) {
      throw new Error(
        "O servidor não retornou o token de autenticação."
      );
    }

    if (!usuario) {
      throw new Error(
        "O servidor não retornou os dados do usuário."
      );
    }

    localStorage.setItem(
      "access_token",
      token
    );

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );

    return {
      token,
      usuario,
    };
  },

  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");
  },

  getToken() {
    return localStorage.getItem("access_token");
  },

  getUsuario() {
    const usuario =
      localStorage.getItem("usuario");

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario);
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(
      localStorage.getItem("access_token")
    );
  },
};