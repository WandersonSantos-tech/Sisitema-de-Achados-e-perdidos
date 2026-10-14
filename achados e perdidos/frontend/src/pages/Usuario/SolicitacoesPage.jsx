
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { apiRequest } from "../../services/api";
import ClaimChat from "../../components/ClaimChat";
import "./UsuarioPages.css";

export default function SolicitacoesPage() {
  const navigate = useNavigate();

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [contatos, setContatos] = useState({});
  const [conversaAberta, setConversaAberta] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    claimService
      .myClaims()
      .then((resposta) => {
        setSolicitacoes(resposta.items || []);
      })
      .catch((error) => {
        setErro(error.message);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  async function abrirConversa(solicitacao) {
    if (conversaAberta === solicitacao.id) {
      setConversaAberta(null);
      return;
    }

    setErro("");

    try {
      if (!contatos[solicitacao.id]) {
        const contato = await apiRequest(
          `/messages/claims/${solicitacao.id}/contact`
        );

        setContatos((anterior) => ({
          ...anterior,
          [solicitacao.id]: contato,
        }));
      }

      setConversaAberta(solicitacao.id);
    } catch (error) {
      setErro(error.message || "Erro ao abrir conversa.");
    }
  }

  function formatarStatus(status) {
    const nomes = {
      PENDENTE: "Aguardando análise",
      APROVADA: "Aprovada - aguardando retirada",
      REJEITADA: "Rejeitada",
      CANCELADA: "Cancelada",
    };

    return nomes[status] || status || "Não informado";
  }

  return (
    <div className="usuario-page">
      <header className="usuario-page-header">
        <div>
          <span className="page-brand">
            Onde<span>Tá</span>
          </span>

          <h1>Minhas solicitações</h1>

          <p>
            Acompanhe suas solicitações e converse
            com o funcionário.
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
        <h2>Solicitações</h2>

        {carregando && <p>Carregando solicitações...</p>}

        {erro && <p role="alert">{erro}</p>}

        {!carregando &&
          !erro &&
          solicitacoes.length === 0 && (
            <p>Nenhuma solicitação realizada.</p>
          )}

        {solicitacoes.map((solicitacao) => (
          <article
            key={solicitacao.id}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <h3>
              {solicitacao.item?.title || "Objeto"}
            </h3>

            <p>
              <strong>Status:</strong>{" "}
              {formatarStatus(solicitacao.status)}
            </p>

            <p>
              <strong>Local:</strong>{" "}
              {solicitacao.item?.location_name ||
                "Não informado"}
            </p>

            <p>
              <strong>Informações enviadas:</strong>{" "}
              {solicitacao.proof_description}
            </p>

            <button
              type="button"
              onClick={() => abrirConversa(solicitacao)}
            >
              {conversaAberta === solicitacao.id
                ? "Fechar conversa"
                : "Conversar com funcionário"}
            </button>

            {conversaAberta === solicitacao.id &&
              contatos[solicitacao.id] && (
                <ClaimChat
                  itemId={solicitacao.item_id}
                  interlocutorId={
                    contatos[solicitacao.id].id
                  }
                  interlocutorNome={
                    contatos[solicitacao.id].name
                  }
                />
              )}
          </article>
        ))}
      </main>
    </div>
  );
}
