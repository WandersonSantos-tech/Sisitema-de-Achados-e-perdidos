import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationService } from "../../services/notificationService";
import { authService } from "../../services/authService";
import { itemService } from "../../services/itemService";

import "./UsuarioHome.css";

/* ============================================================
 * Helpers de segurança e diagnóstico
 * ============================================================ */

const isDev = import.meta.env?.DEV ?? false;

function diag(label, data) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug(`[UsuarioHome] ${label}`, data);
  }
}

function diagError(label, error) {
  // eslint-disable-next-line no-console
  console.error(`[UsuarioHome] ${label}`, error);
}

function safeItems(response) {
  if (!response || typeof response !== "object") return [];
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response)) return response;
  return [];
}

function safeScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatarStatus(status) {
  if (!status || typeof status !== "string") return "";
  return status.replaceAll("_", " ").toUpperCase();
}

function definirStatusClass(status) {
  if (status === "DEVOLVIDO") return "success";
  if (status === "EM_NEGOCIACAO") return "match";
  return "searching";
}

/* ============================================================
 * Ícones
 * ============================================================ */

function Icon({ name, size = 22 }) {
  const icons = {
    plus: (
      <>
        <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    package: (
      <>
        <path d="M4 7l8-4 8 4v10l-8 4-8-4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M4 7l8 4 8-4M12 11v10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 3v5h5M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    arrow: (
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
    check: (
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
    match: (
      <>
        <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="m11 11 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5.1-3.4 8.7-8 10-4.6-1.3-8-4.9-8-10V6l8-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    message: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    ),
    menu: (
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
    close: (
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
  };

  const content = icons[name];
  if (!content) {
    diagError(`Icon desconhecido: "${name}"`, null);
    return null;
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {content}
    </svg>
  );
}

/* ============================================================
 * Seletor de itens
 * ============================================================ */

function MatchItemsSelector({ itens, itemAtivo, onSelect }) {
  if (!Array.isArray(itens) || itens.length === 0) return null;

  return (
    <div className="match-items-selector">
      <span className="match-selector-label">SEUS OBJETOS PERDIDOS</span>
      <div className="match-items-tabs" role="tablist" aria-label="Selecionar objeto perdido">
        {itens.map((item) => {
          const isActive = itemAtivo?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "match-item-tab active" : "match-item-tab"}
              onClick={() => onSelect(item)}
            >
              {item.titulo || "Objeto sem título"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
 * Componente principal
 * ============================================================ */

function UsuarioHome() {
  const navigate = useNavigate();
  const location = useLocation();

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const usuario = authService.getUsuario() || null;

  const [menuAberto, setMenuAberto] = useState(false);
  const [meusItens, setMeusItens] = useState([]);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [erroItens, setErroItens] = useState("");
  const [itemAtivo, setItemAtivo] = useState(null);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [atividade, setAtividade] = useState({
    itensCadastrados: 0,
    possiveisCorrespondencias: 0,
    emValidacao: 0,
    recuperados: 0,
  });
  const [matchesDoItemAtivo, setMatchesDoItemAtivo] = useState([]);
  const [carregandoMatches, setCarregandoMatches] = useState(false);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  const carregarCorrespondenciasDoItem = useCallback(async (item) => {
    if (!item || !item.id) {
      diag("carregarCorrespondenciasDoItem: item inválido", item);
      if (isMountedRef.current) setMatchesDoItemAtivo([]);
      return;
    }

    if (isMountedRef.current) setCarregandoMatches(true);
    try {
      const response = await itemService.buscarCorrespondencias(item.id);
      const correspondencias = safeItems(response);

      correspondencias.sort(
        (a, b) => safeScore(b?.similarity_score) - safeScore(a?.similarity_score)
      );

      if (isMountedRef.current) {
        setMatchesDoItemAtivo(correspondencias);
      }
      diag(`Matches para item ${item.id}`, correspondencias.length);
    } catch (error) {
      diagError(`Erro ao carregar correspondências do item ${item.id}`, error);
      if (isMountedRef.current) setMatchesDoItemAtivo([]);
    } finally {
      if (isMountedRef.current) setCarregandoMatches(false);
    }
  }, []);

  const carregarItens = useCallback(async () => {
    if (isMountedRef.current) {
      setCarregandoItens(true);
      setErroItens("");
    }

    try {
      const response = await itemService.listarItensPerdidos();
      const itensBackend = safeItems(response);

      diag("Itens recebidos", itensBackend.length);

      const matchesPorItem = new Map();
      await Promise.all(
        itensBackend.map(async (item) => {
          if (!item || !item.id) return;
          try {
            const resultado = await itemService.buscarCorrespondencias(item.id);
            matchesPorItem.set(item.id, safeItems(resultado));
          } catch (error) {
            diagError(`Erro ao buscar correspondências do item ${item.id}`, error);
            matchesPorItem.set(item.id, []);
          }
        })
      );

      const totalCorrespondencias = Array.from(matchesPorItem.values()).reduce(
        (total, lista) => total + lista.length,
        0
      );

      const emValidacao = itensBackend.filter(
        (item) => item?.status === "EM_NEGOCIACAO"
      ).length;
      const recuperados = itensBackend.filter(
        (item) => item?.status === "DEVOLVIDO"
      ).length;

      if (!isMountedRef.current) return;

      setAtividade({
        itensCadastrados: itensBackend.length,
        possiveisCorrespondencias: totalCorrespondencias,
        emValidacao,
        recuperados,
      });

      const itensFormatados = itensBackend.map((item) => ({
        id: item.id,
        categoria:
          item?.category?.name ||
          (item?.category_id != null ? `Categoria ${item.category_id}` : "Sem categoria"),
        titulo: item?.title || "Objeto sem título",
        local: item?.location_name || "Local não informado",
        data: item?.event_date
          ? new Date(item.event_date).toLocaleDateString("pt-BR")
          : "-",
        dataOriginal: item?.event_date || null,
        status: formatarStatus(item?.status),
        statusClass: definirStatusClass(item?.status),
        original: item,
      }));

      setMeusItens(itensFormatados);

      if (itensBackend.length > 0) {
        const primeiro = itensBackend[0];
        setItemAtivo(primeiro);
        setMatchesDoItemAtivo(matchesPorItem.get(primeiro.id) || []);
        setCarregandoMatches(false);
      } else {
        setItemAtivo(null);
        setMatchesDoItemAtivo([]);
      }
    } catch (error) {
      diagError("Erro ao carregar itens", error);
      if (isMountedRef.current) {
        setErroItens(error?.message || "Não foi possível carregar seus itens.");
        setMeusItens([]);
        setItemAtivo(null);
        setMatchesDoItemAtivo([]);
      }
    } finally {
      if (isMountedRef.current) setCarregandoItens(false);
    }
  }, []);

  const carregarQuantidadeNotificacoes = useCallback(async () => {
    try {
      const response = await notificationService.listar();
      const itens = safeItems(response);
      const quantidade = itens.filter((n) => n && !n.is_read).length;
      if (isMountedRef.current) setNotificacoesNaoLidas(quantidade);
    } catch (error) {
      diagError("Erro ao carregar notificações", error);
      if (isMountedRef.current) setNotificacoesNaoLidas(0);
    }
  }, []);

  useEffect(() => {
    Promise.allSettled([
      carregarItens(),
      carregarQuantidadeNotificacoes(),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          diagError(`Falha no carregamento inicial [${i}]`, r.reason);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navegar = useCallback(
    (rota) => {
      setMenuAberto(false);
      navigate(rota);
    },
    [navigate]
  );

  const irParaSecao = useCallback((id) => {
    setMenuAberto(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const sair = useCallback(() => {
    authService.logout();
    navigate("/login");
  }, [navigate]);

  const selecionarItem = useCallback(
    (item) => {
      setItemAtivo(item);
      carregarCorrespondenciasDoItem(item);
    },
    [carregarCorrespondenciasDoItem]
  );

  const matchesCount = matchesDoItemAtivo.length;
  const melhorScore = matchesCount > 0 ? safeScore(matchesDoItemAtivo[0]?.similarity_score) : 0;

  const secaoEstado =
    carregandoItens || carregandoMatches
      ? "loading"
      : itemAtivo === null
      ? "empty-itens"
      : matchesCount > 0
      ? "with-matches"
      : "no-matches";

  return (
    <div className="usuario-home">
      <header className="home-navbar">
        <button className="home-brand" onClick={() => irParaSecao("inicio")}>
          <div className="home-brand-logo">OT</div>
          <div className="home-brand-text">
            <strong>
              Onde<span>Tá</span>
            </strong>
            <small>Achados & Perdidos</small>
          </div>
        </button>

        <nav className={menuAberto ? "home-navigation open" : "home-navigation"}>
          <button className="nav-item active" onClick={() => irParaSecao("inicio")}>
            Início
          </button>
          <button className="nav-item" onClick={() => irParaSecao("meus-itens")}>
            Meus itens perdidos
          </button>
          <button className="nav-item" onClick={() => irParaSecao("correspondencias")}>
            Correspondências
          </button>
          <button className="nav-item" onClick={() => navegar("/usuario/solicitacoes")}>
            Solicitações
          </button>
          <button className="nav-item" onClick={() => navegar("/usuario/denuncias")}>
            Denúncias
          </button>
        </nav>

        <div className="navbar-actions">
          <button
            className="navbar-icon-button"
            onClick={() => navegar("/usuario/notificacoes")}
            aria-label="Notificações"
          >
            <Icon name="bell" />
            {notificacoesNaoLidas > 0 && (
              <span className="notification-dot">
                {notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas}
              </span>
            )}
          </button>

          <button className="navbar-profile" onClick={() => navegar("/usuario/perfil")}>
            <div className="profile-avatar">
              {usuario?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="profile-text">
              <strong>{usuario?.name || "Usuário"}</strong>
              <span>Minha conta</span>
            </div>
          </button>

          <button
            className="mobile-menu-button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Abrir menu"
          >
            <Icon name={menuAberto ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main className="home-main">
        <section id="inicio" className="home-hero">
          <div className="hero-decoration hero-decoration-one" />
          <div className="hero-decoration hero-decoration-two" />

          <div className="hero-content">
            <span className="hero-eyebrow">PORTAL ONDETÁ</span>
            <h1>
              Olá, <span>{usuario?.name?.split(" ")[0] || "Usuário"}</span>.
            </h1>
            <h2>
              Perdeu alguma coisa?
              <br />
              Conte para o OndeTá.
            </h2>
            <p>
              Cadastre as informações do objeto que você perdeu. O sistema compara
              seu registro com os objetos encontrados cadastrados pela equipe
              responsável e avisa quando existir uma possível correspondência.
            </p>

            <div className="hero-actions">
              <button
                className="hero-primary-button"
                onClick={() => navegar("/usuario/item-perdido")}
              >
                <Icon name="plus" size={20} />
                Registrar objeto perdido
                <Icon name="arrow" size={18} />
              </button>
              <button
                className="hero-secondary-button"
                onClick={() => irParaSecao("meus-itens")}
              >
                <Icon name="package" size={20} />
                Ver meus itens
              </button>
            </div>

            <div className="hero-security">
              <Icon name="shield" size={18} />
              <span>Os objetos encontrados não ficam expostos publicamente.</span>
            </div>
          </div>

          <div className="hero-status-card">
            <div className="status-illustration">
              <div className="status-orbit orbit-one" />
              <div className="status-orbit orbit-two" />
              <div className="status-circle">
                <Icon name="match" size={42} />
              </div>
              <div className="floating-badge floating-badge-one">
                <Icon name="package" size={17} />
                Item cadastrado
              </div>
              <div className="floating-badge floating-badge-two">
                <Icon name="check" size={17} />
                Correspondência
              </div>
            </div>
            <div className="status-card-footer">
              <span>Correspondência automática</span>
              <strong>Você cadastra. O sistema procura.</strong>
            </div>
          </div>
        </section>

        <section className="quick-actions-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">ACESSO RÁPIDO</span>
              <h2>Acompanhe seus objetos</h2>
              <p>Tudo relacionado aos seus registros fica concentrado em um só lugar.</p>
            </div>
          </div>

          <div className="quick-actions-grid">
            <button
              className="quick-action primary"
              onClick={() => navegar("/usuario/item-perdido")}
            >
              <div className="quick-action-icon">
                <Icon name="plus" />
              </div>
              <div>
                <strong>Registrar objeto perdido</strong>
                <p>Informe local, data, categoria, fotos e características do item.</p>
              </div>
              <span className="quick-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>

            <button className="quick-action" onClick={() => navegar("/usuario/meus-itens")}>
              <div className="quick-action-icon">
                <Icon name="package" />
              </div>
              <div>
                <strong>Meus itens perdidos</strong>
                <p>Consulte somente os objetos que foram cadastrados por você.</p>
              </div>
              <span className="quick-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>

            <button className="quick-action" onClick={() => navegar("/usuario/solicitacoes")}>
              <div className="quick-action-icon">
                <Icon name="history" />
              </div>
              <div>
                <strong>Minhas solicitações</strong>
                <p>Acompanhe validações, retirada e andamento das suas solicitações.</p>
              </div>
              <span className="quick-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>
          </div>
        </section>

        <section id="correspondencias" className="match-section">
          {itemAtivo && (
            <MatchItemsSelector
              itens={meusItens}
              itemAtivo={itemAtivo}
              onSelect={selecionarItem}
            />
          )}

          {secaoEstado === "loading" && (
            <div className="match-card">
              <div className="match-card-content">
                <span className="match-label">VERIFICANDO CORRESPONDÊNCIAS</span>
                <h2>Procurando possíveis combinações...</h2>
                <p>
                  O OndeTá está verificando o objeto{" "}
                  <strong>{itemAtivo?.title || "selecionado"}</strong>.
                </p>
              </div>
              <div className="match-score">
                <div className="score-ring">
                  <strong>...</strong>
                  <span>analisando</span>
                </div>
              </div>
            </div>
          )}

          {secaoEstado === "empty-itens" && (
            <div className="match-card">
              <div className="match-card-content">
                <span className="match-label">CORRESPONDÊNCIAS</span>
                <h2>Você ainda não cadastrou nenhum objeto perdido.</h2>
                <p>
                  Cadastre um objeto para que o sistema possa procurar possíveis
                  correspondências.
                </p>
                <div className="match-actions">
                  <button onClick={() => navegar("/usuario/item-perdido")}>
                    Registrar objeto perdido
                    <Icon name="arrow" size={18} />
                  </button>
                  <div className="protected-info">
                    <Icon name="shield" size={16} />
                    Monitoramento ativo
                  </div>
                </div>
              </div>
              <div className="match-score">
                <div className="score-ring">
                  <strong>
                    0<small>%</small>
                  </strong>
                  <span>no momento</span>
                </div>
                <p>Cadastre um item para iniciar o monitoramento.</p>
              </div>
            </div>
          )}

          {secaoEstado === "with-matches" && (
            <div className="match-card">
              <div className="match-card-content">
                <span className="match-label">
                  {matchesCount === 1
                    ? "NOVA CORRESPONDÊNCIA"
                    : `${matchesCount} CORRESPONDÊNCIAS ENCONTRADAS`}
                </span>
                <h2>Podemos ter encontrado algo seu.</h2>
                <p>
                  O sistema encontrou um objeto com características semelhantes ao seu
                  registro de <strong>{itemAtivo?.title || "objeto"}</strong>.
                </p>

                <div className="match-comparison">
                  <div className="match-lost-item">
                    <div className="match-object-icon">
                      <Icon name="package" size={25} />
                    </div>
                    <div>
                      <span>SEU ITEM PERDIDO</span>
                      <strong>{itemAtivo?.title || "Objeto"}</strong>
                      <p>
                        Registrado em{" "}
                        {itemAtivo?.event_date
                          ? new Date(itemAtivo.event_date).toLocaleDateString("pt-BR")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="match-connector">
                    <span />
                    <div>
                      <Icon name="match" size={20} />
                    </div>
                    <span />
                  </div>

                  <div className="match-found-item">
                    <div className="match-object-icon found">
                      <Icon name="check" size={25} />
                    </div>
                    <div>
                      <span>POSSÍVEL CORRESPONDÊNCIA</span>
                      <strong>Objeto compatível</strong>
                      <p>Detalhes protegidos até a validação</p>
                    </div>
                  </div>
                </div>

                <div className="match-actions">
                  <button
                    onClick={() =>
                      navigate("/usuario/correspondencias", {
                        state: {
                          itemId: itemAtivo?.id,
                          itemTitle: itemAtivo?.title,
                        },
                      })
                    }
                  >
                    {matchesCount === 1
                      ? "Ver correspondência"
                      : `Ver ${matchesCount} correspondências`}
                    <Icon name="arrow" size={18} />
                  </button>
                  <div className="protected-info">
                    <Icon name="shield" size={16} />
                    Informações protegidas
                  </div>
                </div>
              </div>

              <div className="match-score">
                <div className="score-ring">
                  <strong>
                    {Math.round(melhorScore)}
                    <small>%</small>
                  </strong>
                  <span>melhor resultado</span>
                </div>
                <p>Maior compatibilidade encontrada para este objeto.</p>
              </div>
            </div>
          )}

          {secaoEstado === "no-matches" && (
            <div className="match-card">
              <div className="match-card-content">
                <span className="match-label">CORRESPONDÊNCIAS</span>
                <h2>Nenhuma correspondência encontrada para este objeto.</h2>
                <p>
                  O objeto <strong>{itemAtivo?.title || "selecionado"}</strong>{" "}
                  continua registrado. O sistema continuará comparando seus dados com
                  objetos encontrados cadastrados pela equipe.
                </p>
                <div className="match-actions">
                  <button onClick={() => irParaSecao("meus-itens")}>
                    Ver meus objetos
                    <Icon name="arrow" size={18} />
                  </button>
                  <div className="protected-info">
                    <Icon name="shield" size={16} />
                    Monitoramento ativo
                  </div>
                </div>
              </div>
              <div className="match-score">
                <div className="score-ring">
                  <strong>
                    0<small>%</small>
                  </strong>
                  <span>no momento</span>
                </div>
                <p>Ainda não existe registro compatível com este objeto.</p>
              </div>
            </div>
          )}
        </section>

        <section id="meus-itens" className="dashboard-grid">
          <div className="my-items-card">
            <div className="section-heading compact">
              <div>
                <span className="section-eyebrow">MEUS REGISTROS</span>
                <h2>Seus objetos perdidos</h2>
              </div>
              <button
                className="view-all-button"
                onClick={() => navegar("/usuario/meus-itens")}
              >
                Ver todos
                <Icon name="arrow" size={17} />
              </button>
            </div>

            <div className="items-list">
              {carregandoItens && <p>Carregando seus itens...</p>}

              {!carregandoItens && erroItens && <p>{erroItens}</p>}

              {!carregandoItens && !erroItens && meusItens.length === 0 && (
                <p>Você ainda não cadastrou nenhum objeto perdido.</p>
              )}

              {!carregandoItens &&
                !erroItens &&
                meusItens.map((item) => (
                  <button
                    className="lost-item-card"
                    key={item.id}
                    onClick={() => navegar(`/usuario/meus-itens/${item.id}`)}
                  >
                    <div className="lost-item-image">
                      <Icon name="package" size={27} />
                    </div>
                    <div className="lost-item-info">
                      <span className="lost-category">{item.categoria}</span>
                      <strong>{item.titulo}</strong>
                      <div className="lost-item-meta">
                        <span>
                          <Icon name="location" size={14} />
                          {item.local}
                        </span>
                        <span>{item.data}</span>
                      </div>
                    </div>
                    <span className={`lost-status ${item.statusClass}`}>
                      {item.status}
                    </span>
                  </button>
                ))}
            </div>

            <button
              className="new-lost-item-button"
              onClick={() => navegar("/usuario/item-perdido")}
            >
              <Icon name="plus" size={19} />
              Registrar outro objeto perdido
            </button>
          </div>

          <aside className="home-sidebar">
            <div className="summary-card">
              <div className="summary-heading">
                <div>
                  <span>Minha atividade</span>
                  <small>Visão geral dos seus registros</small>
                </div>
                <Icon name="history" size={21} />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>{atividade.itensCadastrados}</strong>
                  <span>Itens cadastrados</span>
                </div>
                <div className="summary-dot lost" />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>{atividade.possiveisCorrespondencias}</strong>
                  <span>
                    {atividade.possiveisCorrespondencias === 1
                      ? "Possível correspondência"
                      : "Possíveis correspondências"}
                  </span>
                </div>
                <div className="summary-dot pending" />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>{atividade.emValidacao}</strong>
                  <span>Em validação</span>
                </div>
                <div className="summary-dot validating" />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>{atividade.recuperados}</strong>
                  <span>
                    {atividade.recuperados === 1
                      ? "Objeto recuperado"
                      : "Objetos recuperados"}
                  </span>
                </div>
                <div className="summary-dot success" />
              </div>

              <button onClick={() => navegar("/usuario/meus-itens")}>
                Ver meus itens
              </button>
            </div>

            <div className="privacy-card">
              <div className="privacy-icon">
                <Icon name="shield" size={24} />
              </div>
              <div>
                <span>PRIVACIDADE</span>
                <strong>Seus dados ajudam na validação.</strong>
                <p>
                  Características específicas do objeto são usadas para confirmar a
                  propriedade e não ficam disponíveis para outros usuários.
                </p>
              </div>
            </div>

            <div className="help-card">
              <div className="help-icon">
                <Icon name="message" />
              </div>
              <div>
                <strong>Precisa de ajuda?</strong>
                <p>Consulte orientações sobre correspondência, validação e retirada.</p>
                <button onClick={() => navegar("/usuario/ajuda")}>
                  Central de ajuda
                </button>
              </div>
            </div>
          </aside>
        </section>

        <section className="process-section">
          <div className="section-heading process-heading">
            <div>
              <span className="section-eyebrow">COMO FUNCIONA</span>
              <h2>Do registro até a devolução</h2>
              <p>O OndeTá mantém o processo seguro sem expor os objetos encontrados.</p>
            </div>
          </div>

          <div className="process-grid">
            <div className="process-card">
              <span className="process-number">01</span>
              <div className="process-icon">
                <Icon name="plus" />
              </div>
              <strong>Você registra o que perdeu</strong>
              <p>Informe o máximo de detalhes sobre seu objeto perdido.</p>
            </div>
            <div className="process-line" />
            <div className="process-card">
              <span className="process-number">02</span>
              <div className="process-icon">
                <Icon name="match" />
              </div>
              <strong>O sistema compara</strong>
              <p>Seus dados são cruzados com os objetos cadastrados pela equipe.</p>
            </div>
            <div className="process-line" />
            <div className="process-card">
              <span className="process-number">03</span>
              <div className="process-icon">
                <Icon name="shield" />
              </div>
              <strong>A propriedade é validada</strong>
              <p>Informações específicas ajudam a comprovar que o objeto é seu.</p>
            </div>
            <div className="process-line" />
            <div className="process-card">
              <span className="process-number">04</span>
              <div className="process-icon">
                <Icon name="check" />
              </div>
              <strong>Retirada autorizada</strong>
              <p>Após a aprovação, o processo de devolução pode ser concluído.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-brand">
          <div className="home-brand-logo small">OT</div>
          <div>
            <strong>
              Onde<span>Tá</span>
            </strong>
            <p>Segurança e organização na devolução de objetos.</p>
          </div>
        </div>

        <div className="footer-links">
          <button onClick={() => navegar("/usuario/denuncias")}>Denúncias</button>
          <button onClick={() => navegar("/usuario/perfil")}>Minha conta</button>
          <button onClick={() => navegar("/usuario/ajuda")}>Ajuda</button>
          <button onClick={sair}>Sair</button>
        </div>
      </footer>
    </div>
  );
}

export default UsuarioHome;