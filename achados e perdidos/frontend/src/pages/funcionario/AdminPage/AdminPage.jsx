import { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';

import { authService } from '../../../services/authService';
import { itemService } from '../../../services/itemService';
import { adminService } from '../../../services/adminService';

import './AdminPage.css';

const sections = [
  ['dashboard', 'Visão geral'],
  ['objetos', 'Objetos'],
  ['correspondencias', 'Correspondências'],
  ['solicitacoes', 'Solicitações'],
  ['usuarios', 'Usuários'],
  ['categorias', 'Categorias'],
  ['denuncias', 'Denúncias'],
];

const date = (value) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : '—';

const statusLabel = (value) => (value || '').replaceAll('_', ' ');

export default function AdminPage() {
  const { secao = 'dashboard' } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState(null);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    category_id: '',
    title: '',
    description: '',
    location_name: '',
    event_date: '',
    secret_details: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: '',
    description: '',
  });

  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const loaders = {
        dashboard: adminService.stats,

        objetos: () =>
          adminService.items({
            page_size: 100,
            ...(filter ? { item_type: filter } : {}),
            ...(search ? { search } : {}),
          }),

        correspondencias: () =>
          adminService.items({
            item_type: 'ENCONTRADO',
            page_size: 100,
          }),

        solicitacoes: adminService.claims,

        usuarios: () =>
          adminService.users({
            page_size: 100,
            ...(search ? { search } : {}),
          }),

        categorias: adminService.categories,
        denuncias: adminService.reports,
      };

      setData(await (loaders[secao] || loaders.dashboard)());

      if (secao === 'objetos' || secao === 'categorias') {
        setCategories(await adminService.categories());
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [secao, filter, search]);

  useEffect(() => {
    load();
    setSelected(null);
    setMatches(null);
    setMessage('');
  }, [load]);

  async function action(fn, success) {
    setBusy(true);
    setError('');
    setMessage('');

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
    navigate('/login');
  }

  const title =
    sections.find(([key]) => key === secao)?.[1] || 'Visão geral';

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">AP</span>

          <div>
            Onde<span>Tá</span>
            <small>Painel do funcionário</small>
          </div>
        </div>

        <nav aria-label="Navegação administrativa">
          {sections.map(([key, label]) => (
            <NavLink
              key={key}
              to={`/funcionario/${key}`}
              className={({ isActive }) =>
                isActive ? 'admin-link active' : 'admin-link'
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
            <span className="admin-eyebrow">
              PAINEL DO FUNCIONÁRIO
            </span>

            <h1>{title}</h1>

            <p>
              Gerencie objetos e solicitações do OndeTá.
            </p>
          </div>

          <div className="admin-user">
            {authService.getUsuario()?.name || 'Funcionário'}
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

        {loading ? (
          <p className="admin-empty">
            Carregando informações...
          </p>
        ) : (
          <>
            {secao === 'dashboard' && data && (
              <>
                <div className="admin-metrics">
                  {[
                    ['Usuários', data.total_users],
                    ['Itens ativos', data.total_active_items],
                    ['Itens devolvidos', data.total_returned_items],
                    [
                      'Taxa de devolução',
                      `${data.return_success_rate}%`,
                    ],
                    ['Denúncias pendentes', data.pending_reports],
                  ].map(([label, value]) => (
                    <div
                      className="admin-card metric"
                      key={label}
                    >
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div className="admin-columns">
                  <section className="admin-card">
                    <h2>Categorias mais comuns</h2>

                    {data.top_categories.length ? (
                      data.top_categories.map((x) => (
                        <p key={x.category_name}>
                          {x.category_name} <b>{x.count}</b>
                        </p>
                      ))
                    ) : (
                      <p>Sem registros.</p>
                    )}
                  </section>

                  <section className="admin-card">
                    <h2>Locais com mais ocorrências</h2>

                    {data.top_locations.length ? (
                      data.top_locations.map((x) => (
                        <p key={x.location_name}>
                          {x.location_name} <b>{x.count}</b>
                        </p>
                      ))
                    ) : (
                      <p>Sem registros.</p>
                    )}
                  </section>
                </div>
              </>
            )}

            {secao === 'objetos' && (
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
                            event_date: new Date(
                              form.event_date
                            ).toISOString(),
                            secret_details:
                              form.secret_details || null,
                          }),
                        'Objeto encontrado cadastrado.'
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
                        <option value="">
                          Selecione
                        </option>

                        {categories.map((c) => (
                          <option
                            key={c.id}
                            value={c.id}
                          >
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

                    <button disabled={busy}>
                      Cadastrar objeto
                    </button>
                  </form>
                </section>

                <div className="admin-toolbar">
                  <input
                    placeholder="Buscar por nome ou local"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />

                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(e.target.value)
                    }
                  >
                    <option value="">
                      Todos os tipos
                    </option>

                    <option value="PERDIDO">
                      Perdidos
                    </option>

                    <option value="ENCONTRADO">
                      Encontrados
                    </option>
                  </select>
                </div>

                <ItemTable
                  items={data?.items}
                  onSelect={async (item) => {
                    try {
                      setSelected(
                        await adminService.item(item.id)
                      );
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                />

                {selected && (
                  <section className="admin-card admin-detail">
                    <button
                      className="quiet"
                      onClick={() => setSelected(null)}
                    >
                      Fechar detalhes
                    </button>

                    <h2>{selected.title}</h2>

                    <p>{selected.description}</p>

                    <p>
                      <b>Local:</b>{' '}
                      {selected.location_name} ·{' '}
                      <b>Data:</b>{' '}
                      {date(selected.event_date)} ·{' '}
                      <b>Status:</b>{' '}
                      {statusLabel(selected.status)}
                    </p>

                    <p>
                      <b>Responsável:</b>{' '}
                      {selected.user_id}
                    </p>

                    <select
                      aria-label="Novo status"
                      value={selected.status}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          status: e.target.value,
                        })
                      }
                    >
                      {[
                        'PERDIDO',
                        'ENCONTRADO',
                        'EM_NEGOCIACAO',
                        'DEVOLVIDO',
                        'CANCELADO',
                      ].map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>

                    <button
                      disabled={busy}
                      onClick={() =>
                        action(
                          () =>
                            adminService.status(
                              selected.id,
                              selected.status
                            ),
                          'Status atualizado.'
                        )
                      }
                    >
                      Salvar status
                    </button>
                  </section>
                )}
              </>
            )}

            {secao === 'correspondencias' && (
              <>
                <p className="admin-hint">
                  Selecione um objeto encontrado para analisar as
                  sugestões. O envio ao usuário depende da sua
                  confirmação.
                </p>

                <ItemTable
                  items={data?.items}
                  onSelect={async (item) => {
                    setSelected(item);
                    setMatches(null);

                    try {
                      setMatches(
                        await adminService.matches(item.id)
                      );
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                />

                {selected && (
                  <section className="admin-card">
                    <h2>
                      Sugestões para {selected.title}
                    </h2>

                    {matches ? (
                      matches.items.length ? (
                        matches.items.map((m) => (
                          <div
                            className="admin-row"
                            key={m.matched_item_id}
                          >
                            <div>
                              <b>
                                {m.matched_item_title}
                              </b>

                              <p>
                                {m.matched_item_description}
                              </p>

                              <small>
                                Similaridade:{' '}
                                {m.similarity_score.toFixed(1)}
                                % ·{' '}
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
                                      m.matched_item_id
                                    ),
                                  'Correspondência encaminhada ao usuário.'
                                )
                              }
                            >
                              Encaminhar
                            </button>
                          </div>
                        ))
                      ) : (
                        <p>
                          Não há sugestões para este objeto.
                        </p>
                      )
                    ) : (
                      <p>
                        Carregando sugestões...
                      </p>
                    )}
                  </section>
                )}
              </>
            )}

            {secao === 'solicitacoes' && (
              <List
                rows={data?.items}
                render={(c) => (
                  <div
                    className="admin-row"
                    key={c.id}
                  >
                    <div>
                      <b>{c.item?.title}</b>

                      <p>
                        {c.requester?.name} ·{' '}
                        {c.requester?.email}
                      </p>

                      <p>
                        Comprovação: {c.proof_description}
                      </p>

                      <small>
                        {statusLabel(c.status)} ·{' '}
                        {date(c.created_at)}
                      </small>
                    </div>

                    {c.status === 'PENDENTE' && (
                      <div className="admin-actions">
                        <button
                          disabled={busy}
                          onClick={() =>
                            action(
                              () =>
                                adminService.claimStatus(
                                  c.id,
                                  'APROVADA'
                                ),
                              'Solicitação aprovada.'
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
                              () =>
                                adminService.claimStatus(
                                  c.id,
                                  'REJEITADA'
                                ),
                              'Solicitação rejeitada.'
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

            {secao === 'usuarios' && (
              <>
                <div className="admin-toolbar">
                  <input
                    placeholder="Buscar nome ou e-mail"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>

                <List
                  rows={data?.items}
                  render={(u) => (
                    <div
                      className="admin-row"
                      key={u.id}
                    >
                      <div>
                        <b>{u.name}</b>

                        <p>
                          {u.email} ·{' '}
                          {u.phone || 'Sem telefone'}
                        </p>

                        <small>
                          {u.role} ·{' '}
                          {u.is_active
                            ? 'Ativo'
                            : 'Inativo'}
                        </small>
                      </div>

                      <button
                        className="secondary"
                        disabled={
                          busy ||
                          u.id ===
                            authService.getUsuario()?.id
                        }
                        onClick={() =>
                          action(
                            () =>
                              adminService.userStatus(
                                u.id,
                                !u.is_active
                              ),
                            'Situação do usuário atualizada.'
                          )
                        }
                      >
                        {u.is_active
                          ? 'Desativar'
                          : 'Ativar'}
                      </button>
                    </div>
                  )}
                />
              </>
            )}

            {secao === 'categorias' && (
              <>
                <section className="admin-card">
                  <h2>
                    {categoryForm.id
                      ? 'Editar categoria'
                      : 'Nova categoria'}
                  </h2>

                  <form
                    className="admin-form"
                    onSubmit={(e) => {
                      e.preventDefault();

                      action(
                        () =>
                          categoryForm.id
                            ? adminService.updateCategory(
                                categoryForm.id,
                                {
                                  name: categoryForm.name,
                                  description:
                                    categoryForm.description,
                                }
                              )
                            : adminService.createCategory({
                                name: categoryForm.name,
                                description:
                                  categoryForm.description,
                              }),
                        'Categoria salva.'
                      );

                      setCategoryForm({
                        id: null,
                        name: '',
                        description: '',
                      });
                    }}
                  >
                    <label>
                      Nome

                      <input
                        required
                        minLength={3}
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label>
                      Descrição

                      <input
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </label>

                    <button disabled={busy}>
                      Salvar categoria
                    </button>
                  </form>
                </section>

                <List
                  rows={data}
                  render={(c) => (
                    <div
                      className="admin-row"
                      key={c.id}
                    >
                      <b>{c.name}</b>

                      <div className="admin-actions">
                        <button
                          className="secondary"
                          onClick={() =>
                            setCategoryForm({
                              id: c.id,
                              name: c.name,
                              description:
                                c.description || '',
                            })
                          }
                        >
                          Editar
                        </button>

                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Excluir a categoria ${c.name}?`
                              )
                            ) {
                              action(
                                () =>
                                  adminService.deleteCategory(
                                    c.id
                                  ),
                                'Categoria excluída.'
                              );
                            }
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                />
              </>
            )}

            {secao === 'denuncias' && (
              <List
                rows={data?.items}
                render={(r) => (
                  <div
                    className="admin-row"
                    key={r.id}
                  >
                    <div>
                      <b>
                        {r.is_resolved
                          ? 'Resolvida'
                          : 'Pendente'}
                      </b>

                      <p>{r.reason}</p>

                      <small>
                        Denunciante: {r.reporter_id} ·{' '}
                        {date(r.created_at)} · Objeto:{' '}
                        {r.reported_item_id || '—'}
                      </small>
                    </div>

                    {!r.is_resolved && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          action(
                            () =>
                              adminService.resolveReport(
                                r.id
                              ),
                            'Denúncia resolvida.'
                          )
                        }
                      >
                        Marcar resolvida
                      </button>
                    )}
                  </div>
                )}
              />
            )}
          </>
        )}
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
        <p className="admin-empty">
          Nenhum registro encontrado.
        </p>
      )}
    </section>
  );
}

function ItemTable({ items, onSelect }) {
  return (
    <List
      rows={items}
      render={(item) => (
        <div
          className="admin-row"
          key={item.id}
        >
          <div>
            <b>{item.title}</b>

            <p>
              {item.location_name} ·{' '}
              {date(item.event_date)}
            </p>

            <small>
              {statusLabel(item.type)} ·{' '}
              {statusLabel(item.status)}
            </small>
          </div>

          <button
            className="secondary"
            onClick={() => onSelect(item)}
          >
            Ver detalhes
          </button>
        </div>
      )}
    />
  );
}