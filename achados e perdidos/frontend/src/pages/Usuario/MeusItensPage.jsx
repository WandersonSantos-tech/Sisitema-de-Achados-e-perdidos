import { useNavigate } from "react-router-dom";
import "./UsuarioPages.css";

function MeusItensPage() {
  const navigate = useNavigate();

  const itens = [
    {
      id: 1,
      titulo: "Mochila preta",
      categoria: "Acessórios",
      local: "Bloco A",
      data: "27/08/2026",
      status: "Possível correspondência",
    },
    {
      id: 2,
      titulo: "Fone de ouvido Bluetooth",
      categoria: "Eletrônicos",
      local: "Biblioteca",
      data: "25/08/2026",
      status: "Procurando",
    },
  ];

  return (
    <div className="usuario-page">
      <header className="usuario-page-header">
        <div>
          <span className="page-brand">
            Onde<span>Tá</span>
          </span>

          <h1>Meus itens perdidos</h1>

          <p>
            Acompanhe os objetos que você cadastrou como perdidos.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/usuario/home")}
        >
          Voltar ao início
        </button>
      </header>

      <main className="usuario-page-content">
        <div className="page-actions">
          <h2>Seus registros</h2>

          <button
            className="primary-button"
            onClick={() => navigate("/usuario/item-perdido")}
          >
            Registrar objeto perdido
          </button>
        </div>

        <div className="simple-list">
          {itens.map((item) => (
            <div className="simple-card" key={item.id}>
              <div>
                <span className="card-category">
                  {item.categoria}
                </span>

                <h3>{item.titulo}</h3>

                <p>
                  {item.local} • {item.data}
                </p>
              </div>

              <span className="status-badge">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default MeusItensPage;