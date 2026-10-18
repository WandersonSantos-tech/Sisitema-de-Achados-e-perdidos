
import { useCallback, useEffect, useRef, useState } from "react";
import { messageService } from "../services/messageService";
import { authService } from "../services/authService";
import DevolucaoFlow from "./DevolucaoFlow";
import "./ClaimChat.css";

export default function ClaimChat({
  claimId,
  pickupAt,
  onReturned,
  itemId,
  interlocutorId,
  interlocutorNome,
  permitirDevolucao = false,
  nomeObjeto = "Objeto",
}) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mostrarDevolucao, setMostrarDevolucao] = useState(false);

  const finalMensagensRef = useRef(null);

  const meuId = authService.getUsuario()?.id;

  const carregarMensagens = useCallback(async () => {
    if (!itemId || !interlocutorId) {
      setCarregando(false);
      return;
    }

    try {
      const resposta = await messageService.conversation(
        itemId,
        interlocutorId
      );

      setMensagens(resposta.messages || []);
      setErro("");
    } catch (error) {
      setErro(error.message || "Erro ao carregar mensagens.");
    } finally {
      setCarregando(false);
    }
  }, [itemId, interlocutorId]);


useEffect(() => {
  let ativo = true;
  let consultando = false;

  setCarregando(true);
  setMensagens([]);

  async function atualizarAutomaticamente() {
    if (!ativo || consultando || !itemId || !interlocutorId) {
      return;
    }

    consultando = true;

    try {
      const resposta = await messageService.conversation(
        itemId,
        interlocutorId
      );

      if (!ativo) return;

      setMensagens(resposta.messages || []);
      setErro("");
    } catch (error) {
      if (ativo) {
        setErro(
          error.message || "Erro ao atualizar mensagens."
        );
      }
    } finally {
      consultando = false;

      if (ativo) {
        setCarregando(false);
      }
    }
  }

  atualizarAutomaticamente();

  const intervalo = setInterval(() => {
    if (document.visibilityState === "visible") {
      atualizarAutomaticamente();
    }
  }, 3000);

  return () => {
    ativo = false;
    clearInterval(intervalo);
  };
}, [itemId, interlocutorId]);

  useEffect(() => {
    finalMensagensRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [mensagens]);

  async function enviarMensagem(event) {
    event.preventDefault();

    if (!texto.trim() || enviando) return;

    setEnviando(true);
    setErro("");

    try {
      await messageService.send(itemId, {
        receiver_id: interlocutorId,
        content: texto.trim(),
      });

      setTexto("");
      await carregarMensagens();
    } catch (error) {
      setErro(error.message || "Erro ao enviar mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  function formatarHorario(data) {
    if (!data) return "";

    const dataMensagem = new Date(data);

    if (Number.isNaN(dataMensagem.getTime())) {
      return "";
    }

    return dataMensagem.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatarData(data) {
    if (!data) return "";

    const dataMensagem = new Date(data);

    if (Number.isNaN(dataMensagem.getTime())) {
      return "";
    }

    return dataMensagem.toLocaleDateString("pt-BR");
  }

  let ultimaData = "";

  return (
    <section className="claim-chat">
      <header className="claim-chat-header">
        <div className="claim-chat-avatar">
          {(interlocutorNome || "F").charAt(0).toUpperCase()}
        </div>

        <div className="claim-chat-contact">
          <strong>{interlocutorNome || "Funcionário"}</strong>
          <span>Conversa sobre o objeto</span>
        </div>

        <button
          type="button"
          className="claim-chat-refresh"
          onClick={carregarMensagens}
          title="Atualizar mensagens"
          aria-label="Atualizar mensagens"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 11a8 8 0 0 0-14-5L4 8" />
            <path d="M4 4v4h4" />
            <path d="M4 13a8 8 0 0 0 14 5l2-2" />
            <path d="M16 16h4v4" />
          </svg>
        </button>
      </header>

      <div className="claim-chat-messages">
        {carregando && mensagens.length === 0 && (
          <div className="claim-chat-empty">
            Carregando mensagens...
          </div>
        )}

        {!carregando && mensagens.length === 0 && (
          <div className="claim-chat-empty">
            <div className="claim-chat-empty-icon">✉</div>
            <strong>Inicie a conversa</strong>
            <p>Envie uma mensagem para começar.</p>
          </div>
        )}

        {mensagens.map((mensagem) => {
          const minha =
            String(mensagem.sender_id) === String(meuId);

          const dataAtual = formatarData(mensagem.created_at);
          const mostrarData = dataAtual && dataAtual !== ultimaData;

          ultimaData = dataAtual;

          return (
            <div key={mensagem.id}>
              {mostrarData && (
                <div className="claim-chat-date">
                  <span>{dataAtual}</span>
                </div>
              )}

              <div
                className={`claim-chat-message-row ${
                  minha ? "sent" : "received"
                }`}
              >
                <div className="claim-chat-bubble">
                  <p>{mensagem.content}</p>

                  <span className="claim-chat-time">
                    {formatarHorario(mensagem.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={finalMensagensRef} />
      </div>

      {erro && (
        <div className="claim-chat-error" role="alert">
          {erro}
        </div>
      )}

      <form className="claim-chat-footer" onSubmit={enviarMensagem}>
        <textarea
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Digite sua mensagem..."
          maxLength={5000}
          rows={1}
          required
          aria-label="Digite sua mensagem"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();

              if (!event.nativeEvent.isComposing) {
                event.currentTarget.form?.requestSubmit();
              }
            }
          }}
        />

        <button
          type="submit"
          className="claim-chat-send"
          disabled={enviando || !texto.trim()}
          aria-label="Enviar mensagem"
          title="Enviar mensagem"
        >
          {enviando ? (
            <span className="claim-chat-spinner" />
          ) : (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          )}
        </button>
      </form>
      {permitirDevolucao && (
  <div className="claim-chat-devolucao-action">
    <button
      type="button"
      onClick={() => setMostrarDevolucao(true)}
    >
      Seguir para devolução →
    </button>
  </div>
)}

{mostrarDevolucao && (
  <DevolucaoFlow
    claimId={claimId}
    pickupAt={pickupAt}
    onReturned={onReturned}
    nomeUsuario={interlocutorNome}
    nomeObjeto={nomeObjeto}
    onFechar={() => setMostrarDevolucao(false)}
  />
)}
    </section>
  );
}
