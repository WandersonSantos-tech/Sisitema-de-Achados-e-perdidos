
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  storage,
  setSessionExpiredHandler,
} from "../services/api";

import authService from "../services/authService";

import {
  registrarNotificacoesAndroid,
} from "../services/pushNotificationService";

import {
  cadastrarDispositivoPush,
  removerDispositivoPush,
} from "../services/pushDeviceService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pushTokenRef = useRef(null);
  const pushUserIdRef = useRef(null);

  useEffect(() => {
    let ativo = true;

    async function iniciarNotificacoes() {
      if (!user || user.role !== "USER") {
        return;
      }

      try {
        const token = await registrarNotificacoesAndroid();

        if (!ativo || !token) {
          return;
        }

        // Evita registrar o mesmo token repetidamente
        // para o mesmo usuário durante esta sessão.
        if (
          pushTokenRef.current === token &&
          pushUserIdRef.current === user.id
        ) {
          return;
        }

        await cadastrarDispositivoPush(token);

        if (!ativo) {
          return;
        }

        pushTokenRef.current = token;
        pushUserIdRef.current = user.id;

        console.log(
          "[OndeTá Push] Dispositivo cadastrado no backend."
        );
      } catch (erro) {
        console.warn(
          "[OndeTá Push] Falha no cadastro do dispositivo:",
          erro?.message || erro
        );
      }
    }

    iniciarNotificacoes();

    return () => {
      ativo = false;
    };
  }, [user?.id, user?.role]);

  async function restore() {
    setLoading(true);
    setError("");

    try {
      if (await storage.getToken()) {
        const me = await authService.getMe();

        if (me.role !== "USER" || !me.is_active) {
          await storage.clear();

          throw new Error(
            "Acesso exclusivo para usuários comuns ativos."
          );
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
      pushTokenRef.current = null;
      pushUserIdRef.current = null;

      setUser(null);
      setError("Sessão expirada. Entre novamente.");
    });

    restore();

    return () => {
      setSessionExpiredHandler(() => {});
    };
  }, []);

  const login = async (
    email,
    password,
    challengeToken,
    code
  ) => {
    const result = await authService.login(
      email,
      password,
      challengeToken,
      code
    );

    setError("");

    if (!result.requires_2fa) {
      setUser(result.usuario);
    }

    return result;
  };

  const logout = async () => {
    const token = pushTokenRef.current;

    // Desvincula o dispositivo enquanto
    // o JWT ainda está disponível.
    if (token) {
      try {
        await removerDispositivoPush(token);

        console.log(
          "[OndeTá Push] Dispositivo desvinculado."
        );
      } catch (erro) {
        console.warn(
          "[OndeTá Push] Falha ao desvincular dispositivo:",
          erro?.message || erro
        );
      }
    }

    await authService.logout();

    pushTokenRef.current = null;
    pushUserIdRef.current = null;

    setUser(null);
    setError("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        restore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
