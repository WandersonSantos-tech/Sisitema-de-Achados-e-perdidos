import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";

function AlunoHome() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Área do Aluno</h1>
      <p>Login realizado com sucesso.</p>
    </div>
  );
}

function FuncionarioDashboard() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard do Funcionário</h1>
      <p>Login realizado com sucesso.</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/aluno/home"
        element={<AlunoHome />}
      />

      <Route
        path="/funcionario/dashboard"
        element={<FuncionarioDashboard />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default AppRoutes;