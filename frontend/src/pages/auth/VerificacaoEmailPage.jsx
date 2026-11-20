
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import "./VerificacaoEmailPage.css";

export default function VerificacaoEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const dados = location.state;
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(300);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!dados?.challengeToken || !dados?.email) {
      navigate("/login", { replace: true });
      return;
    }

    inputRef.current?.focus();
  }, [dados, navigate]);

  useEffect(() => {
    if (segundos <= 0) return;

    const timer = setTimeout(() => {
      setSegundos((anterior) => anterior - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [segundos]);

  if (!dados?.challengeToken || !dados?.email) {
    return null;
  }

  const emailProtegido = (() => {
    const [nome, dominio] = dados.email.split("@");
    if (!dominio) return dados.email;
    return `${nome.slice(0, 2)}***@${dominio}`;
  })();

  const tempo = `${Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0")}:${(segundos % 60)
    .toString()
    .padStart(2, "0")}`;

  async function verificar(event) {
    event.preventDefault();
    setErro("");

    if (codigo.length !== 6) {
      setErro("Digite os seis números do código.");
      return;
    }

    if (segundos === 0) {
      setErro("O código expirou. Volte ao login.");
      return;
    }

    try {
      setCarregando(true);

      const resultado = await authService.login(
        dados.email,
        "",
        dados.challengeToken,
        codigo,
        dados.modoFuncionario ? "STAFF" : "USER"
      );

      const role = resultado.usuario?.role;

      if (dados.modoFuncionario) {
        if (!["ADMIN", "COLABORADOR"].includes(role)) {
          authService.logout();
          throw new Error("Acesso operacional não permitido.");
        }

        navigate("/funcionario/dashboard", {
          replace: true,
          state: null,
        });
        return;
      }

      if (role !== "USER") {
        authService.logout();
        throw new Error("Esta conta não pertence à área do usuário.");
      }

      navigate("/usuario/home", {
        replace: true,
        state: null,
      });
    } catch (error) {
      setErro(error.message || "Código inválido. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function voltar() {
    navigate("/login", {
      replace: true,
      state: null,
    });
  }

  return (
    <main className="verificacao-page">
      <section className="verificacao-card">
        <div className="verificacao-brand">
          <div className="verificacao-logo">AP</div>
          <div>
            <h2>
              Onde<span>Tá</span>
            </h2>
            <p>Achados & Perdidos</p>
          </div>
        </div>

        <div className="verificacao-icon">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="m3 6 9 7 9-7" />
            <path d="m9 17 2 2 4-4" />
          </svg>
        </div>

        <h1>Verifique seu e-mail</h1>

        <p className="verificacao-description">
          Para proteger sua conta, enviamos um código de
          segurança de 6 dígitos para:
        </p>

        <strong className="verificacao-email">
          {emailProtegido}
        </strong>

        <form onSubmit={verificar}>
          <label className="verificacao-label">
            Código de verificação
          </label>

          <div
            className="verificacao-digitos"
            onClick={() => inputRef.current?.focus()}
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className={
                  codigo.length === index
                    ? "verificacao-digito ativo"
                    : "verificacao-digito"
                }
              >
                {codigo[index] || ""}
              </div>
            ))}

            <input
              ref={inputRef}
              className="verificacao-input-real"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(event) => {
                setCodigo(
                  event.target.value.replace(/\D/g, "").slice(0, 6)
                );
                setErro("");
              }}
              disabled={carregando}
              aria-label="Código de seis dígitos"
            />
          </div>

          {erro && (
            <div className="verificacao-erro" role="alert">
              {erro}
            </div>
          )}

          <p className="verificacao-tempo">
            {segundos > 0
              ? `O código expira em ${tempo}`
              : "O código expirou."}
          </p>

          <button
            type="submit"
            className="verificacao-submit"
            disabled={
              carregando ||
              codigo.length !== 6 ||
              segundos === 0
            }
          >
            {carregando
              ? "Verificando..."
              : "Verificar e continuar"}
          </button>
        </form>

        <div className="verificacao-reenvio">
          <span>Não recebeu o código?</span>
          <p>
            Confira sua caixa de spam ou lixo eletrônico.
          </p>
          <span className="verificacao-reenvio-pendente">
            Reenvio de código: próxima etapa
          </span>
        </div>

        <button
          type="button"
          className="verificacao-voltar"
          onClick={voltar}
        >
          ← Voltar para o login
        </button>

        <div className="verificacao-seguranca">
          <span>🔒</span>
          Sua conta está protegida com autenticação de dois fatores.
        </div>
      </section>
    </main>
  );
}
