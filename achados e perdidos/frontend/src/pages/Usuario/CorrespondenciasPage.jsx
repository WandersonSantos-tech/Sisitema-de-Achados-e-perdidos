import { useNavigate } from "react-router-dom";
import "./UsuarioPages.css";

function CorrespondenciasPage() {
  const navigate = useNavigate();

  return (
    <div className="usuario-page">
      <header className="usuario-page-header">
        <div>
          <span className="page-brand">
            Onde<span>Tá</span>
          </span>

          <h1>Correspondências</h1>

          <p>
            Veja possíveis correspondências encontradas automaticamente.
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
        <h2>Possíveis correspondências</h2>

        <div className="match-simple-card">
          <div className="match-percentage">
            <strong>87%</strong>
            <span>compatível</span>
          </div>

          <div className="match-simple-info">
            <span className="card-category">
              NOVA CORRESPONDÊNCIA
            </span>

            <h3>Mochila preta</h3>

            <p>
              O sistema encontrou um objeto com características
              semelhantes ao item que você cadastrou.
            </p>

            <small>
              As informações completas permanecem protegidas até a
              validação.
            </small>
          </div>

          <button className="primary-button">
            Ver detalhes
          </button>
        </div>
      </main>
    </div>
  );
}

export default CorrespondenciasPage;