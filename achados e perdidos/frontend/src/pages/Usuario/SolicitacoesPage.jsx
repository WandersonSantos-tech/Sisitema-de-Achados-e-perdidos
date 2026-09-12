import { useNavigate } from "react-router-dom";
import "./UsuarioPages.css";

function SolicitacoesPage() {
  const navigate = useNavigate();

  const solicitacoes = [
    {
      id: 1,
      item: "Mochila preta",
      data: "29/08/2026",
      status: "Em validação",
    },
  ];

  return (
    <div className="usuario-page">
      <header className="usuario-page-header">
        <div>
          <span className="page-brand">
            Onde<span>Tá</span>
          </span>

          <h1>Minhas solicitações</h1>

          <p>
            Acompanhe o andamento das solicitações de devolução.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/usuario/home")}
        >
          Voltar ao início
        </button>
      </header>

      <main className="usuario-page-content">
        <h2>Solicitações recentes</h2>

        <div className="simple-list">
          {solicitacoes.map((solicitacao) => (
            <div
              className="simple-card"
              key={solicitacao.id}
            >
              <div>
                <span className="card-category">
                  SOLICITAÇÃO #{solicitacao.id}
                </span>

                <h3>{solicitacao.item}</h3>

                <p>
                  Solicitação realizada em {solicitacao.data}
                </p>
              </div>

              <span className="status-badge">
                {solicitacao.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default SolicitacoesPage;