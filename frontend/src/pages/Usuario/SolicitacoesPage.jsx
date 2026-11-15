
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { claimService } from "../../services/claimService";
import { apiRequest } from "../../services/api";
import ClaimChat from "../../components/ClaimChat";
import ReturnSignatureStatus from "../../components/ReturnSignatureStatus";
import "./UsuarioPages.css";
import "./SolicitacoesPage.css";

const STATUS = {
  CORRESPONDENCIA: ["Correspondência recebida", "waiting"],
  PENDENTE: ["Em análise", "waiting"],
  APROVADA: ["Aguardando retirada", "progress"],
  REJEITADA: ["Rejeitada", "closed"],
  CANCELADA: ["Cancelada", "closed"],
};

function statusDaSolicitacao(s) {
  if (s.returned_at) return ["Devolvido", "done"];
  return STATUS[s.status] || [
    (s.status || "Em andamento").replaceAll("_", " "),
    "progress",
  ];
}

function imagemUrl(photo) {
  const base = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api/v1"
  ).replace(/\/api\/v1\/?$/, "");

  const url = photo?.image_url || "";
  return /^https?:\/\//.test(url)
    ? url
    : `${base}/${url.replace(/^\/+/, "")}`;
}

export default function SolicitacoesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [contatos, setContatos] = useState({});
  const [conversaAberta, setConversaAberta] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro("");

    claimService.myClaims(page)
      .then((res) => {
        if (!ativo) return;
        setSolicitacoes(res.items || []);
        setTotal(res.total || 0);
      })
      .catch((e) => {
        if (ativo) setErro(e.message || "Erro ao carregar solicitações.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => { ativo = false; };
  }, [page]);

  async function abrirConversa(s) {
    if (conversaAberta === s.id) {
      setConversaAberta(null);
      return;
    }

    setErro("");
    try {
      let contato = contatos[s.id];
      if (!contato) {
        contato = await apiRequest(`/messages/claims/${s.id}/contact`);
        setContatos((prev) => ({ ...prev, [s.id]: contato }));
      }
      setConversaAberta(s.id);
    } catch (e) {
      setErro(e.message || "Erro ao abrir conversa.");
    }
  }

  return (
    <div className="usuario-page sol-page">
      <header className="usuario-page-header sol-hero">
        <div>
          <span className="page-brand">Onde<span>Tá</span></span>
          <span className="sol-hero-tag">ÁREA DO USUÁRIO</span>
          <h1>Minhas solicitações</h1>
          <p>Acompanhe suas correspondências, documentos e devoluções em um só lugar.</p>
        </div>
        <button className="back-button" onClick={() => navigate("/usuario/home")}>
          ← Voltar ao início
        </button>
      </header>

      <main className="usuario-page-content sol-content">
        <div className="sol-overview">
          <div>
            <span className="sol-eyebrow">CENTRAL DE ACOMPANHAMENTO</span>
            <h2>Suas solicitações</h2>
            <p>Confira o andamento e os próximos passos de cada objeto.</p>
          </div>
          <div className="sol-total">
            <strong>{total}</strong>
            <span>Solicitações</span>
          </div>
        </div>

        {erro && <div className="sol-error" role="alert">{erro}</div>}

        {carregando && (
          <div className="sol-empty">Carregando suas solicitações...</div>
        )}

        {!carregando && !erro && solicitacoes.length === 0 && (
          <div className="sol-empty">
            <div className="sol-empty-icon">◇</div>
            <h3>Nenhuma solicitação por enquanto</h3>
            <p>Quando uma correspondência for enviada, ela aparecerá aqui.</p>
          </div>
        )}

        <div className="sol-list">
          {solicitacoes.map((s) => {
            const objeto = s.lost_item || s.item || {};
            const [status, statusClass] = statusDaSolicitacao(s);
            const imagens = objeto.images || [];
            const encerrada = ["REJEITADA", "CANCELADA"].includes(s.status);

            return (
              <article className="sol-card" key={s.id}>
                <div className="sol-card-top">
                  <div className="sol-object">
                    <div className="sol-object-icon">
                      <span>◇</span>
                    </div>
                    <div className="sol-object-details">
                      <span className="sol-eyebrow">OBJETO CADASTRADO</span>
                      <h3>{objeto.title || "Objeto"}</h3>
                      {objeto.description && (
                        <p className="sol-description">{objeto.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`sol-status ${statusClass}`}>
                    <span className="sol-status-dot" />
                    {status}
                  </span>
                </div>

                <div className="sol-details">
                  <div className="sol-detail">
                    <span className="sol-detail-icon">⌖</span>
                    <div>
                      <span>Local do registro</span>
                      <strong>{objeto.location_name || "Não informado"}</strong>
                    </div>
                  </div>
                  <div className="sol-detail">
                    <span className="sol-detail-icon">◷</span>
                    <div>
                      <span>Retirada</span>
                      <strong>
                        {s.pickup_at
                          ? new Date(s.pickup_at).toLocaleString("pt-BR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "Ainda não agendada"}
                      </strong>
                    </div>
                  </div>
                </div>

                {s.pickup_at && (
                  <div className="sol-document">
                    <div className="sol-section-heading">
                      <div>
                        <span className="sol-eyebrow">DOCUMENTAÇÃO</span>
                        <h4>Termo de devolução</h4>
                        <p>Consulte e assine seu documento eletrônico.</p>
                      </div>
                      <span className="sol-document-icon">▤</span>
                    </div>
                    <ReturnSignatureStatus claimId={s.id} />
                  </div>
                )}

                {!encerrada && (
                  <div className="sol-card-footer">
                    <div className="sol-footer-note">
                      <span className="sol-online-dot" />
                      Atendimento e acompanhamento
                    </div>
                    <button
                      type="button"
                      className="sol-btn sol-btn-primary"
                      onClick={() => abrirConversa(s)}
                    >
                      {conversaAberta === s.id
                        ? "Fechar conversa ↑"
                        : "Conversar com funcionário →"}
                    </button>
                  </div>
                )}

                {conversaAberta === s.id && contatos[s.id] && (
                  <div className="sol-chat">
                    <ClaimChat
                      itemId={s.item_id}
                      interlocutorId={contatos[s.id].id}
                      interlocutorNome={contatos[s.id].name}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {total > 20 && (
          <div className="sol-pagination">
            <button
              className="sol-btn sol-btn-secondary"
              disabled={carregando || page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span>Página {page} de {Math.ceil(total / 20)}</span>
            <button
              className="sol-btn sol-btn-secondary"
              disabled={carregando || page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
