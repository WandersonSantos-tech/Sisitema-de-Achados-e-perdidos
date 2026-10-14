import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { itemService } from "../../services/itemService";

import "./ItemDetalhePage.css";

function ItemDetalhePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarItem();
  }, [id]);

  async function carregarItem() {
    try {
      setCarregando(true);
      setErro("");

      const response = await itemService.buscarItem(id);

      setItem(response);
    } catch (error) {
      console.error("Erro ao carregar item:", error);

      setErro(
        error.message ||
          "Não foi possível carregar as informações do objeto."
      );
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data) {
    if (!data) return "Não informado";

    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarStatus(status) {
    if (!status) return "Não informado";

    return status.replaceAll("_", " ").toUpperCase();
  }

  function formatarMedida(valor) {
    if (valor === null || valor === undefined || valor === "") {
      return "Não informado";
    }

    return `${valor} cm`;
  }

  async function excluirItem() {
  const confirmar = window.confirm(
    `Tem certeza que deseja excluir "${item.title}"? Essa ação não poderá ser desfeita.`
  );

  if (!confirmar) {
    return;
  }

  try {
    await itemService.excluirItem(item.id);

    navigate("/usuario/home");
  } catch (error) {
    console.error(
      "Erro ao excluir item:",
      error
    );

    alert(
      error.message ||
        "Não foi possível excluir o objeto."
    );
  }
}

  function pegarUrlImagem(imageUrl) {
    if (!imageUrl) return "";

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    return `http://localhost:8000${imageUrl}`;
  }

  if (carregando) {
    return (
      <div className="item-detalhe-feedback">
        <div className="item-detalhe-loading" />

        <h2>Carregando objeto...</h2>

        <p>
          Estamos buscando as informações do seu registro.
        </p>
      </div>
    );
  }

  if (erro || !item) {
    return (
      <div className="item-detalhe-feedback">
        <div className="item-detalhe-error-icon">!</div>

        <h2>Não foi possível abrir o objeto</h2>

        <p>
          {erro || "Objeto não encontrado."}
        </p>

        <button
          type="button"
          onClick={() =>
            navigate("/usuario/meus-itens")
          }
        >
          Voltar para meus itens
        </button>
      </div>
    );
  }

  return (
    <div className="item-detalhe-page">
      <header className="item-detalhe-navbar">
        <button
          type="button"
          className="item-detalhe-brand"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          <div className="item-detalhe-logo">
            OT
          </div>

          <div className="item-detalhe-brand-text">
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
        className="item-detalhe-voltar"
        onClick={() =>
            navigate("/usuario/home")
        }
        >
        <span>←</span>
        Voltar para o início
        </button>
      </header>

      <main className="item-detalhe-main">
        <section className="item-detalhe-heading">
          <div>
            <span className="item-detalhe-eyebrow">
              MEU REGISTRO
            </span>

            <h1>{item.title}</h1>

            <p>
              Consulte as informações cadastradas sobre
              este objeto perdido.
            </p>
          </div>

          <div className="item-detalhe-status">
            {formatarStatus(item.status)}
          </div>
        </section>

        <div className="item-detalhe-layout">
          <div className="item-detalhe-content">
            <section className="item-detalhe-card">
              <div className="item-card-heading">
                <div>
                  <span>FOTOS DO OBJETO</span>

                  <h2>Imagens cadastradas</h2>
                </div>

                <strong>
                  {item.images?.length || 0}/3
                </strong>
              </div>

              {item.images?.length > 0 ? (
                <div
                  className={`item-detalhe-galeria quantidade-${item.images.length}`}
                >
                  {item.images.map((imagem, index) => (
                    <div
                      className="item-detalhe-imagem"
                      key={imagem.id}
                    >
                      <img
                        src={pegarUrlImagem(
                          imagem.image_url
                        )}
                        alt={`${item.title} - imagem ${
                          index + 1
                        }`}
                      />

                      <span>
                        Imagem {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="item-sem-fotos">
                  <div>OT</div>

                  <strong>
                    Nenhuma imagem cadastrada
                  </strong>

                  <p>
                    Este registro foi criado sem fotos
                    adicionais.
                  </p>
                </div>
              )}
            </section>

            <section className="item-detalhe-card">
              <div className="item-card-heading">
                <div>
                  <span>INFORMAÇÕES</span>

                  <h2>Dados do objeto</h2>
                </div>
              </div>

              <div className="item-detalhe-info-grid">
                <div className="item-info-box">
                  <span>Categoria</span>

                  <strong>
                    {item.category?.name ||
                      "Não informada"}
                  </strong>
                </div>

                <div className="item-info-box">
                  <span>Status</span>

                  <strong>
                    {formatarStatus(item.status)}
                  </strong>
                </div>

                <div className="item-info-box">
                  <span>Local da perda</span>

                  <strong>
                    {item.location_name ||
                      "Não informado"}
                  </strong>
                </div>

                <div className="item-info-box">
                  <span>Data e hora</span>

                  <strong>
                    {formatarData(item.event_date)}
                  </strong>
                </div>

                <div className="item-info-box">
                  <span>Altura aproximada</span>

                  <strong>
                    {formatarMedida(item.height_cm)}
                  </strong>
                </div>

                <div className="item-info-box">
                  <span>Largura aproximada</span>

                  <strong>
                    {formatarMedida(item.width_cm)}
                  </strong>
                </div>
              </div>
            </section>

            <section className="item-detalhe-card">
              <div className="item-card-heading">
                <div>
                  <span>DESCRIÇÃO</span>

                  <h2>Sobre o objeto</h2>
                </div>
              </div>

              <p className="item-description-text">
                {item.description ||
                  "Nenhuma descrição cadastrada."}
              </p>
            </section>

            <section className="item-detalhe-card item-secret-card">
              <div className="item-secret-icon">
                ✓
              </div>

              <div>
                <span className="item-secret-label">
                  INFORMAÇÃO PROTEGIDA
                </span>

                <h2>
                  Características específicas
                </h2>

                <p>
                  {item.secret_details ||
                    "Nenhuma característica específica foi informada."}
                </p>

                <small>
                  Essas informações ajudam a confirmar
                  que o objeto realmente pertence a você
                  e não são exibidas publicamente.
                </small>
              </div>
            </section>

            <section className="item-danger-zone">
              <div className="item-danger-content">
                <span className="item-danger-label">
                  ZONA DE PERIGO
                </span>

                <h2>
                  Excluir objeto perdido
                </h2>

                <p>
                  Ao excluir este registro, o objeto deixará
                  de participar das buscas por correspondência.
                  As informações e imagens relacionadas a este
                  registro não ficarão mais disponíveis.
                </p>
              </div>

              <button
                type="button"
                className="item-delete-button"
                onClick={excluirItem}
              >
                Excluir item
              </button>
            </section>
          </div>

          <aside className="item-detalhe-sidebar">
            <div className="item-status-card">
              <span className="item-sidebar-label">
                STATUS DO REGISTRO
              </span>

              <div className="item-status-circle">
                <span />
              </div>

              <h3>
                {formatarStatus(item.status)}
              </h3>

              <p>
                Seu objeto permanece registrado no
                sistema e será comparado com objetos
                encontrados cadastrados pela equipe.
              </p>
            </div>

            <div className="item-privacy-card">
              <div className="item-privacy-icon">
                ✓
              </div>

              <div>
                <strong>
                  Seus dados estão protegidos
                </strong>

                <p>
                  Objetos encontrados de outros usuários
                  não são expostos publicamente.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default ItemDetalhePage;