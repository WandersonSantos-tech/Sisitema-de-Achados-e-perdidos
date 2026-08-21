import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

function UsuarioHome() {
  const navigate = useNavigate();

  const usuario = authService.getUsuario();
  const token = authService.getToken();

  console.log("===== USUÁRIO AUTENTICADO =====");
  console.log("Usuário:", usuario);
  console.log("Token:", token);
  console.log("Role:", usuario?.role);
  console.log("===============================");

  function handleLogout() {
    authService.logout();

    console.log("Logout realizado.");

    navigate("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fc",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "#071d49",
            color: "#ffffff",
            padding: "30px",
            borderRadius: "18px",
            marginBottom: "25px",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.8,
            }}
          >
            Portal de Achados e Perdidos
          </p>

          <h1
            style={{
              marginBottom: "8px",
            }}
          >
            Olá, {usuario?.name || "Usuário"}!
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.8,
            }}
          >
            Login realizado com sucesso.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "30px",
            borderRadius: "18px",
            boxShadow:
              "0 10px 30px rgba(7, 29, 73, 0.08)",
          }}
        >
          <h2
            style={{
              color: "#071d49",
              marginTop: 0,
            }}
          >
            Minha conta
          </h2>

          <p>
            <strong>Nome:</strong>{" "}
            {usuario?.name || "-"}
          </p>

          <p>
            <strong>E-mail:</strong>{" "}
            {usuario?.email || "-"}
          </p>

          <p>
            <strong>Telefone:</strong>{" "}
            {usuario?.phone || "Não informado"}
          </p>

          <p>
            <strong>Perfil:</strong>{" "}
            {usuario?.role || "-"}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              marginTop: "20px",
              padding: "12px 22px",
              background: "#1557b0",
              color: "#ffffff",
              border: "none",
              borderRadius: "9px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </main>
  );
}

export default UsuarioHome;