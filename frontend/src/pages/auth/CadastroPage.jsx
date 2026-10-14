import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/authService";

import "./AuthFormPage.css";

function CadastroPage() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (
      !nome.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {
      setErro(
        "Preencha todos os campos obrigatórios."
      );

      return;
    }

    if (senha.length < 8) {
      setErro(
        "A senha deve possuir pelo menos 8 caracteres."
      );

      return;
    }

    if (senha !== confirmarSenha) {
      setErro(
        "As senhas informadas não são iguais."
      );

      return;
    }

    try {
      setCarregando(true);

      await authService.cadastrar(
        nome.trim(),
        email.trim(),
        telefone.trim(),
        senha
      );

      setSucesso(
        "Conta criada com sucesso."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível criar sua conta."
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
          <span>PRIMEIRO ACESSO</span>

          <h1>Criar minha conta</h1>

          <p>
            Cadastre seus dados para utilizar o
            Portal de Achados e Perdidos.
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
            <label htmlFor="nome">
              Nome completo
            </label>

            <input
              id="nome"
              type="text"
              placeholder="Digite seu nome"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>

          <div className="auth-field">
            <label htmlFor="telefone">
              Telefone
            </label>

            <input
              id="telefone"
              type="text"
              placeholder="(34) 99999-9999"
              value={telefone}
              onChange={(event) =>
                setTelefone(event.target.value)
              }
            />
          </div>

          <div className="auth-field">
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmarSenha">
              Confirmar senha
            </label>

            <input
              id="confirmarSenha"
              type="password"
              placeholder="Digite novamente sua senha"
              value={confirmarSenha}
              onChange={(event) =>
                setConfirmarSenha(
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
              ? "Criando conta..."
              : "Criar conta"}
          </button>
        </form>

        <div className="auth-form-footer">
          Já possui uma conta?

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Fazer login
          </button>
        </div>
      </section>
    </main>
  );
}

export default CadastroPage;