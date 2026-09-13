import { useNavigate } from "react-router-dom";
import "./UsuarioPages.css";

function SolicitacoesPage() {
  const navigate = useNavigate();

  return (
    <div className="usuario-page">
      <header className="usuario-page-header">
        <div>
          <span className="page-brand">
            Onde<span>Tá</span>
          </span>

          <h1>Minhas solicitações</h1>

          <p>
            Acompanhe o andamento das suas solicitações de devolução.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          Voltar ao início
        </button>
      </header>

      <main className="usuario-page-content">
        <h2>Solicitações</h2>

        <div className="solicitacoes-empty">
          <div className="solicitacoes-empty-icon">
            OT
          </div>

          <h3>
            Nenhuma solicitação realizada
          </h3>

          <p>
            Você ainda não possui nenhuma solicitação de devolução em andamento.
            Quando uma correspondência for encontrada e você solicitar a
            devolução do objeto, ela aparecerá aqui.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/usuario/home")
            }
          >
            Voltar ao início
          </button>
        </div>
      </main>
    </div>
  );
}

export default SolicitacoesPage;