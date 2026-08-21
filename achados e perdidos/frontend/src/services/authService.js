import { apiRequest } from "./api";

const LOGIN_ENDPOINT = "/api/v1/auth/login";
const ME_ENDPOINT = "/api/v1/auth/me";
const REGISTER_ENDPOINT = "/api/v1/auth/register";
const FORGOT_PASSWORD_ENDPOINT = "/api/v1/auth/forgot-password";
const RESET_PASSWORD_ENDPOINT = "/api/v1/auth/reset-password";

export const authService = {
  async login(email, senha) {
    const data = await apiRequest(LOGIN_ENDPOINT, {
      method: "POST",

      body: JSON.stringify({
        email,
        password: senha,
      }),
    });

    const token = data.access_token;

    if (!token) {
      throw new Error(
        "O servidor não retornou o token de autenticação."
      );
    }

    localStorage.setItem(
      "access_token",
      token
    );

    const usuario = await apiRequest(ME_ENDPOINT, {
      method: "GET",
    });

    if (!usuario) {
      localStorage.removeItem("access_token");

      throw new Error(
        "Não foi possível carregar os dados do usuário."
      );
    }

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );

    return {
      token,
      usuario,
    };
  },

  async cadastrar(nome, email, telefone, senha) {
    return apiRequest(REGISTER_ENDPOINT, {
      method: "POST",

      body: JSON.stringify({
        name: nome,
        email,
        phone: telefone || null,
        password: senha,
      }),
    });
  },

  async recuperarSenha(email) {
    return apiRequest(FORGOT_PASSWORD_ENDPOINT, {
      method: "POST",

      body: JSON.stringify({
        email,
      }),
    });
  },

  async redefinirSenha(token, novaSenha) {
    return apiRequest(RESET_PASSWORD_ENDPOINT, {
      method: "POST",

      body: JSON.stringify({
        token,
        new_password: novaSenha,
      }),
    });
  },

  async getCurrentUser() {
    const usuario = await apiRequest(ME_ENDPOINT, {
      method: "GET",
    });

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );

    return usuario;
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