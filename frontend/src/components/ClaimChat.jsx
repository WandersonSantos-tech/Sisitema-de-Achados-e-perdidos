
import { useCallback, useEffect, useState } from "react";
import { messageService } from "../services/messageService";
import { authService } from "../services/authService";

export default function ClaimChat({
  itemId,
  interlocutorId,
  interlocutorNome,
}) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const meuId = authService.getUsuario()?.id;

  const carregarMensagens = useCallback(async () => {
    if (!itemId || !interlocutorId) return;

    try {
      const resposta = await messageService.conversation(
        itemId,
        interlocutorId
      );

      setMensagens(resposta.messages || []);
      setErro("");
    } catch (error) {
      setErro(error.message || "Erro ao carregar mensagens.");
    }
  }, [itemId, interlocutorId]);

  useEffect(() => {
    carregarMensagens();
  }, [carregarMensagens]);

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

  return (
    <section
      style={{
        marginTop: 20,
        padding: 20,
        border: "1px solid #d7dfeb",
        borderRadius: 12,
        background: "#f8fafc",
      }}
    >
      <h3>Conversa com {interlocutorNome || "funcionário"}</h3>

      <button
        type="button"
        onClick={carregarMensagens}
      >
        Atualizar mensagens
      </button>

      {erro && <p role="alert">{erro}</p>}

      <div
        style={{
          display: "grid",
          gap: 12,
          maxHeight: 350,
          overflowY: "auto",
          margin: "20px 0",
        }}
      >
        {mensagens.length === 0 && (
          <p>Nenhuma mensagem enviada ainda.</p>
        )}

        {mensagens.map((mensagem) => {
          const minha =
            String(mensagem.sender_id) === String(meuId);

          return (
            <div
              key={mensagem.id}
              style={{
                padding: 14,
                borderRadius: 10,
                background: minha ? "#dbeafe" : "#ffffff",
              }}
            >
              <strong>
                {minha
                  ? "Você"
                  : mensagem.sender?.name ||
                    interlocutorNome ||
                    "Funcionário"}
              </strong>

              <p style={{ whiteSpace: "pre-wrap" }}>
                {mensagem.content}
              </p>

              <small>
                {mensagem.created_at
                  ? new Date(
                      mensagem.created_at
                    ).toLocaleString("pt-BR")
                  : ""}
              </small>
            </div>
          );
        })}
      </div>

      <form onSubmit={enviarMensagem}>
        <textarea
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Digite sua mensagem..."
          maxLength={5000}
          required
          style={{
            width: "100%",
            minHeight: 90,
            padding: 12,
            borderRadius: 8,
          }}
        />

        <button
          type="submit"
          disabled={enviando || !texto.trim()}
        >
          {enviando ? "Enviando..." : "Enviar mensagem"}
        </button>
      </form>
    </section>
  );
}
