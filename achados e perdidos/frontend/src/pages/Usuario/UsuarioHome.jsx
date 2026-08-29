import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/authService";

import "./UsuarioHome.css";

function Icon({ name, size = 22 }) {
  const icons = {
    plus: (
      <>
        <path
          d="M12 5v14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),

    bell: (
      <>
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 21h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),

    package: (
      <>
        <path
          d="M4 7l8-4 8 4v10l-8 4-8-4V7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M4 7l8 4 8-4M12 11v10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </>
    ),

    location: (
      <>
        <path
          d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="10"
          r="2.5"
          stroke="currentColor"
          strokeWidth="2"
        />
      </>
    ),

    history: (
      <>
        <path
          d="M3 12a9 9 0 1 0 3-6.7L3 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3 3v5h5M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),

    arrow: (
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),

    check: (
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),

    match: (
      <>
        <circle
          cx="8"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="16"
          cy="16"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="m11 11 2 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),

    shield: (
      <>
        <path
          d="M12 3 20 6v5c0 5.1-3.4 8.7-8 10-4.6-1.3-8-4.9-8-10V6l8-3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),

    message: (
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),

    menu: (
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),

    close: (
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function UsuarioHome() {
  const navigate = useNavigate();

  const usuario = authService.getUsuario();

  const [menuAberto, setMenuAberto] = useState(false);

  const meusItens = [
    {
      id: 1,
      categoria: "Acessórios",
      titulo: "Mochila preta",
      local: "Bloco A",
      data: "27/08/2026",
      status: "POSSÍVEL CORRESPONDÊNCIA",
      statusClass: "match",
    },
    {
      id: 2,
      categoria: "Eletrônicos",
      titulo: "Fone de ouvido Bluetooth",
      local: "Biblioteca",
      data: "25/08/2026",
      status: "PROCURANDO",
      statusClass: "searching",
    },
  ];

  function navegar(rota) {
    setMenuAberto(false);
    navigate(rota);
  }

  function sair() {
    authService.logout();
    navigate("/login");
  }

  return (
    <div className="usuario-home">
      <header className="home-navbar">
        <button
          className="home-brand"
          onClick={() => navegar("/usuario/home")}
        >
          <div className="home-brand-logo">OT</div>

          <div className="home-brand-text">
            <strong>
              Onde<span>Tá</span>
            </strong>

            <small>Achados & Perdidos</small>
          </div>
        </button>

        <nav
          className={
            menuAberto
              ? "home-navigation open"
              : "home-navigation"
          }
        >
          <button
            className="nav-item active"
            onClick={() => navegar("/usuario/home")}
          >
            Início
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navegar("/usuario/meus-itens")
            }
          >
            Meus itens perdidos
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navegar("/usuario/correspondencias")
            }
          >
            Correspondências
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navegar("/usuario/solicitacoes")
            }
          >
            Solicitações
          </button>
        </nav>

        <div className="navbar-actions">
          <button
            className="navbar-icon-button"
            onClick={() =>
              navegar("/usuario/notificacoes")
            }
            aria-label="Notificações"
          >
            <Icon name="bell" />

            <span className="notification-dot">
              2
            </span>
          </button>

          <button
            className="navbar-profile"
            onClick={() =>
              navegar("/usuario/perfil")
            }
          >
            <div className="profile-avatar">
              {usuario?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="profile-text">
              <strong>
                {usuario?.name || "Usuário"}
              </strong>

              <span>Minha conta</span>
            </div>
          </button>

          <button
            className="mobile-menu-button"
            onClick={() =>
              setMenuAberto(!menuAberto)
            }
            aria-label="Abrir menu"
          >
            <Icon
              name={menuAberto ? "close" : "menu"}
            />
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <div className="hero-decoration hero-decoration-one" />
          <div className="hero-decoration hero-decoration-two" />

          <div className="hero-content">
            <span className="hero-eyebrow">
              PORTAL ONDETÁ
            </span>

            <h1>
              Olá,{" "}
              <span>
                {usuario?.name
                  ?.split(" ")[0] || "Usuário"}
              </span>
              .
            </h1>

            <h2>
              Perdeu alguma coisa?
              <br />
              Conte para o OndeTá.
            </h2>

            <p>
              Cadastre as informações do objeto que
              você perdeu. O sistema compara seu
              registro com os objetos encontrados
              cadastrados pela equipe responsável e
              avisa quando existir uma possível
              correspondência.
            </p>

            <div className="hero-actions">
              <button
                className="hero-primary-button"
                onClick={() =>
                  navegar("/usuario/item-perdido")
                }
              >
                <Icon name="plus" size={20} />

                Registrar objeto perdido

                <Icon name="arrow" size={18} />
              </button>

              <button
                className="hero-secondary-button"
                onClick={() =>
                  navegar("/usuario/meus-itens")
                }
              >
                <Icon name="package" size={20} />

                Ver meus itens
              </button>
            </div>

            <div className="hero-security">
              <Icon name="shield" size={18} />

              <span>
                Os objetos encontrados não ficam
                expostos publicamente.
              </span>
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

              <strong>
                Você cadastra. O sistema procura.
              </strong>
            </div>
          </div>
        </section>

        <section className="quick-actions-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                ACESSO RÁPIDO
              </span>

              <h2>
                Acompanhe seus objetos
              </h2>

              <p>
                Tudo relacionado aos seus registros
                fica concentrado em um só lugar.
              </p>
            </div>
          </div>

          <div className="quick-actions-grid">
            <button
              className="quick-action primary"
              onClick={() =>
                navegar("/usuario/item-perdido")
              }
            >
              <div className="quick-action-icon">
                <Icon name="plus" />
              </div>

              <div>
                <strong>
                  Registrar objeto perdido
                </strong>

                <p>
                  Informe local, data, categoria,
                  fotos e características do item.
                </p>
              </div>

              <span className="quick-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>

            <button
              className="quick-action"
              onClick={() =>
                navegar("/usuario/meus-itens")
              }
            >
              <div className="quick-action-icon">
                <Icon name="package" />
              </div>

              <div>
                <strong>
                  Meus itens perdidos
                </strong>

                <p>
                  Consulte somente os objetos que
                  foram cadastrados por você.
                </p>
              </div>

              <span className="quick-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>

            <button
              className="quick-action"
              onClick={() =>
                navegar("/usuario/correspondencias")
              }
            >
              <div className="quick-action-icon">
                <Icon name="match" />
              </div>

              <div>
                <strong>
                  Correspondências
                </strong>

                <p>
                  Veja possíveis combinações
                  encontradas automaticamente pelo
                  sistema.
                </p>
              </div>

              <span className="quick-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>

            <button
              className="quick-action"
              onClick={() =>
                navegar("/usuario/solicitacoes")
              }
            >
              <div className="quick-action-icon">
                <Icon name="history" />
              </div>

              <div>
                <strong>
                  Minhas solicitações
                </strong>

                <p>
                  Acompanhe validações, retirada e
                  andamento das suas solicitações.
                </p>
              </div>

              <span className="quick-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>
          </div>
        </section>
                <section className="match-section">
          <div className="match-card">
            <div className="match-card-content">
              <span className="match-label">
                NOVA CORRESPONDÊNCIA
              </span>

              <h2>
                Podemos ter encontrado algo seu.
              </h2>

              <p>
                Um objeto cadastrado pela equipe
                possui características semelhantes
                à mochila que você informou como
                perdida.
              </p>

              <div className="match-comparison">
                <div className="match-lost-item">
                  <div className="match-object-icon">
                    <Icon name="package" size={25} />
                  </div>

                  <div>
                    <span>SEU ITEM PERDIDO</span>

                    <strong>Mochila preta</strong>

                    <p>
                      Registrada em 27/08/2026
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
                    <span>
                      POSSÍVEL CORRESPONDÊNCIA
                    </span>

                    <strong>
                      Objeto compatível
                    </strong>

                    <p>
                      Detalhes protegidos até a
                      validação
                    </p>
                  </div>
                </div>
              </div>

              <div className="match-actions">
                <button
                  onClick={() =>
                    navegar(
                      "/usuario/correspondencias"
                    )
                  }
                >
                  Ver correspondência

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
                  87<small>%</small>
                </strong>

                <span>compatível</span>
              </div>

              <p>
                Compatibilidade calculada com base
                nos dados dos dois registros.
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="my-items-card">
            <div className="section-heading compact">
              <div>
                <span className="section-eyebrow">
                  MEUS REGISTROS
                </span>

                <h2>
                  Seus objetos perdidos
                </h2>
              </div>

              <button
                className="view-all-button"
                onClick={() =>
                  navegar("/usuario/meus-itens")
                }
              >
                Ver todos

                <Icon name="arrow" size={17} />
              </button>
            </div>

            <div className="items-list">
              {meusItens.map((item) => (
                <button
                  className="lost-item-card"
                  key={item.id}
                  onClick={() =>
                    navegar(
                      `/usuario/meus-itens/${item.id}`
                    )
                  }
                >
                  <div className="lost-item-image">
                    <Icon name="package" size={27} />
                  </div>

                  <div className="lost-item-info">
                    <span className="lost-category">
                      {item.categoria}
                    </span>

                    <strong>
                      {item.titulo}
                    </strong>

                    <div className="lost-item-meta">
                      <span>
                        <Icon
                          name="location"
                          size={14}
                        />

                        {item.local}
                      </span>

                      <span>
                        {item.data}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`lost-status ${item.statusClass}`}
                  >
                    {item.status}
                  </span>
                </button>
              ))}
            </div>

            <button
              className="new-lost-item-button"
              onClick={() =>
                navegar("/usuario/item-perdido")
              }
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
                  <small>
                    Visão geral dos seus registros
                  </small>
                </div>

                <Icon name="history" size={21} />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>2</strong>
                  <span>Itens cadastrados</span>
                </div>

                <div className="summary-dot lost" />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>1</strong>
                  <span>
                    Possível correspondência
                  </span>
                </div>

                <div className="summary-dot pending" />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>1</strong>
                  <span>Em validação</span>
                </div>

                <div className="summary-dot validating" />
              </div>

              <div className="summary-stat">
                <div>
                  <strong>3</strong>
                  <span>Objetos recuperados</span>
                </div>

                <div className="summary-dot success" />
              </div>

              <button
                onClick={() =>
                  navegar("/usuario/meus-itens")
                }
              >
                Ver meus itens
              </button>
            </div>

            <div className="privacy-card">
              <div className="privacy-icon">
                <Icon name="shield" size={24} />
              </div>

              <div>
                <span>PRIVACIDADE</span>

                <strong>
                  Seus dados ajudam na validação.
                </strong>

                <p>
                  Características específicas do
                  objeto são usadas para confirmar a
                  propriedade e não ficam disponíveis
                  para outros usuários.
                </p>
              </div>
            </div>

            <div className="help-card">
              <div className="help-icon">
                <Icon name="message" />
              </div>

              <div>
                <strong>
                  Precisa de ajuda?
                </strong>

                <p>
                  Consulte orientações sobre
                  correspondência, validação e
                  retirada.
                </p>

                <button
                  onClick={() =>
                    navegar("/usuario/ajuda")
                  }
                >
                  Central de ajuda
                </button>
              </div>
            </div>
          </aside>
        </section>

        <section className="process-section">
          <div className="section-heading process-heading">
            <div>
              <span className="section-eyebrow">
                COMO FUNCIONA
              </span>

              <h2>
                Do registro até a devolução
              </h2>

              <p>
                O OndeTá mantém o processo seguro
                sem expor os objetos encontrados.
              </p>
            </div>
          </div>

          <div className="process-grid">
            <div className="process-card">
              <span className="process-number">
                01
              </span>

              <div className="process-icon">
                <Icon name="plus" />
              </div>

              <strong>
                Você registra o que perdeu
              </strong>

              <p>
                Informe o máximo de detalhes sobre
                seu objeto perdido.
              </p>
            </div>

            <div className="process-line" />

            <div className="process-card">
              <span className="process-number">
                02
              </span>

              <div className="process-icon">
                <Icon name="match" />
              </div>

              <strong>
                O sistema compara
              </strong>

              <p>
                Seus dados são cruzados com os
                objetos cadastrados pela equipe.
              </p>
            </div>

            <div className="process-line" />

            <div className="process-card">
              <span className="process-number">
                03
              </span>

              <div className="process-icon">
                <Icon name="shield" />
              </div>

              <strong>
                A propriedade é validada
              </strong>

              <p>
                Informações específicas ajudam a
                comprovar que o objeto é seu.
              </p>
            </div>

            <div className="process-line" />

            <div className="process-card">
              <span className="process-number">
                04
              </span>

              <div className="process-icon">
                <Icon name="check" />
              </div>

              <strong>
                Retirada autorizada
              </strong>

              <p>
                Após a aprovação, o processo de
                devolução pode ser concluído.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-brand">
          <div className="home-brand-logo small">
            OT
          </div>

          <div>
            <strong>
              Onde<span>Tá</span>
            </strong>

            <p>
              Segurança e organização na devolução
              de objetos.
            </p>
          </div>
        </div>

        <div className="footer-links">
          <button
            onClick={() =>
              navegar("/usuario/perfil")
            }
          >
            Minha conta
          </button>

          <button
            onClick={() =>
              navegar("/usuario/ajuda")
            }
          >
            Ajuda
          </button>

          <button onClick={sair}>
            Sair
          </button>
        </div>
      </footer>
    </div>
  );
}

export default UsuarioHome;