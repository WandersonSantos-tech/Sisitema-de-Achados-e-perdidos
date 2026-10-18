import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { authService } from "../../services/authService";
import "./UsuarioSupportPage.css";
import { reviewService } from "../../services/reviewService";

export default function UsuarioSupportPage() {
  const profile = useLocation().pathname.endsWith("/perfil");
  const [reviews, setReviews] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    authService
      .getCurrentUser()
      .then((value) => {
        if (live) setUser(value);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="support-page">
      <header>
        <Link className="support-brand" to="/usuario/home">
          Onde<span>Tá</span>
        </Link>
        <Link to="/usuario/home">← Voltar ao início</Link>
      </header>
      <main>
        <h1>{profile ? "Minha conta" : "Central de ajuda"}</h1>
        {error && (
          <p role="alert">
            {error} <Link to="/login">Entrar novamente</Link>
          </p>
        )}
        {profile ? (
          <section className="support-card">
            {user ? (
              <>
                <h2>{user.name}</h2>
                <p>E-mail: {user.email}</p>
                <p>Telefone: {user.phone || "Não informado"}</p>
                <p>Situação: {user.is_active ? "Ativo" : "Bloqueado"}</p>
                <button onClick={async () => {
                  try { setReviews(await reviewService.listByUser(user.id)); }
                  catch (error) { setError(error.message); }
                }}>Minhas avaliações recebidas</button>
                {reviews && <p>{reviews.total_reviews} avaliações · Média: {reviews.average_rating ?? "Sem notas"}</p>}
                <Link to="/recuperar-senha">Recuperar senha</Link>
              </>
            ) : (
              !error && <p>Carregando sua conta...</p>
            )}
          </section>
        ) : (
          <section className="support-card">
            <h2>Como usar o OndeTá</h2>
            <p>
              Registre o objeto perdido e acompanhe seus itens. A equipe pode
              encaminhar correspondências; consulte as notificações e
              solicitações para conversar sobre a devolução.
            </p>
            <Link to="/usuario/item-perdido">Cadastrar item perdido</Link>
            <p>
              <Link to="/usuario/notificacoes">Ver notificações</Link>
            </p>
            <p>
              <Link to="/usuario/solicitacoes">Acompanhar solicitações</Link>
            </p>
          </section>
        )}
        <footer>
          <Link to="/usuario/home">Voltar ao início</Link>
          <Link to="/usuario/meus-itens">Meus itens</Link>
        </footer>
      </main>
    </div>
  );
}
