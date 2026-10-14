import { useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { authService } from "../../services/authService";

import "./AuthFormPage.css";

function RedefinirSenhaPage() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const tokenDaUrl =
    searchParams.get("token") || "";

  const [token, setToken] =
    useState(tokenDaUrl);

  const [novaSenha, setNovaSenha] =
    useState("");

  const [
    confirmarNovaSenha,
    setConfirmarNovaSenha,
  ] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!token.trim()) {
      setErro(
        "Token de recuperação não informado."
      );

      return;
    }

    if (novaSenha.length < 8) {
      setErro(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );

      return;
    }

    if (
      novaSenha !== confirmarNovaSenha
    ) {
      setErro(
        "As senhas informadas não são iguais."
      );

      return;
    }

    try {
      setCarregando(true);

      const response =
        await authService.redefinirSenha(
          token.trim(),
          novaSenha
        );

      setSucesso(
        response?.msg ||
          "Senha redefinida com sucesso."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível redefinir a senha."
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
          <span>NOVA SENHA</span>

          <h1>Redefinir senha</h1>

          <p>
            Escolha uma nova senha para acessar
            sua conta.
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
          {!tokenDaUrl && (
            <div className="auth-field">
              <label htmlFor="token">
                Token de recuperação
              </label>

              <input
                id="token"
                type="text"
                placeholder="Digite o token recebido"
                value={token}
                onChange={(event) =>
                  setToken(event.target.value)
                }
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="novaSenha">
              Nova senha
            </label>

            <input
              id="novaSenha"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={novaSenha}
              onChange={(event) =>
                setNovaSenha(
                  event.target.value
                )
              }
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmarNovaSenha">
              Confirmar nova senha
            </label>

            <input
              id="confirmarNovaSenha"
              type="password"
              placeholder="Digite novamente"
              value={confirmarNovaSenha}
              onChange={(event) =>
                setConfirmarNovaSenha(
                  event.target.value
                )
              }
            />
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={carregando}
          >
            {carregando
              ? "Alterando senha..."
              : "Redefinir senha"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default RedefinirSenhaPage;