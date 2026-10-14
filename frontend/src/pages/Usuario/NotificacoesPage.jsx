import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { notificationService } from "../../services/notificationService";

import "./NotificacoesPage.css";

function NotificacoesPage() {
  const navigate = useNavigate();

  const [notificacoes, setNotificacoes] =
    useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  async function carregarNotificacoes() {
    try {
      setCarregando(true);
      setErro("");

      const response =
        await notificationService.listar();

      setNotificacoes(
        response.items || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar notificações:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar suas notificações."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function abrirNotificacao(
    notificacao
  ) {
    try {
      if (!notificacao.is_read) {
        await notificationService.marcarComoLida(
          notificacao.id
        );

        setNotificacoes(
          (anteriores) =>
            anteriores.map((item) =>
              item.id ===
              notificacao.id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
            )
        );
      }

      if (notificacao.item_id) {
        navigate(
          `/usuario/meus-itens/${notificacao.item_id}`
        );
      }
    } catch (error) {
      console.error(
        "Erro ao abrir notificação:",
        error
      );
    }
  }

  function formatarData(data) {
    if (!data) {
      return "";
    }

    return new Date(
      data
    ).toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function tituloTipo(notificacao) {
    if (
      notificacao.type ===
      "MATCH_FOUND"
    ) {
      return "Esse item pode ser seu";
    }

    if (
      notificacao.type ===
      "CLAIM_RECEIVED"
    ) {
      return "Solicitação recebida";
    }

    if (
      notificacao.type ===
      "CLAIM_UPDATED"
    ) {
      return "Solicitação atualizada";
    }

    if (
      notificacao.type ===
      "NEW_MESSAGE"
    ) {
      return "Nova mensagem";
    }

    return (
      notificacao.title ||
      "Nova notificação"
    );
  }

  return (
    <div className="notificacoes-page">
      <header className="notificacoes-navbar">
        <button
          type="button"
          className="notificacoes-brand"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          <div className="notificacoes-logo">
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
        </button>

        <button
          type="button"
          className="notificacoes-voltar"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          ← Voltar ao início
        </button>
      </header>

      <main className="notificacoes-main">
        <section className="notificacoes-heading">
          <span>
            CENTRAL DE AVISOS
          </span>

          <h1>
            Notificações
          </h1>

          <p>
            Acompanhe correspondências,
            solicitações e atualizações
            relacionadas aos seus objetos.
          </p>
        </section>

        {carregando && (
          <div className="notificacoes-feedback">
            <div className="notificacoes-loader" />

            <h2>
              Carregando notificações...
            </h2>
          </div>
        )}

        {!carregando &&
          erro && (
            <div className="notificacoes-feedback">
              <h2>
                Não foi possível carregar
              </h2>

              <p>{erro}</p>

              <button
                onClick={
                  carregarNotificacoes
                }
              >
                Tentar novamente
              </button>
            </div>
          )}

        {!carregando &&
          !erro &&
          notificacoes.length ===
            0 && (
            <div className="notificacoes-feedback">
              <div className="notificacoes-empty-icon">
                OT
              </div>

              <h2>
                Nenhuma notificação no momento
              </h2>

              <p>
                Quando houver uma possível
                correspondência ou alguma
                atualização importante, você
                será avisado por aqui.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/usuario/home"
                  )
                }
              >
                Voltar ao início
              </button>
            </div>
          )}

        {!carregando &&
          !erro &&
          notificacoes.length >
            0 && (
            <div className="notificacoes-lista">
              {notificacoes.map(
                (notificacao) => (
                  <article
                    key={
                      notificacao.id
                    }
                    className={
                      notificacao.is_read
                        ? "notificacao-card"
                        : "notificacao-card nao-lida"
                    }
                  >
                    <div className="notificacao-indicador">
                      <div
                        className={
                          notificacao.is_read
                            ? "notificacao-dot lida"
                            : "notificacao-dot"
                        }
                      />
                    </div>

                    <div className="notificacao-conteudo">
                      <div className="notificacao-topo">
                        <span>
                          {notificacao.type ===
                          "MATCH_FOUND"
                            ? "POSSÍVEL CORRESPONDÊNCIA"
                            : "ONDETÁ"}
                        </span>

                        {!notificacao.is_read && (
                          <strong>
                            NOVA
                          </strong>
                        )}
                      </div>

                      <h2>
                        {tituloTipo(
                          notificacao
                        )}
                      </h2>

                      <p>
                        {notificacao.message ||
                          "Existe uma nova atualização relacionada ao seu registro."}
                      </p>

                      <div className="notificacao-footer">
                        <small>
                          {formatarData(
                            notificacao.created_at
                          )}
                        </small>

                        {notificacao.item_id && (
                          <button
                            type="button"
                            onClick={() =>
                              abrirNotificacao(
                                notificacao
                              )
                            }
                          >
                            {notificacao.type ===
                            "MATCH_FOUND"
                              ? "Ver item"
                              : "Abrir"}

                            <span>
                              →
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
      </main>
    </div>
  );
}

export default NotificacoesPage;