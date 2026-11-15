import { Navigate, Route, Routes, useParams } from "react-router-dom";

import TwoFactorPage from "../pages/auth/TwoFactorPage";
import LoginPage from "../pages/auth/LoginPage";
import CadastroPage from "../pages/auth/CadastroPage";
import RecuperarSenhaPage from "../pages/auth/RecuperarSenhaPage";
import RedefinirSenhaPage from "../pages/auth/RedefinirSenhaPage";
import NotificacoesPage from "../pages/Usuario/NotificacoesPage";
import UsuarioHome from "../pages/Usuario/UsuarioHome";
import MeusItensPage from "../pages/Usuario/MeusItensPage";
import ItemDetalhePage from "../pages/Usuario/ItemDetalhePage";
import SolicitacoesPage from "../pages/Usuario/SolicitacoesPage";
import ItemPerdidoPage from "../pages/Usuario/ItemPerdidoPage";

import { useEffect, useState } from "react";
import { authService } from "../services/authService";
import AdminPage from "../pages/funcionario/AdminPage/AdminPage";

import UsuarioSupportPage from "../pages/Usuario/UsuarioSupportPage";

function LegacyPrototypeRoute() {
  const { secao = "usuarios" } = useParams();

  return (
    <Navigate
      to={`/funcionario/${secao === "estatisticas" ? "dashboard" : secao}`}
      replace
    />
  );
}

function AdminGuard() {
  const { secao = "dashboard" } = useParams();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    let mounted = true;

    authService
      .getCurrentUser()
      .then((user) => {
        if (mounted) {
          setAllowed(
            ["ADMIN", "COLABORADOR"].includes(user.role)
          );
        }
      })
      .catch(() => {
        if (mounted) setAllowed(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (allowed === null) {
    return <p style={{ padding: 40 }}>Verificando acesso...</p>;
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  if (
    ![
  "dashboard",
  "objetos",
  "publicacoes",
  "correspondencias",
  "solicitacoes",
  "devolucoes",
  "usuarios",
  "categorias",
].includes(secao)
  ) {
    return <Navigate to="/funcionario/dashboard" replace />;
  }

  return <AdminPage key={secao} />;
}

function SessionGuard({ children, userOnly = false }) {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    let live = true;
    authService.getCurrentUser().then(u => {if (live) setUser(u);}).catch(() => {if (live) setUser(null);});
    return () => {live = false;};
  }, []);
  if (user === undefined) return <p>Verificando acesso...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (userOnly && user.role !== "USER") return <Navigate to="/funcionario/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/seguranca" element={<SessionGuard><TwoFactorPage /></SessionGuard>} />
      <Route path="/usuario/perfil" element={<SessionGuard userOnly><UsuarioSupportPage /></SessionGuard>} />
      <Route path="/usuario/ajuda" element={<SessionGuard userOnly><UsuarioSupportPage /></SessionGuard>} />

      <Route
        path="/usuario/correspondencias"
        element={<Navigate to="/usuario/home#correspondencias" replace />}
      />


      <Route
        path="/prototipo/admin"
        element={<Navigate to="/funcionario/usuarios" replace />}
      />

      <Route
        path="/prototipo/admin/:secao"
        element={<LegacyPrototypeRoute />}
      />

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/cadastro" element={<CadastroPage />} />

      <Route
        path="/recuperar-senha"
        element={<RecuperarSenhaPage />}
      />

      <Route
        path="/redefinir-senha"
        element={<RedefinirSenhaPage />}
      />

      <Route path="/usuario/home" element={<SessionGuard userOnly><UsuarioHome /></SessionGuard>} />

      <Route
        path="/usuario/meus-itens"
        element={<SessionGuard userOnly><MeusItensPage /></SessionGuard>}
      />

      <Route
        path="/usuario/meus-itens/:id"
        element={<SessionGuard userOnly><ItemDetalhePage /></SessionGuard>}
      />

      <Route
        path="/usuario/solicitacoes"
        element={<SessionGuard userOnly><SolicitacoesPage /></SessionGuard>}
      />

      <Route
        path="/usuario/item-perdido"
        element={<SessionGuard userOnly><ItemPerdidoPage /></SessionGuard>}
      />

      <Route
        path="/funcionario"
        element={<Navigate to="/funcionario/dashboard" replace />}
      />

      <Route
        path="/funcionario/:secao"
        element={<AdminGuard />}
      />

      <Route
        path="/usuario/notificacoes"
        element={<SessionGuard userOnly><NotificacoesPage /></SessionGuard>}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;
