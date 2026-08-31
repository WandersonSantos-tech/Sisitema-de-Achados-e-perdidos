import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "./api";

export const authService = {
  async login(email, password) {
    const data = await apiRequest(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    if (!data.access_token) {
      throw new Error(
        "Token não recebido pelo servidor."
      );
    }

    await AsyncStorage.setItem(
      "access_token",
      data.access_token
    );

    const usuario =
      await this.getMe();

    await AsyncStorage.setItem(
      "user",
      JSON.stringify(usuario)
    );

    return {
      token: data.access_token,
      usuario,
    };
  },

  async register({
    name,
    email,
    phone,
    password,
  }) {
    return apiRequest(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      }
    );
  },

  async getMe() {
    return apiRequest(
      "/auth/me",
      {
        method: "GET",
      }
    );
  },

  async forgotPassword(email) {
    return apiRequest(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      }
    );
  },

  async resetPassword(
    token,
    newPassword
  ) {
    return apiRequest(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      }
    );
  },

  async logout() {
    await AsyncStorage.multiRemove([
      "access_token",
      "user",
    ]);
  },

  async getUser() {
    const data =
      await AsyncStorage.getItem(
        "user"
      );

    return data
      ? JSON.parse(data)
      : null;
  },
};