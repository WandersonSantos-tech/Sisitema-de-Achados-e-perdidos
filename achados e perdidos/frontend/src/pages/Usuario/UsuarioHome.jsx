import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/authService";

import "./UsuarioHome.css";


function Icon({ name, size = 22 }) {
  const icons = {
    search: (
      <path
        d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),

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

    user: (
      <>
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"
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

    message: (
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
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

    menu: (
      <>
        <path
          d="M4 6h16M4 12h16M4 18h16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),

    close: (
      <>
        <path
          d="m6 6 12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
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

  const [pesquisa, setPesquisa] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);


  const itensEncontrados = [
    {
      id: 1,
      categoria: "Eletrônicos",
      titulo: "Fone de ouvido preto",
      local: "Bloco B",
      data: "Hoje, 14:20",
      status: "ENCONTRADO",
      emoji: "",
    },

    {
      id: 2,
      categoria: "Documentos",
      titulo: "Carteira com documentos",
      local: "Biblioteca",
      data: "Hoje, 11:05",
      status: "ENCONTRADO",
      emoji: "",
    },

    {
      id: 3,
      categoria: "Acessórios",
      titulo: "Chaveiro com três chaves",
      local: "Estacionamento",
      data: "Ontem, 18:40",
      status: "ENCONTRADO",
      emoji: "",
    },
  ];


  function pesquisar(event) {
    event.preventDefault();

    navigate(
      `/usuario/pesquisar?q=${encodeURIComponent(
        pesquisa.trim()
      )}`
    );
  }


  function sair() {
    authService.logout();

    navigate("/login");
  }


  return (
    <div className="usuario-home">

      <header className="home-navbar">

        <div
          className="home-brand"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          <div className="home-brand-logo">
            OT
          </div>

          <div>
            <strong>
              Onde<span>Tá</span>
            </strong>

            <small>
              Achados & Perdidos
            </small>
          </div>
        </div>


        <nav
          className={
            menuAberto
              ? "home-navigation open"
              : "home-navigation"
          }
        >
          <button
            className="nav-item active"
            onClick={() =>
              navigate("/usuario/home")
            }
          >
            Início
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/usuario/pesquisar"
              )
            }
          >
            Explorar
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/usuario/publicacoes"
              )
            }
          >
            Minhas publicações
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/usuario/solicitacoes"
              )
            }
          >
            Solicitações
          </button>
        </nav>


        <div className="navbar-actions">

          <button
            className="navbar-icon-button notification-button"
            onClick={() =>
              navigate(
                "/usuario/notificacoes"
              )
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
              navigate("/usuario/perfil")
            }
          >
            <div className="profile-avatar">
              {usuario?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="profile-text">
              <strong>
                {usuario?.name ||
                  "Usuário"}
              </strong>

              <span>
                Minha conta
              </span>
            </div>
          </button>


          <button
            className="mobile-menu-button"
            onClick={() =>
              setMenuAberto(
                !menuAberto
              )
            }
          >
            <Icon
              name={
                menuAberto
                  ? "close"
                  : "menu"
              }
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
                  ?.split(" ")[0] ||
                  "Usuário"}
              </span>
              .
            </h1>

            <h2>
              Perdeu alguma coisa?
              <br />
              A gente ajuda você a
              encontrar.
            </h2>

            <p>
              Pesquise entre os objetos
              encontrados ou registre o que
              você perdeu. O OndeTá cruza
              informações para encontrar
              possíveis correspondências.
            </p>


            <form
              className="hero-search"
              onSubmit={pesquisar}
            >

              <div className="hero-search-icon">
                <Icon name="search" />
              </div>

              <input
                type="text"
                value={pesquisa}
                onChange={(event) =>
                  setPesquisa(
                    event.target.value
                  )
                }
                placeholder="O que você está procurando?"
              />

              <button type="submit">
                Pesquisar

                <Icon
                  name="arrow"
                  size={18}
                />
              </button>

            </form>


            <div className="popular-searches">
              <span>
                Pesquisas rápidas:
              </span>

              <button
                onClick={() =>
                  navigate(
                    "/usuario/pesquisar?q=celular"
                  )
                }
              >
                Celular
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/usuario/pesquisar?q=documentos"
                  )
                }
              >
                Documentos
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/usuario/pesquisar?q=chaves"
                  )
                }
              >
                Chaves
              </button>

              <button
                onClick={() =>
                  navigate(
                    "/usuario/pesquisar?q=mochila"
                  )
                }
              >
                Mochila
              </button>
            </div>

          </div>


          <div className="hero-status-card">

            <div className="status-illustration">

              <div className="status-circle">
                <Icon
                  name="search"
                  size={39}
                />
              </div>

              <div className="floating-badge floating-badge-one">
                <Icon
                  name="location"
                  size={17}
                />

                Local identificado
              </div>

              <div className="floating-badge floating-badge-two">
                <Icon
                  name="check"
                  size={17}
                />

                Correspondência
              </div>

            </div>


            <div className="status-card-footer">
              <span>
                Sistema inteligente
              </span>

              <strong>
                Encontrar ficou mais
                simples.
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
                O que você precisa fazer?
              </h2>
            </div>

          </div>


          <div className="quick-actions-grid">

            <button
              className="quick-action primary"
              onClick={() =>
                navigate(
                  "/usuario/item-perdido"
                )
              }
            >
              <div className="quick-action-icon">
                <Icon name="plus" />
              </div>

              <div>
                <strong>
                  Perdi um objeto
                </strong>

                <p>
                  Registre um item perdido
                  com local, data, fotos e
                  características.
                </p>
              </div>

              <span className="quick-arrow">
                <Icon
                  name="arrow"
                  size={20}
                />
              </span>
            </button>


            <button
              className="quick-action"
              onClick={() =>
                navigate(
                  "/usuario/pesquisar"
                )
              }
            >
              <div className="quick-action-icon">
                <Icon name="search" />
              </div>

              <div>
                <strong>
                  Procurar objetos
                </strong>

                <p>
                  Pesquise itens encontrados
                  utilizando filtros e
                  palavras-chave.
                </p>
              </div>

              <span className="quick-arrow">
                <Icon
                  name="arrow"
                  size={20}
                />
              </span>
            </button>
