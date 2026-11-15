import React, { createContext, useContext, useEffect, useState } from "react";
import { storage, setSessionExpiredHandler } from "../services/api";
import authService from "../services/authService";
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function restore() {
    setLoading(true);
    setError("");
    try {
      if (await storage.getToken()) {
        const me = await authService.getMe();
        if (me.role !== "USER" || !me.is_active) {
          await storage.clear();
          throw new Error("Acesso exclusivo para usuários comuns ativos.");
        }
        setUser(me);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setError("Sessão expirada. Entre novamente.");
    });
    restore();
    return () => setSessionExpiredHandler(() => {});
  }, []);
  const login = async (email, password, challengeToken, code) => {
    const result = await authService.login(email, password, challengeToken, code);
    setError("");
    if (!result.requires_2fa) setUser(result.usuario);
    return result;
  };
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setError("");
  };
  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, restore }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
