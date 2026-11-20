import { apiRequest, storage } from "./api";
export const authService = {
  
async login(email, password, challengeToken = null, code = null) {
  const verificandoCodigo = Boolean(challengeToken);

  const data = await apiRequest(
    verificandoCodigo ? "/auth/2fa/verify" : "/auth/login",
    {
      public: true,
      method: "POST",
      body: JSON.stringify(
        verificandoCodigo
          ? {
              challenge_token: challengeToken,
              code: String(code || "").trim(),
            }
          : {
              email: email.trim(),
              password,
              access_mode: "USER",
            }
      ),
    }
  );

  if (data?.requires_2fa) {
    await storage.clear();
    return data;
  }

  if (!data?.access_token) {
    throw new Error("Token não recebido pelo servidor.");
  }

  await storage.setToken(data.access_token);

  try {
    const usuario = await this.getMe();

    if (usuario.role !== "USER" || !usuario.is_active) {
      throw new Error(
        "Este aplicativo é exclusivo para usuários comuns ativos."
      );
    }

    return {
      usuario,
      token: data.access_token,
    };
  } catch (error) {
    await storage.clear();
    throw error;
  }
},

  getMe: () => apiRequest("/auth/me"),
  getCurrentUser: () => apiRequest("/auth/me"),
  getUser: () => apiRequest("/auth/me"),
  register: (data) =>
    apiRequest("/auth/register", {
      public: true,
      method: "POST",
      body: JSON.stringify(data),
    }),
  forgotPassword: (email) =>
    apiRequest("/auth/forgot-password", {
      public: true,
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, new_password) =>
    apiRequest("/auth/reset-password", {
      public: true,
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
  logout: () => storage.clear(),
};
export default authService;
