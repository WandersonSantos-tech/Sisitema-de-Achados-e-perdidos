import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { claimService } from "../../../services/claimService";
import { authService } from "../../../services/authService";
import { itemService } from "../../../services/itemService";
import { adminService } from "../../../services/adminService";

import "./AdminPage.css";
import AdminManagement from "../AdminManagement/AdminManagement";
import ClaimChat from "../../../components/ClaimChat";

const imageUrl = (path) => {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api/v1"
  )
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/$/, "");

  return `${base}/${String(path).replace(/^\/+/, "")}`;
};


const sections = [
  ["dashboard", "Visão geral"],
  ["objetos", "Objetos"],
  ["publicacoes", "Publicações"],
  ["correspondencias", "Correspondências"],
  ["solicitacoes", "Solicitações"],
  ["usuarios", "Usuários"],
  ["categorias", "Categorias"],
];

const date = (value) =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "—";

const statusLabel = (value) => (value || "").replaceAll("_", " ");

export default function AdminPage() {
  const { secao = "dashboard" } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getUsuario();
  const roleLabel = currentUser?.role === "ADMIN" ? "Administrador" : "Funcionário";

  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState(null);
  const [matchesError, setMatchesError] = useState("");
  const [manualFoundId, setManualFoundId] = useState("");
  const [manualLostId, setManualLostId] = useState("");
  const [manualItems, setManualItems] = useState([]);
  const [manualVisible, setManualVisible] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualLostItems, setManualLostItems] = useState([]);
  const [manualSearch, setManualSearch] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    location_name: "",
    event_date: "",
    secret_details: "",
  });

  const [busy, setBusy] = useState(false);
  const [chatClaimId, setChatClaimId] = useState(null);

  const load = useCallback(async () => {
    if (
      [
        "usuarios",
        "publicacoes",
        "categorias",
        "dashboard",
      ].includes(secao)
    ) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setData(null);

    try {
      const loaders = {
        dashboard: adminService.stats,

        objetos: () =>
          adminService.items({
            origin: "user",
            page,
            page_size: 100,
            ...(filter ? { item_type: filter } : {}),
            ...(search ? { search } : {}),
          }),

        correspondencias: () =>
          adminService.items({
            page,
            item_type: "ENCONTRADO",
            page_size: 100,
          }),

        solicitacoes: () => adminService.claims({ page, page_size: 20 }),

        usuarios: () =>
          adminService.users({
            page_size: 100,
            ...(search ? { search } : {}),
          }),

        categorias: adminService.categories,
      };

      setData(await (loaders[secao] || loaders.dashboard)());

      if (secao === "objetos" || secao === "categorias") {
        setCategories(await adminService.categories());
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [secao, filter, search, page]);

  useEffect(() => {
    load();
    setSelected(null);
    setMatches(null);
    setMatchesError("");
    setMessage("");
  }, [load]);
async function loadManualLostItems() {
  setManualOpen(true);
  setManualLoading(true);
  setMatchesError("");

  try {
    const result = await adminService.items({
      item_type: "PERDIDO",
      page_size: 100,
    });

    setManualLostItems(
      (result.items || []).filter(
        (item) =>
          item.type === "PERDIDO" &&
          item.status === "PERDIDO"
      )
    );
  } catch (e) {
    setMatchesError(e.message);
  } finally {
    setManualLoading(false);
  }
}
async function openManualMatch() {
  setManualVisible(true);
  setManualLoading(true);
  setError("");

  try {
    const [found, lost] = await Promise.all([
      adminService.items({
        item_type: "ENCONTRADO",
        page_size: 100,
      }),
      adminService.items({
        item_type: "PERDIDO",
        page_size: 100,
      }),
    ]);

    setManualItems([
      ...(found.items || []),
      ...(lost.items || []),
    ]);
  } catch (e) {
    setError(e.message);
  } finally {
    setManualLoading(false);
  }
}
  async function action(fn, success) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await fn();
      setMessage(success);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    authService.logout();
    navigate("/login");
  }

  const title = sections.find(([key]) => key === secao)?.[1] || "Visão geral";

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">AP</span>

          <div>
            Onde<span>Tá</span>
            <small>Painel do {roleLabel}</small>
          </div>
        </div>

        <nav aria-label="Navegação administrativa">
          {sections.map(([key, label]) => (
            <NavLink
              key={key}
              to={`/funcionario/${key}`}
              className={({ isActive }) =>
                isActive ? "admin-link active" : "admin-link"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="admin-logout" onClick={logout}>
          Sair da conta
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-eyebrow">PAINEL DO {roleLabel.toUpperCase()}</span>

            <h1>{title}</h1>

            <p>Gerencie objetos e solicitações do OndeTá.</p>
          </div>

          <div className="admin-user">
            {currentUser?.name} — {roleLabel}
          </div>
        </header>

        {error && (
          <div role="alert" className="admin-alert error">
            {error}
          </div>
        )}

        {message && (
          <div role="status" className="admin-alert success">
            {message}
          </div>
        )}

        {[
          "usuarios",
          "publicacoes",
          "categorias",
          "dashboard",
        ].includes(secao) ? (
          <AdminManagement key={secao} section={secao} />
        ) : loading ? (
          <p className="admin-empty">Carregando informações...</p>
        ) : (
          <>
            {secao === "objetos" && (
              <>
                <section className="admin-card">
                  <h2>Cadastrar objeto encontrado</h2>

                  <form
                    className="admin-form"
                    onSubmit={(e) => {
                      e.preventDefault();

                      action(
                        () =>
                          itemService.criarItemEncontrado({
                            ...form,
                            category_id: Number(form.category_id),
                            event_date: new Date(form.event_date).toISOString(),
                            secret_details: form.secret_details || null,
                          }),
                        "Objeto encontrado cadastrado.",
                      );
                    }}
                  >
                    <label>
                      Categoria
                      <select
                        required
                        value={form.category_id}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            category_id: e.target.value,
                          })
                        }
                      >
                        <option value="">Selecione</option>

                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Nome do objeto
                      <input
                        required
                        minLength={3}
                        maxLength={150}
                        value={form.title}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            title: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Local onde foi encontrado
                      <input
                        required
                        value={form.location_name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            location_name: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Data e hora
                      <input
                        required
                        type="datetime-local"
                        value={form.event_date}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            event_date: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="wide">
                      Descrição
                      <textarea
                        required
                        minLength={10}
                        value={form.description}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            description: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="wide">
                      Detalhes reservados (não exibir publicamente)
                      <textarea
                        value={form.secret_details}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            secret_details: e.target.value,
                          })
                        }
                      />
                    </label>

                    <button disabled={busy}>Cadastrar objeto</button>
                  </form>
                </section>

                <div className="admin-toolbar">
                  <input
                    placeholder="Buscar por nome ou local"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="">Todos os tipos</option>

                    <option value="PERDIDO">Perdidos</option>

                    <option value="ENCONTRADO">Encontrados</option>
                  </select>
                </div>


                
                <section className="admin-card">
                  <button
                    type="button"
                    onClick={() => {
                      if (manualVisible) {
                        setManualVisible(false);
                      } else {
                        openManualMatch();
                      }
                    }}
                  >
                    {manualVisible
                      ? "Fechar correspondência manual"
                      : "Mandar correspondência manual"}
                  </button>

                  {manualVisible && (
                    <div className="admin-form" style={{ marginTop: 20 }}>
                      <label>
                        Objeto encontrado
                        <select
                          value={manualFoundId}
                          onChange={(e) => setManualFoundId(e.target.value)}
                        >
                          <option value="">Selecione um objeto encontrado</option>
                          {manualItems
                            .filter(
                              (item) =>
                                item.type === "ENCONTRADO" &&
                                item.status === "ENCONTRADO"
                            )
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.title} — {item.location_name}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label>
                        Objeto perdido
                        <select
                          value={manualLostId}
                          onChange={(e) => setManualLostId(e.target.value)}
                        >
                          <option value="">Selecione um objeto perdido</option>
                          {manualItems
                            .filter(
                              (item) =>
                                item.type === "PERDIDO" &&
                                item.status === "PERDIDO"
                            )
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.title} — {item.location_name}
                              </option>
                            ))}
                        </select>
                      </label>

                      <div className="admin-actions">
                        <button
                          type="button"
                          disabled={
                            busy ||
                            manualLoading ||
                            !manualFoundId ||
                            !manualLostId
                          }
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "Deseja encaminhar esta correspondência ao usuário?"
                              )
                            ) {
                              return;
                            }

                            await action(
                              () =>
                                adminService.sendMatch(
                                  manualFoundId,
                                  manualLostId
                                ),
                              "Correspondência manual enviada ao usuário."
                            );
                          }}
                        >
                          Enviar correspondência
                        </button>
                      </div>

                      {manualLoading && <p>Carregando objetos...</p>}
                    </div>
                  )}
                </section>

                                

                <ItemTable
                  items={data?.items}
                  onSelect={(item) => {
                    navigate(`/funcionario/publicacoes?id=${encodeURIComponent(item.id)}`);
                  }}
                />

                </>
                )}

                {secao === "correspondencias" && (
                  <>
                    <p className="admin-hint">
                      <NavLink to="/funcionario/solicitacoes">
                        Abrir solicitações e conversas
                      </NavLink>
                    </p>

                    <p className="admin-hint">
                      Selecione um objeto encontrado para analisar as sugestões. O
                      envio ao usuário depende da sua confirmação.
                    </p>

                    <ItemTable
                      items={data?.items}
                      onSelect={async (item) => {
                        setSelected(item);
                        setMatches(null);
                        setMatchesError("");
                        setError("");

                        try {
                          setMatches(await adminService.matches(item.id));
                        } catch (e) {
                          setMatchesError(
                            "Não foi possível carregar as sugestões."
                          );
                          setError(e.message);
                        }
                      }}
                    />


                {selected && (
                  <section className="admin-card">
                    <button
                      className="secondary"
                      onClick={() => {
                        setSelected(null);
                        setMatches(null);
                      }}
                    >
                      Voltar à lista
                    </button>
                    <h2>Sugestões para {selected.title}</h2>
                    
                    <div className="admin-card">
                      <h3>Correspondência manual</h3>

                      <p className="admin-hint">
                        Selecione qualquer objeto perdido para encaminhar
                        uma possível correspondência, mesmo que o sistema
                        não tenha sugerido automaticamente.
                      </p>

                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          if (manualOpen) {
                            setManualOpen(false);
                          } else {
                            loadManualLostItems();
                          }
                        }}
                      >
                        {manualOpen
                          ? "Fechar correspondência manual"
                          : "Criar correspondência manual"}
                      </button>

                      {manualOpen && (
                        <div style={{ marginTop: 20 }}>
                          <input
                            type="text"
                            placeholder="Pesquisar objeto perdido..."
                            value={manualSearch}
                            onChange={(e) => setManualSearch(e.target.value)}
                          />

                          {manualLoading ? (
                            <p>Carregando objetos perdidos...</p>
                          ) : (
                            manualLostItems
                              .filter((item) =>
                                `${item.title} ${item.location_name || ""}`
                                  .toLowerCase()
                                  .includes(manualSearch.toLowerCase())
                              )
                              .map((item) => (
                                <div className="admin-row" key={item.id}>
                                  <div>
                                    <b>{item.title}</b>
                                    <p>{item.location_name}</p>
                                    <small>
                                      {statusLabel(item.status)}
                                    </small>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                      if (
                                        !window.confirm(
                                          `Enviar correspondência entre "${selected.title}" e "${item.title}"?`
                                        )
                                      ) {
                                        return;
                                      }

                                      action(
                                        () =>
                                          adminService.sendMatch(
                                            selected.id,
                                            item.id
                                          ),
                                        "Correspondência manual encaminhada ao usuário."
                                      );
                                    }}
                                  >
                                    Enviar correspondência
                                  </button>
                                </div>
                              ))
                          )}

                          {!manualLoading && manualLostItems.length === 0 && (
                            <p>Nenhum objeto perdido disponível.</p>
                          )}
                        </div>
                      )}
                    </div>


                    {matchesError ? (
                      <p role="alert">{matchesError}</p>
                    ) : matches ? (
                      matches.items.length ? (
                        matches.items.map((m) => (
                          <div className="admin-row" key={m.matched_item_id}>
                            <div>
                              <b>{m.matched_item_title}</b>

                              <p>{m.matched_item_description}</p>

                              <small>
                                Similaridade: {m.similarity_score.toFixed(1)}% ·{" "}
                                {m.matched_item_location_name}
                              </small>
                            </div>

                            <button
                              disabled={busy}
                              onClick={() =>
                                action(
                                  () =>
                                    adminService.sendMatch(
                                      selected.id,
                                      m.matched_item_id,
                                    ),
                                  "Correspondência encaminhada ao usuário.",
                                )
                              }
                            >
                              Encaminhar
                            </button>
                          </div>
                        ))
                      ) : (
                        <p>Não há sugestões para este objeto.</p>
                      )
                    ) : (
                      <p>Carregando sugestões...</p>
                    )}
                  </section>
                )}
              </>
            )}

            {secao === "solicitacoes" && (
              <List
                rows={data?.items}
                render={(c) => (
                  <div className="admin-row" key={c.id}>
                    <div>
                      <b>{c.item?.title}</b>

                      <p>
                        {c.requester?.name} · {c.requester?.email}
                      </p>

                      <p>{c.proof_description}</p>
                      {c.status === "CORRESPONDENCIA" && <p>Aguardando confirmação de propriedade pelo usuário.</p>}

                      <small>
                        {statusLabel(c.status)} · {date(c.created_at)}
                      </small>
                    </div>


                    <button
                      type="button"
                      className="secondary"
                      disabled={c.status === "REJEITADA"}
                      onClick={async () => {
                        if (chatClaimId === c.id) {
                          setChatClaimId(null);
                          return;
                        }

                        try {
                          setBusy(true);
                          setError("");

                          await claimService.startNegotiation(c.id);

                          setChatClaimId(c.id);
                        } catch (err) {
                          setError(
                            err.message || "Não foi possível iniciar a negociação."
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {chatClaimId === c.id ? "Fechar conversa" : "Abrir conversa"}
                    </button>

                    {chatClaimId === c.id && (
                      <ClaimChat
                      itemId={c.item_id}
                      interlocutorId={c.requester_id}
                      interlocutorNome={c.requester?.name}
                      nomeObjeto={c.item?.title || "Objeto"}
                      claimId={c.id}
                      pickupAt={c.pickup_at}
                      onReturned={load}
                      permitirDevolucao={c.status !== "REJEITADA" &&!c.returned_at}
                    />
                    )}

                    {c.status === "PENDENTE" && (
                      <div className="admin-actions">
                        <button
                          disabled={busy}
                          onClick={() =>
                            action(
                              () => adminService.claimStatus(c.id, "APROVADA"),
                              "Solicitação aprovada.",
                            )
                          }
                        >
                          Aprovar
                        </button>

                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            action(
                              () => adminService.claimStatus(c.id, "REJEITADA"),
                              "Solicitação rejeitada.",
                            )
                          }
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              />
            )}
          </>
        )}
        {["objetos", "correspondencias", "solicitacoes"].includes(secao) && data && (
          <div className="admin-actions">
            <button disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
            <span>Página {page}</span>
            <button disabled={loading || page * data.page_size >= data.total} onClick={() => setPage(page + 1)}>Próxima</button>
          </div>
        )}
        <footer className="admin-footer-links">
          <NavLink to="/funcionario/dashboard">← Voltar à visão geral</NavLink>
          <NavLink
            to={`/funcionario/${sections[(sections.findIndex(([key]) => key === secao) + 1) % sections.length][0]}`}
          >
            Próxima seção →
          </NavLink>
        </footer>
      </main>
    </div>
  );
}

function List({ rows, render }) {
  return (
    <section className="admin-card">
      {rows?.length ? (
        rows.map(render)
      ) : (
        <p className="admin-empty">Nenhum registro encontrado.</p>
      )}
    </section>
  );
}



function ItemTable({ items, onSelect }) {
  return (
    <List
      rows={items}
      render={(item) => {
        const foto = item.images?.[0];
        const url = imageUrl(foto?.image_url || foto?.url);

        return (
          <div className="admin-row" key={item.id}>
            <div className="admin-item-summary">
              <div className="admin-item-thumbnail">
                {url ? (
                  <img
                    src={url}
                    alt={`Foto de ${item.title}`}
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

              <div className="admin-item-info">
                <b>{item.title}</b>
                <p>
                  {item.location_name} · {date(item.event_date)}
                </p>
                <small>
                  {statusLabel(item.type)} ·{" "}
                  {statusLabel(item.status)}
                </small>
              </div>
            </div>

            <button
              className="secondary"
              onClick={() => onSelect(item)}
            >
              Ver detalhes
            </button>
          </div>
        );
      }}
    />
  );
}
