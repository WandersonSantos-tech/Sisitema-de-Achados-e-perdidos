import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/authService";

import "./AuthFormPage.css";

function RecuperarSenhaPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }

    try {
      setCarregando(true);

      const response =
        await authService.recuperarSenha(
          email.trim()
        );

      setSucesso(
        response?.msg ||
          "Se o e-mail existir, as instruções foram enviadas."
      );
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível solicitar a recuperação."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-form-page">
      <section className="auth-form-card">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/login")}
        >
          ← Voltar
        </button>

        <div className="auth-form-header">
          <span>RECUPERAÇÃO DE ACESSO</span>

          <h1>Esqueceu sua senha?</h1>

          <p>
            Informe o e-mail utilizado no cadastro.
            Enviaremos as instruções para redefinir
            sua senha.
          </p>
        </div>

        {erro && (
          <div className="auth-message error">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="auth-message success">
            {sucesso}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail cadastrado"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={carregando}
          >
            {carregando
              ? "Enviando..."
              : "Enviar instruções"}
          </button>
        </form>

        <div className="auth-form-footer">
          Lembrou sua senha?

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Voltar ao login
          </button>
        </div>
      </section>
    </main>
  );
}

export default RecuperarSenhaPage;