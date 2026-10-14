import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { itemService } from "../../services/itemService";

import "./MeusItensPage.css";

function MeusItensPage() {
  const navigate = useNavigate();

  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarItens();
  }, []);

  async function carregarItens() {
    try {
      setCarregando(true);
      setErro("");

      const response =
        await itemService.listarItensPerdidos(
          1,
          100
        );

      setItens(response.items || []);
    } catch (error) {
      console.error(
        "Erro ao carregar itens:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar seus itens."
      );
    } finally {
      setCarregando(false);
    }
  }

  function formatarData(data) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString(
      "pt-BR"
    );
  }

  function formatarStatus(status) {
    if (!status) return "-";

    return status
      .replaceAll("_", " ")
      .toUpperCase();
  }

  function pegarImagem(item) {
    if (!item.images?.length) {
      return null;
    }

    return `http://localhost:8000${item.images[0].image_url}`;
  }

  return (
    <div className="meus-itens-page">
      <header className="meus-itens-navbar">
        <button
          className="meus-itens-brand"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          <div className="meus-itens-logo">
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
          className="meus-itens-voltar"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          ← Voltar para o início
        </button>
      </header>

      <main className="meus-itens-main">
        <div className="meus-itens-heading">
          <div>
            <span>MEUS REGISTROS</span>

            <h1>
              Meus objetos perdidos
            </h1>

            <p>
              Acompanhe todos os objetos que você
              registrou no OndeTá.
            </p>
          </div>

          <button
            className="meus-itens-novo"
            onClick={() =>
              navigate(
                "/usuario/item-perdido"
              )
            }
          >
            + Registrar objeto perdido
          </button>
        </div>

        {erro && (
          <div className="meus-itens-erro">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="meus-itens-feedback">
            Carregando seus objetos...
          </div>
        ) : itens.length === 0 ? (
          <div className="meus-itens-feedback">
            <h2>
              Nenhum objeto cadastrado
            </h2>

            <p>
              Você ainda não cadastrou nenhum
              objeto perdido.
            </p>
          </div>
        ) : (
          <div className="meus-itens-grid">
            {itens.map((item) => {
              const imagem =
                pegarImagem(item);

              return (
                <article
                  key={item.id}
                  className="meus-itens-card"
                  onClick={() =>
                    navigate(
                      `/usuario/meus-itens/${item.id}`
                    )
                  }
                >
                  <div className="meus-itens-imagem">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={item.title}
                      />
                    ) : (
                      <div className="sem-imagem">
                        OT
                      </div>
                    )}
                  </div>

                  <div className="meus-itens-conteudo">
                    <span className="meus-itens-categoria">
                      {item.category?.name ||
                        "Sem categoria"}
                    </span>

                    <h2>
                      {item.title}
                    </h2>

                    <p>
                      {item.location_name}
                    </p>

                    <div className="meus-itens-card-footer">
                      <span>
                        {formatarData(
                          item.event_date
                        )}
                      </span>

                      <strong>
                        {formatarStatus(
                          item.status
                        )}
                      </strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MeusItensPage;