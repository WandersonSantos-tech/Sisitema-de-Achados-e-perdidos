import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import CadastroPage from "../pages/auth/CadastroPage";
import RecuperarSenhaPage from "../pages/auth/RecuperarSenhaPage";
import RedefinirSenhaPage from "../pages/auth/RedefinirSenhaPage";

import CategoriesPage from "../pages/funcionario/CategoriaPage/CategoriesPage";

import UsuarioHome from "../pages/usuario/UsuarioHome";


function FuncionarioDashboard() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard do Funcionário</h1>

      <p>
        Login realizado com sucesso.
      </p>
    </div>
  );
}


function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/cadastro"
        element={<CadastroPage />}
      />

      <Route
        path="/recuperar-senha"
        element={<RecuperarSenhaPage />}
      />

      <Route
        path="/redefinir-senha"
        element={<RedefinirSenhaPage />}
      />

      <Route
        path="/usuario/home"
        element={<UsuarioHome />}
      />

      <Route
        path="/funcionario/dashboard"
        element={<FuncionarioDashboard />}
      />

      <Route
        path="/funcionario/categorias"
        element={<CategoriesPage />}
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default AppRoutes;