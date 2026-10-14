import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { moderationService as api } from "../../services/moderationService";
import { authService } from "../../services/authService";
import "./DenunciasPage.css";

export default function DenunciasPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("minhas");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [data, setData] = useState(null);
  const [target, setTarget] = useState(null);
  const [kind, setKind] = useState("publicacao");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let live = true;
    if (!authService.isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    setError("");
    (tab === "minhas"
      ? api.mine({ page, page_size: 20 })
      : api.targets({ page, page_size: 20, search })
    )
      .then((result) => {
        if (live) setData(result);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [tab, page, search, navigate, reload]);
  function switchTab(next) {
    setTab(next);
    setPage(1);
    setTarget(null);
    setConfirmation(false);
    setError("");
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api.submit({
        reason: reason.trim(),
        ...(kind === "publicacao"
          ? { reported_item_id: target.id }
          : { reported_user_id: target.user_id }),
      });
      setNotice("Denúncia enviada. Acompanhe a análise em Minhas denúncias.");
      setReason("");
      switchTab("minhas");
      setReload((x) => x + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const labels = {
    ARQUIVAR: "Arquivada sem sanção",
    REMOVER_PUBLICACAO: "Publicação removida",
    BLOQUEAR_USUARIO: "Usuário bloqueado",
  };
  return (
    <div className="reports-page">
      <header>
        <Link className="reports-brand" to="/usuario/home">
          Onde<span>Tá</span>
        </Link>
        <Link to="/usuario/home">← Voltar ao início</Link>
      </header>
      <main>
        <span className="reports-eyebrow">PORTAL DO USUÁRIO</span>
        <h1>Denúncias</h1>
        <p>
          Informe um problema em uma publicação ou com seu autor e acompanhe o
          parecer da equipe.
        </p>
        <nav aria-label="Navegação de denúncias">
          <button
            className={tab === "minhas" ? "active" : ""}
            onClick={() => switchTab("minhas")}
          >
            Minhas denúncias
          </button>
          <button
            className={tab === "nova" ? "active" : ""}
            onClick={() => switchTab("nova")}
          >
            Nova denúncia
          </button>
        </nav>
        {notice && (
          <p role="status" className="reports-notice">
            {notice}
          </p>
        )}
        {error && (
          <div role="alert" className="reports-error">
            {error}{" "}
            <button onClick={() => setReload((x) => x + 1)}>
              Tentar novamente
            </button>
          </div>
        )}
        {loading && <p role="status">Carregando...</p>}
        {!loading && !target && tab === "nova" && (
          <>
            <form
              className="reports-search"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchDraft.trim());
                setPage(1);
              }}
            >
              <input
                aria-label="Buscar publicação"
                placeholder="Buscar publicação de item perdido"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
              <button>Buscar</button>
            </form>
            <p>
              Selecione uma publicação para denunciar o conteúdo ou seu autor.
              Objetos encontrados e detalhes reservados não são exibidos.
            </p>
          </>
        )}
        {!loading && !error && !target && (
          <section className="reports-card">
            {data?.items.map((row) => (
              <article key={row.id}>
                <div>
                  <h2>
                    {tab === "minhas"
                      ? row.is_resolved
                        ? labels[row.resolution_action] || "Analisada"
                        : "Pendente de análise"
                      : row.title}
                  </h2>
                  <p>{tab === "minhas" ? row.reason : row.description}</p>
                  {tab === "minhas" ? (
                    <>
                      <small>
                        Enviada em{" "}
                        {new Date(row.created_at).toLocaleString("pt-BR")}
                      </small>
                      {row.is_resolved && (
                        <p>
                          <strong>Parecer:</strong>{" "}
                          {row.resolution_notes || "Concluída pela equipe."}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <small>
                        {row.location_name} · Autor: {row.user_name}
                      </small>
                      <button
                        onClick={() => {
                          setTarget(row);
                          setKind("publicacao");
                          setReason("");
                          setNotice("");
                        }}
                      >
                        Ver e denunciar
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
            {!data?.items.length && (
              <p>
                {tab === "minhas"
                  ? "Você ainda não enviou denúncias."
                  : "Nenhuma publicação disponível para esta busca."}
              </p>
            )}
          </section>
        )}
        {target && (
          <section className="reports-card">
            <button
              className="secondary"
              onClick={() => {
                setTarget(null);
                setConfirmation(false);
              }}
            >
              ← Voltar às publicações
            </button>
            <h2>{target.title}</h2>
            <p>{target.description}</p>
            <p>Autor: {target.user_name}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmation(true);
              }}
            >
              <label>
                O que deseja denunciar?
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="publicacao">Esta publicação</option>
                  <option value="usuario">O autor desta publicação</option>
                </select>
              </label>
              <label>
                Descreva o motivo
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="reports-actions">
                <button disabled={busy || reason.trim().length < 10}>
                  Enviar denúncia
                </button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setTarget(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}
        {!target && !loading && (
          <div className="reports-actions">
            <button disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>
              Anterior
            </button>
            <span>
              Página {page} · {data?.total || 0} registros
            </span>
            <button
              disabled={page * 20 >= (data?.total || 0)}
              onClick={() => setPage((x) => x + 1)}
            >
              Próxima
            </button>
          </div>
        )}
        {confirmation && (
          <div className="reports-overlay">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-confirm"
              className="reports-card"
            >
              <h2 id="report-confirm">Confirmar denúncia</h2>
              <p>
                Alvo: {kind === "publicacao" ? target.title : target.user_name}
              </p>
              <p>{reason}</p>
              {error && <p role="alert">{error}</p>}
              <div className="reports-actions">
                <button autoFocus disabled={busy} onClick={submit}>
                  {busy ? "Enviando..." : "Confirmar envio"}
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setConfirmation(false)}
                >
                  Voltar e revisar
                </button>
              </div>
            </section>
          </div>
        )}
        <footer>
          <Link to="/usuario/home">Voltar ao início</Link>
          <Link to="/usuario/meus-itens">Meus itens</Link>
        </footer>
      </main>
    </div>
  );
}
