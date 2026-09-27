import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api";

const authService = {
  async login(email, password) {
    // Enviando o campo como 'email' conforme exigido pelo schema do backend
    const data = await apiRequest("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password,
      }),
    });

    if (!data || !data.access_token) {
      throw new Error("Token não recebido pelo servidor.");
    }

    await AsyncStorage.setItem("access_token", data.access_token);

    const usuario = await this.getMe();

    if (usuario) {
      await AsyncStorage.setItem("user", JSON.stringify(usuario));
    }

    return {
      token: data.access_token,
      usuario,
    };
  },

  async getMe() {
    try {
      const data = await apiRequest("/auth/me", { method: "GET" });
      return data;
    } catch (error) {
      console.error("Erro ao buscar perfil do usuário:", error);
      return null;
    }
  },

  async logout() {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("user");
  },
};

export default authService;