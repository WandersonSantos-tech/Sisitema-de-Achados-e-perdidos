import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [modoFuncionario, setModoFuncionario] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
async function handleSubmit(event) {
  event.preventDefault();

  setErro("");

  if (!email.trim() || !senha.trim()) {
    setErro("Informe seu e-mail e sua senha.");
    return;
  }

  try {
    setCarregando(true);

    const { usuario } = await authService.login(
      email,
      senha
    );

    console.log("LOGIN REALIZADO COM SUCESSO");
    console.log("Usuário:", usuario);
    console.log("Token:", authService.getToken());
    console.log("Role:", usuario.role);

    // Login pela área de funcionário
    if (modoFuncionario) {
      if (usuario.role !== "ADMIN") {
        authService.logout();

        setErro(
          "Esta conta não possui permissão de funcionário."
        );

        return;
      }

      navigate("/funcionario/categorias");
      return;
    }

    // Login normal do usuário
    if (usuario.role === "USER") {
      navigate("/usuario/home");
      return;
    }

    // Caso um ADMIN faça login pela tela normal
    if (usuario.role === "ADMIN") {
      navigate("/funcionario/categorias");
      return;
    }

    authService.logout();
    setErro("Tipo de usuário não reconhecido.");

  } catch (error) {
    console.error("ERRO AO REALIZAR LOGIN:");
    console.error(error);

    setErro(
      error.message ||
        "Não foi possível realizar o acesso."
    );

  } finally {
    setCarregando(false);
  }
}
function alterarModo() {
  setModoFuncionario(!modoFuncionario);

  setEmail("");
  setSenha("");
  setErro("");
}

  return (
    <main className="login-page">
      <section className="login-presentation">
        <div className="institution-header">
          <div className="institution-logo">
            <span>AP</span>
          </div>

          <div>
            <div className="brand-name">
            <h1>
              Onde<span>Tá</span>
            </h1>

            <p>Achados & Perdidos</p>
          </div>
            <p>Sistema de Achados e Perdidos</p>
          </div>
        </div>

        <div className="presentation-content">
          <span className="portal-badge">
             PORTAL OndeTá
          </span>

          <h2>
            Um jeito mais seguro de recuperar
            o que é seu.
          </h2>

          <p className="presentation-description">
            Consulte objetos encontrados, registre itens
            perdidos e acompanhe todo o processo de
            devolução em um único lugar.
            </p>

          <div className="presentation-features">
            <div className="presentation-feature">
              <div className="feature-icon">01</div>

              <div>
                <strong>Registre um item perdido</strong>

                <p>
                  Informe características, local e data
                  aproximada da perda.
                </p>
              </div>
            </div>

            <div className="presentation-feature">
              <div className="feature-icon">02</div>

              <div>
                <strong>
                  Encontre possíveis correspondências
                </strong>

            <p>
            O sistema compara objetos perdidos com
            os itens encontrados cadastrados.
            </p>
              </div>
            </div>

            <div className="presentation-feature">
              <div className="feature-icon">03</div>

              <div>
                <strong>Retirada com segurança</strong>

                <p>
                  A propriedade do objeto é validada antes
                  da confirmação da devolução.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="presentation-footer">
            <span>
            Plataforma de gerenciamento de objetos
            perdidos e encontrados
            </span>
        </div>
      </section>

      <section className="login-area">
        <div className="login-container">
          <div className="mobile-brand">
            <div className="institution-logo">
              <span>AP</span>
            </div>

            <div>
              <strong>Achados e Perdidos</strong>
              <span>Portal Institucional</span>
            </div>
          </div>

          <div className="login-type">
            <span
              className={
                modoFuncionario
                  ? "access-indicator employee"
                  : "access-indicator student"
              }
            >
              {modoFuncionario
                ? "ACESSO DO FUNCIONÁRIO"
                : "ACESSO DO USUÁRIO"}
            </span>
          </div>

          <div className="login-header">
            <h2>
              {modoFuncionario
                ? "Acesso do funcionário"
                : "Olá, seja bem-vindo"}
            </h2>

            <p>
                {modoFuncionario
                ? "Entre com suas credenciais para acessar o painel de gerenciamento."
                : "Acesse sua conta para consultar e acompanhar seus objetos."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {erro && (
              <div className="error-message">
                <span>!</span>

                <p>{erro}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                {modoFuncionario
                  ? "E-mail"
                  : "E-mail"}
              </label>

              <div className="input-container">
                <span className="input-icon">@</span>

                <input
                  id="email"
                  type="email"
                  placeholder={
                    modoFuncionario
                      ? "Digite seu e-mail"
                      : "Digite seu e-mail cadastrado"
                  }
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="senha">
                  Senha
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    navigate("/recuperar-senha")
                  }
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="input-container">
                <span className="input-icon">
                  ●
                </span>

                <input
                  id="senha"
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setMostrarSenha(
                      !mostrarSenha
                    )
                  }
                >
                  {mostrarSenha
                    ? "Ocultar"
                    : "Mostrar"}
                </button>
              </div>
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={carregando}
            >
              {carregando
                ? "Validando acesso..."
                : modoFuncionario
                ? "Entrar no painel"
                : "Entrar"}
            </button>
          </form>

          {!modoFuncionario && (
            <div className="register-area">
              <span>
                Primeiro acesso?
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate("/cadastro")
                }
              >
                Criar minha conta
              </button>
            </div>
          )}

          <div className="separator">
            <span></span>
            <p>ou</p>
            <span></span>
          </div>

          <button
            type="button"
            className={
              modoFuncionario
                ? "employee-button active"
                : "employee-button"
            }
            onClick={alterarModo}
          >
            <div className="employee-button-icon">
              {modoFuncionario ? "←" : "ID"}
            </div>

            <div className="employee-button-text">
              <strong>
                {modoFuncionario
                 ? "Voltar para acesso do usuário"
                  : "Sou funcionário"}
              </strong>

              <span>
                {modoFuncionario
                  ? "Retornar ao portal do usuário"
                  : "Acessar área interna de atendimento"}
              </span>
            </div>

            <span className="employee-arrow">
              →
            </span>
          </button>

          <div className="security-message">
            <span>●</span>

            <p>
              Ambiente protegido. Não compartilhe
              suas credenciais de acesso.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;