
import { useEffect, useRef, useState } from "react";
import "./ChatConversa.css";

export default function ChatConversa({
  nome = "Conversa",
  mensagens = [],
  usuarioAtualId,
  onEnviar,
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finalRef = useRef(null);

  useEffect(() => {
    finalRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar(e) {
    e.preventDefault();

    const conteudo = texto.trim();
    if (!conteudo || enviando || !onEnviar) return;

    setEnviando(true);

    try {
      await onEnviar(conteudo);
      setTexto("");
    } catch (erro) {
      console.error("Erro ao enviar mensagem:", erro);
    } finally {
      setEnviando(false);
    }
  }

  function horario(data) {
    if (!data) return "";

    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return "";

    return valor.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="ondeta-chat">
      <header className="ondeta-chat-header">
        <div className="ondeta-chat-avatar">
          {nome.charAt(0).toUpperCase()}
        </div>

        <div className="ondeta-chat-contato">
          <strong>{nome}</strong>
          <span>Mensagens</span>
        </div>
      </header>

      <main className="ondeta-chat-mensagens">
        {mensagens.length === 0 && (
          <p className="ondeta-chat-vazio">
            Nenhuma mensagem ainda. Inicie a conversa!
          </p>
        )}

        {mensagens.map((mensagem) => {
          const minha =
            String(mensagem.sender_id) ===
            String(usuarioAtualId);

          return (
            <div
              key={mensagem.id}
              className={`ondeta-chat-linha ${
                minha ? "minha" : "recebida"
              }`}
            >
              <div className="ondeta-chat-balao">
                <p>{mensagem.content}</p>

                <time>
                  {horario(mensagem.created_at)}
                </time>
              </div>
            </div>
          );
        })}

        <div ref={finalRef} />
      </main>

      <form className="ondeta-chat-form" onSubmit={enviar}>
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite sua mensagem..."
          aria-label="Digite sua mensagem"
        />

        <button
          type="submit"
          disabled={!texto.trim() || enviando || !onEnviar}
          aria-label="Enviar mensagem"
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </form>
    </section>
  );
}