<button
  className="quick-action"
  onClick={() =>
    navigate(
      "/usuario/solicitacoes"
    )
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
      Acompanhe pedidos de devolução, validações e o andamento dos seus objetos.
    </p>
  </div>

  <span className="quick-arrow">
    <Icon
      name="arrow"
      size={20}
    />
  </span>
</button>
            <button
              className="quick-action"
              onClick={() =>
                navigate(
                  "/usuario/notificacoes"
                )
              }
            >
              <div className="quick-action-icon">
                <Icon name="bell" />
              </div>

              <div>
                <strong>
                  Notificações
                </strong>

                <p>
                  Confira correspondências,
                  solicitações e atualizações.
                </p>
              </div>

              <span className="quick-arrow">
                <Icon
                  name="arrow"
                  size={20}
                />
              </span>
            </button>

          </div>

        </section>


        <section className="match-section">

          <div className="match-card">

            <div className="match-card-content">

              <span className="match-label">
                POSSÍVEL CORRESPONDÊNCIA
              </span>

              <h2>
                Podemos ter encontrado
                algo seu.
              </h2>

              <p>
                Encontramos uma publicação
                com características parecidas
                com um item perdido cadastrado
                por você.
              </p>


              <div className="match-object">

                <div className="match-object-image">
                
                </div>

                <div>
                  <span>
                    87% compatível
                  </span>

                  <strong>
                    Mochila preta
                  </strong>

                  <p>
                    Encontrada próximo ao
                    Bloco A
                  </p>
                </div>

              </div>


              <button
                onClick={() =>
                  navigate(
                    "/usuario/correspondencias"
                  )
                }
              >
                Ver correspondência

                <Icon
                  name="arrow"
                  size={18}
                />
              </button>

            </div>


            <div className="match-score">

              <div className="score-ring">
                <strong>
                  87
                  <small>%</small>
                </strong>

                <span>
                  compatível
                </span>
              </div>

            </div>

          </div>

        </section>


        <section className="dashboard-grid">

          <div className="latest-items">

            <div className="section-heading compact">

              <div>
                <span className="section-eyebrow">
                  RECENTES
                </span>

                <h2>
                  Últimos objetos
                  encontrados
                </h2>
              </div>


              <button
                className="view-all-button"
                onClick={() =>
                  navigate(
                    "/usuario/pesquisar"
                  )
                }
              >
                Ver todos

                <Icon
                  name="arrow"
                  size={17}
                />
              </button>

            </div>


            <div className="items-list">

              {itensEncontrados.map(
                (item) => (
                  <button
                    className="found-item-card"
                    key={item.id}
                    onClick={() =>
                      navigate(
                        `/usuario/item/${item.id}`
                      )
                    }
                  >

                    <div className="found-item-image">
  {item.image ? (
    <img
      src={item.image}
      alt={item.titulo}
    />
  ) : (
    <Icon name="package" size={26} />
  )}
</div>


                    <div className="found-item-info">

                      <span className="found-category">
                        {item.categoria}
                      </span>

                      <strong>
                        {item.titulo}
                      </strong>


                      <div className="found-item-meta">

                        <span>
                          <Icon
                            name="location"
                            size={15}
                          />

                          {item.local}
                        </span>

                        <span>
                          {item.data}
                        </span>

                      </div>

                    </div>


                    <span className="found-status">
                      Encontrado
                    </span>

                  </button>
                )
              )}

            </div>

          </div>


          <aside className="home-sidebar">

            <div className="summary-card">

              <div className="summary-heading">
                <span>
                  Minha atividade
                </span>

                <Icon
                  name="history"
                  size={20}
                />
              </div>


              <div className="summary-stat">

                <div>
                  <strong>2</strong>

                  <span>
                    Itens perdidos
                  </span>
                </div>

                <div className="summary-dot lost" />

              </div>


              <div className="summary-stat">

                <div>
                  <strong>1</strong>

                  <span>
                    Em negociação
                  </span>
                </div>

                <div className="summary-dot pending" />

              </div>


              <div className="summary-stat">

                <div>
                  <strong>3</strong>

                  <span>
                    Recuperados
                  </span>
                </div>

                <div className="summary-dot success" />

              </div>


              <button
                onClick={() =>
                  navigate(
                    "/usuario/publicacoes"
                  )
                }
              >
                Ver minhas publicações
              </button>

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
                  retirada e validação de
                  propriedade.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/usuario/ajuda"
                    )
                  }
                >
                  Central de ajuda
                </button>
              </div>

            </div>

          </aside>

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
              Encontre. Recupere.
              Devolva.
            </p>
          </div>
        </div>


        <div className="footer-links">

          <button
            onClick={() =>
              navigate(
                "/usuario/perfil"
              )
            }
          >
            Minha conta
          </button>

          <button
            onClick={() =>
              navigate(
                "/usuario/ajuda"
              )
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