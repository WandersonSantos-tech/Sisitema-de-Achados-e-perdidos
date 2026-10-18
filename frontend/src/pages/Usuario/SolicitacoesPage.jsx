
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { apiRequest } from "../../services/api";
import { reviewService } from "../../services/reviewService";
import ClaimChat from "../../components/ClaimChat";
import "./UsuarioPages.css";

export default function SolicitacoesPage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [contatos, setContatos] = useState({});
  const [conversaAberta, setConversaAberta] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    claimService
      .myClaims(page)
      .then((resposta) => {
        setSolicitacoes(resposta.items || []);
        setTotal(resposta.total || 0);
      })
      .catch((error) => {
        setErro(error.message);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [page]);

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
      CORRESPONDENCIA: "Correspondência enviada — aguardando verificação",
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

            <p>{solicitacao.item?.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(solicitacao.item?.images || []).map((photo) => {
                const base = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1\/?$/, "");
                const src = /^https?:\/\//.test(photo.image_url) ? photo.image_url : `${base}/${photo.image_url.replace(/^\/+/, "")}`;
                return <img key={photo.id} src={src} alt={solicitacao.item.title} style={{ width: 120, height: 100, objectFit: "contain" }} />;
              })}
            </div>
            <p>
              <strong>Status:</strong>{" "}
              {solicitacao.returned_at ? "Devolvido" : formatarStatus(solicitacao.status)}
            </p>

            {solicitacao.pickup_at && <p>Retirada agendada: {new Date(solicitacao.pickup_at).toLocaleString("pt-BR")}</p>}
            <p>
              <strong>Local:</strong>{" "}
              {solicitacao.item?.location_name ||
                "Não informado"}
            </p>

            <p>
              <strong>Informações enviadas:</strong>{" "}
              {solicitacao.proof_description}
            </p>

            {solicitacao.returned_at && (
              <section>
                <h4>Avaliar devolução</h4>
                <form onSubmit={async (event) => {
                  event.preventDefault(); setErro("");
                  const values = new FormData(event.currentTarget);
                  try {
                    await reviewService.create(solicitacao.item_id, { rating: Number(values.get("rating")), comment: values.get("comment") || null });
                    setAvaliacoes((previous) => ({ ...previous, [solicitacao.id]: "Avaliação enviada." }));
                  } catch (error) { setErro(error.message); }
                }}>
                  <label>Nota<select name="rating" defaultValue="5">{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                  <label>Comentário<input name="comment" maxLength={1000} /></label>
                  <button disabled={typeof avaliacoes[solicitacao.id] === "string"}>Enviar avaliação</button>
                </form>
                {typeof avaliacoes[solicitacao.id] === "string" && <p role="status">{avaliacoes[solicitacao.id]}</p>}
                <button onClick={async () => {
                  try {
                    const reviews = await reviewService.listByItem(solicitacao.item_id);
                    setAvaliacoes((previous) => ({ ...previous, [solicitacao.id]: reviews }));
                  } catch (error) { setErro(error.message); }
                }}>Ver avaliações</button>
                {Array.isArray(avaliacoes[solicitacao.id]) && avaliacoes[solicitacao.id].map((review) => <p key={review.id}>{review.rating}/5 · {review.comment || "Sem comentário"}</p>)}
              </section>
            )}
            {!["REJEITADA", "CANCELADA"].includes(solicitacao.status) && (
            <button
              type="button"
              onClick={() => abrirConversa(solicitacao)}
            >
              {conversaAberta === solicitacao.id
                ? "Fechar conversa"
                : "Conversar com funcionário"}
            </button>)}

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
        <div className="admin-actions">
          <button disabled={carregando || page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page}</span>
          <button disabled={carregando || page * 20 >= total} onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      </main>
    </div>
  );
}
