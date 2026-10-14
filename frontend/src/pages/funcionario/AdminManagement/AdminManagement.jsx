import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminService } from "../../../services/adminService";
import { moderationService as api } from "../../../services/moderationService";
import { authService } from "../../../services/authService";
import "./AdminManagement.css";

const day = (value) => (value ? new Date(value).toLocaleString("pt-BR") : "—");
const decisionLabels = {
  ARQUIVAR: "Arquivada sem sanção",
  REMOVER_PUBLICACAO: "Publicação removida",
  BLOQUEAR_USUARIO: "Usuário bloqueado",
};
const emptyCategory = { name: "", description: "" };

const getImageUrl = (photo) => {
  const caminho = photo?.image_url || photo?.url;
  if (!caminho) return "";

  if (/^https?:\/\//i.test(caminho)) {
    return caminho;
  }

  const base = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api/v1"
  )
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/$/, "");

  return `${base}/${caminho.replace(/^\//, "")}`;
};


export default function AdminManagement({ section }) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const search = params.get("search") || "";
  const filter = params.get("filter") || "";
  const id = params.get("id");
  const [draftSearch, setDraftSearch] = useState(search);
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState("ARQUIVAR");
  const [loadFailed, setLoadFailed] = useState(false);

  function change(values) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value === "" || value == null) next.delete(key);
      else next.set(key, value);
    }
    setParams(next);
  }
  useEffect(() => {
    setDraftSearch(search);
  }, [search]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadFailed(false);
    setError("");
    setDetail(null);
    const loaders = {
      usuarios: () =>
        id
          ? api.user(id)
          : api.users({ page, page_size: 20, search, active: filter }),
      publicacoes: () =>
        id
          ? api.publication(id)
          : api.publications({
              page,
              page_size: 20,
              search,
              status_filter: filter,
            }),
      denuncias: () =>
        id
          ? api.report(id)
          : api.reports({ page, page_size: 20, search, resolved: filter }),
      categorias: adminService.categories,
      dashboard: adminService.stats,
    };
    loaders[section]()
      .then((result) => {
        if (!live) return;
        if (id && section !== "dashboard" && section !== "categorias")
          setDetail(result);
        else setData(result);
      })
        .catch((e) => {
          if (live) {
            setLoadFailed(true);
            setError(e.message);
          }
        })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [section, page, search, filter, id, reload]);

  async function perform(task, message, after = () => {}) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
      setNotice(message);
      setConfirm(null);
      setReason("");
      after();
      setReload((x) => x + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function ask(text, task, needsReason = false) {
    if (needsReason) setReason("");
    setConfirm({ text, task, needsReason });
  }
  const categoryRows = Array.isArray(data)
    ? data.filter((x) =>
        `${x.name} ${x.description || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : [];
  const rows = data?.items || [];
  const filterOptions =
    section === "usuarios"
      ? [
          ["true", "Ativos"],
          ["false", "Bloqueados"],
        ]
      : section === "denuncias"
        ? [
            ["false", "Pendentes"],
            ["true", "Analisadas"],
          ]
        : [
            ["PERDIDO", "Perdidos"],
            ["ENCONTRADO", "Encontrados"],
            ["EM_NEGOCIACAO", "Em negociação"],
            ["DEVOLVIDO", "Devolvidos"],
            ["CANCELADO", "Removidos / cancelados"],
          ];
  return (
    <>
      {error && (
        <div role="alert" className="admin-alert error">
          {error}{" "}
          <button className="secondary" onClick={() => setReload((x) => x + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="admin-alert success">
          {notice}
        </div>
      )}
      {section !== "dashboard" && !id && (
        <form
          className="admin-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            change({ search: draftSearch.trim(), page: 1 });
          }}
        >
          <input
            aria-label="Buscar registros"
            placeholder="Buscar registros"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
          />
          <button>Buscar</button>
          {section !== "categorias" && (
            <select
              aria-label="Filtrar situação"
              value={filter}
              onChange={(e) => change({ filter: e.target.value, page: 1 })}
            >
              <option value="">Todas as situações</option>
              {filterOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
          {section === "categorias" && (
            <button
              type="button"
              onClick={() => {
                setForm({ ...emptyCategory });
                setError("");
              }}
            >
              Nova categoria
            </button>
          )}
        </form>
      )}
      {id && !detail && (
        <button className="secondary" onClick={() => change({ id: null })}>
          ← Voltar à lista
        </button>
      )}
      {loading && <p role="status">Carregando informações...</p>}
      {!loading && !loadFailed && section === "dashboard" && data && (
        <>
          <div className="admin-metrics">
            {[
              ["Usuários", data.total_users],
              ["Usuários bloqueados", data.blocked_users],
              ["Itens ativos", data.total_active_items],
              ["Itens devolvidos", data.total_returned_items],
              ["Removidos / cancelados", data.removed_items],
              ["Taxa de devolução", `${data.return_success_rate}%`],
              ["Denúncias pendentes", data.pending_reports],
              ["Denúncias analisadas", data.resolved_reports],
            ].map(([label, value]) => (
              <div className="admin-card metric" key={label}>
                <span>{label}</span>
                <strong>{value ?? 0}</strong>
              </div>
            ))}
          </div>
          <div className="admin-columns">
            {[
              [
                "Categorias mais comuns",
                data.top_categories || [],
                "category_name",
              ],
              [
                "Locais com mais ocorrências",
                data.top_locations || [],
                "location_name",
              ],
            ].map(([title, records, key]) => (
              <section className="admin-card" key={title}>
                <h2>{title}</h2>
                {records.map((x) => (
                  <p key={x[key]}>
                    {x[key]} <b>{x.count}</b>
                  </p>
                ))}
                {!records.length && <p>Sem registros.</p>}
              </section>
            ))}
          </div>
          <button onClick={() => setReload((x) => x + 1)}>
            Atualizar estatísticas
          </button>
        </>
      )}
      {!loading && !loadFailed &&
        !id &&
        section !== "dashboard" &&
        section !== "categorias" && (
          <section className="admin-card">
            <h2>
              {section === "usuarios"
                ? "Usuários cadastrados"
                : section === "publicacoes"
                  ? "Publicações cadastradas"
                  : "Denúncias recebidas"}
            </h2>


            {rows.map((row) => (
              <article className="admin-row" key={row.id}>
                <div className="admin-item-summary">
                  {section === "publicacoes" && (
                    <div className="admin-item-thumbnail">
                      {row.images?.[0] ? (
                        <img
                          src={getImageUrl(row.images[0])}
                          alt={`Foto de ${row.title}`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement.classList.add(
                              "admin-item-no-image"
                            );
                          }}
                        />
                      ) : (
                        <span>Sem foto</span>
                      )}
                    </div>
                  )}

                  <div className="admin-item-info">
                    <b>
                      {row.name ||
                        row.title ||
                        row.reported_item?.title ||
                        row.reported_user?.name ||
                        "Denúncia"}
                    </b>

                    <p>
                      {section === "usuarios"
                        ? row.email
                        : section === "publicacoes"
                          ? row.location_name
                          : row.reason}
                    </p>

                    <small>
                      {section === "usuarios"
                        ? row.is_active
                          ? "Ativo"
                          : "Bloqueado"
                        : section === "publicacoes"
                          ? row.status.replaceAll("_", " ")
                          : row.is_resolved
                            ? decisionLabels[row.resolution_action] || "Resolvida"
                            : "Pendente"}{" "}
                      · {day(row.created_at)}
                    </small>
                  </div>
                </div>

                <button
                  className="secondary"
                  onClick={() => {
                    setNotice("");
                    change({ id: row.id });
                  }}
                >
                  {section === "denuncias"
                    ? "Analisar denúncia"
                    : "Ver detalhes"}
                </button>
              </article>
            ))}

          </section>
        )}
      {!loading && !loadFailed && detail && (
        <section className="admin-card admin-detail">
          <button className="secondary" onClick={() => change({ id: null })}>
            ← Voltar à lista
          </button>
          <h2>{detail.name || detail.title || "Análise da denúncia"}</h2>
          {section === "usuarios" && (
            <>
              <p>E-mail: {detail.email}</p>
              <p>Telefone: {detail.phone || "Não informado"}</p>
              <p>
                Perfil: {detail.role} ·{" "}
                {detail.is_active ? "Ativo" : "Bloqueado"}
              </p>
              <p>Cadastrado em: {day(detail.created_at)}</p>
              <p>Publicações: {detail.total_items}</p>
              {detail.id === authService.getUsuario()?.id ? (
                <p>Você não pode bloquear a própria conta.</p>
              ) : (
                <button
                  disabled={busy}
                  onClick={() =>
                    ask(
                      `${detail.is_active ? "Bloquear" : "Desbloquear"} o acesso de ${detail.name}?`,
                      () =>
                        perform(
                          () =>
                            adminService.userStatus(
                              detail.id,
                              !detail.is_active,
                            ),
                          "Situação do usuário atualizada.",
                        ),
                    )
                  }
                >
                  {detail.is_active
                    ? "Bloquear usuário"
                    : "Desbloquear usuário"}
                </button>
              )}
            </>
          )}
          {section === "publicacoes" && (
            <>
              <p>{detail.description}</p>
              
              <div className="admin-photos-section">
                <h3>
                  Fotos do objeto ({detail.images?.length || 0})
                </h3>

                {detail.images?.length ? (
                  <div className="admin-photos-gallery">
                    {detail.images.map((photo, index) => (
                      <a
                        key={photo.id || index}
                        href={getImageUrl(photo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ampliar imagem"
                      >
                        <img
                          src={getImageUrl(photo)}
                          alt={`${detail.title} - Foto ${index + 1}`}
                          loading="lazy"
                        />
                        <span>Foto {index + 1} · Ampliar</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="admin-no-photos">
                    Nenhuma foto cadastrada para este objeto.
                  </div>
                )}
              </div>

              <p>Categoria: {detail.category?.name || "—"}</p>
              <p>Local: {detail.location_name}</p>
              <p>Situação: {detail.status}</p>
              <p>Data do registro: {day(detail.created_at)}</p>
              <Link
                className="management-link"
                to={`/funcionario/usuarios?id=${detail.user_id}`}
              >
                Ver autor da publicação
              </Link>
              {detail.status !== "CANCELADO" && (
                <button
                  disabled={busy}
                  onClick={() =>
                    ask(
                      `Remover a publicação “${detail.title}”? O registro ficará cancelado e será mantido no histórico.`,
                      (reasonValue) =>
                        perform(
                          () => api.remove(detail.id, reasonValue),
                          "Publicação removida.",
                        ),
                      true,
                    )
                  }
                >
                  Remover publicação
                </button>
              )}
            </>
          )}
          {section === "denuncias" && (
            <>
              <p>
                <strong>Motivo:</strong> {detail.reason}
              </p>
              <p>Recebida em: {day(detail.created_at)}</p>
              <p>
                Denunciante: {detail.reporter?.name || "Usuário indisponível"}
              </p>
              <p>Situação: {detail.is_resolved ? "Analisada" : "Pendente"}</p>
              {detail.reported_item_id && (
                <Link
                  className="management-link"
                  to={`/funcionario/publicacoes?id=${detail.reported_item_id}`}
                >
                  Ver publicação denunciada
                </Link>
              )}
              {(detail.reported_user_id || detail.reported_item) && (
                <Link
                  className="management-link"
                  to={`/funcionario/usuarios?id=${detail.reported_user_id || detail.reported_item?.user_id || ""}`}
                >
                  {detail.reported_user_id
                    ? "Ver usuário denunciado"
                    : "Ver autor da publicação denunciada"}
                </Link>
              )}
              {detail.is_resolved ? (
                <>
                  <p>
                    Decisão:{" "}
                    {decisionLabels[detail.resolution_action] || "Resolvida"}
                  </p>
                  <p>
                    Parecer:{" "}
                    {detail.resolution_notes ||
                      "Sem parecer registrado anteriormente."}
                  </p>
                  <p>Analisada em: {day(detail.resolved_at)}</p>
                </>
              ) : (
                <form
                  className="admin-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask("Confirmar a decisão desta denúncia?", () =>
                      perform(
                        () => api.decide(detail.id, decision, reason.trim()),
                        "Parecer salvo e denúncia concluída.",
                      ),
                    );
                  }}
                >
                  <label className="wide">
                    Decisão
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                    >
                      <option value="ARQUIVAR">Arquivar sem sanção</option>
                      {detail.reported_item_id && (
                        <option value="REMOVER_PUBLICACAO">
                          Remover publicação
                        </option>
                      )}
                      {(detail.reported_user_id || detail.reported_item_id) && (
                        <option value="BLOQUEAR_USUARIO">
                          Bloquear usuário denunciado / autor
                        </option>
                      )}
                    </select>
                  </label>
                  <label className="wide">
                    Parecer da análise
                    <textarea
                      required
                      minLength={10}
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <button disabled={busy || reason.trim().length < 10}>
                    Concluir análise
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => change({ id: null })}
                  >
                    Cancelar e voltar
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}
      {!loading && !loadFailed && section === "categorias" && (
        <>
          <section className="admin-card">
            <h2>Categorias cadastradas</h2>
            {categoryRows.map((row) => (
              <article className="admin-row" key={row.id}>
                <div>
                  <b>{row.name}</b>
                  <p>{row.description || "Sem descrição"}</p>
                </div>
                <div className="admin-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      setForm({ ...row, description: row.description || "" })
                    }
                  >
                    Editar
                  </button>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      ask(
                        `Excluir a categoria “${row.name}”? Categorias utilizadas por objetos não podem ser excluídas.`,
                        () =>
                          perform(
                            () => adminService.deleteCategory(row.id),
                            "Categoria excluída.",
                          ),
                      )
                    }
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
            {!categoryRows.length && <p>Nenhuma categoria encontrada.</p>}
          </section>
          {form && (
            <section className="admin-card">
              <h2>{form.id ? "Editar categoria" : "Nova categoria"}</h2>
              <form
                className="admin-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const payload = {
                    name: form.name.trim(),
                    description: form.description.trim(),
                  };
                  perform(
                    () =>
                      form.id
                        ? adminService.updateCategory(form.id, payload)
                        : adminService.createCategory(payload),
                    "Categoria salva.",
                    () => setForm(null),
                  );
                }}
              >
                <label>
                  Nome
                  <input
                    required
                    minLength={3}
                    maxLength={80}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Descrição
                  <input
                    maxLength={500}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </label>
                <div className="admin-actions">
                  <button disabled={busy || form.name.trim().length < 3}>
                    Salvar categoria
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => setForm(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          )}
        </>
      )}
      {!id &&
        !loading && !loadFailed &&
        section !== "dashboard" &&
        section !== "categorias" && (
          <div className="management-pagination">
            <button
              className="secondary"
              disabled={page <= 1}
              onClick={() => change({ page: page - 1 })}
            >
              Anterior
            </button>
            <span>
              Página {page} de {Math.max(1, Math.ceil((data?.total || 0) / 20))}{" "}
              · {data?.total || 0} registros
            </span>
            <button
              className="secondary"
              disabled={page * 20 >= (data?.total || 0)}
              onClick={() => change({ page: page + 1 })}
            >
              Próxima
            </button>
          </div>
        )}
      {confirm && (
        <div className="management-overlay">
          <section
            className="admin-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="management-confirm"
          >
            <h2 id="management-confirm">Confirmar operação</h2>
            <p>{confirm.text}</p>
            {confirm.needsReason && (
              <label>
                Motivo da remoção
                <textarea
                  aria-label="Motivo da remoção"
                  minLength={10}
                  maxLength={255}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            )}
            {error && <p role="alert">{error}</p>}
            <div className="admin-actions">
              <button
                autoFocus
                disabled={
                  busy || (confirm.needsReason && reason.trim().length < 10)
                }
                onClick={() => confirm.task(reason.trim())}
              >
                {busy ? "Salvando..." : "Confirmar"}
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setConfirm(null);
                  if (confirm.needsReason) setReason("");
                }}
              >
                Cancelar
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
