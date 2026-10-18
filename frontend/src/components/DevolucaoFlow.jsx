
import { useEffect, useRef, useState } from "react";
import "./DevolucaoFlow.css";
import { claimService } from "../services/claimService";

const localPickupTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function DevolucaoFlow({
  claimId,
  pickupAt,
  onReturned,
  nomeUsuario = "Usuário",
  nomeObjeto = "Objeto",
  onFechar,
}) {
  const [pickup, setPickup] = useState(localPickupTime(pickupAt));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const [confirmado, setConfirmado] = useState(false);
  const [assinado, setAssinado] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const canvasRef = useRef(null);
  const desenhandoRef = useRef(false);

  useEffect(() => {
    if (etapa !== 2) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const contexto = canvas.getContext("2d");

    contexto.strokeStyle = "#183b69";
    contexto.lineWidth = 2.5;
    contexto.lineCap = "round";
    contexto.lineJoin = "round";
  }, [etapa]);

  function obterPosicao(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function iniciarDesenho(event) {
    const canvas = canvasRef.current;
    const contexto = canvas.getContext("2d");
    const { x, y } = obterPosicao(event);

    desenhandoRef.current = true;
    canvas.setPointerCapture(event.pointerId);

    contexto.beginPath();
    contexto.moveTo(x, y);
    contexto.lineTo(x + 0.1, y + 0.1);
    contexto.stroke();

    setAssinado(true);
  }

  function desenhar(event) {
    if (!desenhandoRef.current) return;

    const contexto = canvasRef.current.getContext("2d");
    const { x, y } = obterPosicao(event);

    contexto.lineTo(x, y);
    contexto.stroke();
  }

  function pararDesenho() {
    desenhandoRef.current = false;
  }

  function limparAssinatura() {
    const canvas = canvasRef.current;
    const contexto = canvas.getContext("2d");

    contexto.clearRect(0, 0, canvas.width, canvas.height);
    setAssinado(false);
  }

  return (
    <div className="devolucao-overlay">
      <section
        className="devolucao-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="devolucao-titulo"
      >
        <header className="devolucao-topo">
          <div>
            <span className="devolucao-etiqueta">
              ONDETÁ • DEVOLUÇÃO
            </span>
            <h2 id="devolucao-titulo">
              {concluido
                ? "Assinatura de demonstração"
                : etapa === 1
                  ? "Confirmação de devolução"
                  : "Coleta de assinatura"}
            </h2>
            <p>
              {concluido
                ? "Etapa visual concluída."
                : "Confira as informações antes de continuar."}
            </p>
          </div>

          <button
            type="button"
            className="devolucao-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        {!concluido && (
          <div className="devolucao-etapas">
            <div className="devolucao-etapa ativa">
              <span>1</span>
              Confirmação
            </div>

            <div className="devolucao-linha" />

            <div className={`devolucao-etapa ${etapa === 2 ? "ativa" : ""}`}>
              <span>2</span>
              Assinatura
            </div>
          </div>
        )}

        <div className="devolucao-conteudo">
          {error && <p role="alert">{error}</p>}
          {concluido ? (
            <div className="devolucao-sucesso">
              <div className="devolucao-sucesso-icone">✓</div>
              <h3>Assinatura coletada na simulação!</h3>
              <p>
                O objeto foi marcado como devolvido.
                A retirada foi registrada com assinatura simulada.
              </p>
              <button
                type="button"
                className="devolucao-primario"
                onClick={onFechar}
              >
                Voltar à conversa
              </button>
            </div>
          ) : etapa === 1 ? (
            <>
              <div className="devolucao-info">
                <h3>Informações da devolução</h3>

                <div className="devolucao-campo">
                  <span>Objeto</span>
                  <strong>{nomeObjeto}</strong>
                </div>

                <div className="devolucao-campo">
                  <span>Solicitante</span>
                  <strong>{nomeUsuario}</strong>
                </div>

                <div className="devolucao-campo">
                  <span>Procedimento</span>
                  <strong>Confirmação e assinatura</strong>
                </div>
              </div>

              <div className="devolucao-aviso">
                Esta etapa representa a conferência das
                informações antes da retirada do objeto.
              </div>

              <label>Data e hora da retirada
                <input type="datetime-local" required value={pickup} onChange={(event) => setPickup(event.target.value)} />
              </label>
              <label className="devolucao-checkbox">
                <input
                  type="checkbox"
                  checked={confirmado}
                  onChange={(event) =>
                    setConfirmado(event.target.checked)
                  }
                />
                <span>
                  Confirmo que as informações foram conferidas
                  e desejo prosseguir para a coleta da assinatura.
                </span>
              </label>

              <div className="devolucao-acoes">
                <button
                  type="button"
                  className="devolucao-secundario"
                  onClick={onFechar}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="devolucao-primario"
                  disabled={!confirmado || !pickup || busy}
                  onClick={async () => {
                    setBusy(true); setError("");
                    try {
                      
                    const dataRetirada = new Date(pickup);

                    if (
                      Number.isNaN(dataRetirada.getTime()) ||
                      dataRetirada <= new Date()
                    ) {
                      setError("Escolha uma data e horário futuros para a retirada.");
                      return;
                    }

                    if (pickup !== localPickupTime(pickupAt)) {
                      await claimService.schedule(
                        claimId,
                        dataRetirada.toISOString()
                      );
                    }

                    setEtapa(2);

                    } catch (err) {
                      console.error("Erro ao agendar retirada:", err);

                      setError(
                        err?.response?.data?.detail ||
                        err?.detail ||
                        err?.message ||
                        "Não foi possível agendar a retirada."
                      );
                    }
                    finally { setBusy(false); }
                  }}
                >
                  Continuar para assinatura →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="devolucao-info">
                <h3>Assinatura do responsável</h3>
                <p>
                  Peça ao responsável pela retirada que assine
                  no espaço abaixo.
                </p>

                <div className="devolucao-campo">
                  <span>Nome</span>
                  <strong>{nomeUsuario}</strong>
                </div>
              </div>

              <div className="devolucao-assinatura">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={260}
                  onPointerDown={iniciarDesenho}
                  onPointerMove={desenhar}
                  onPointerUp={pararDesenho}
                  onPointerCancel={pararDesenho}
                  onLostPointerCapture={pararDesenho}
                  aria-label="Área para desenhar assinatura"
                />

                <span className="devolucao-linha-assinatura">
                  Assine acima desta linha
                </span>
              </div>

              <div className="devolucao-assinatura-opcoes">
                <small>
                  Use o mouse, a caneta digital ou o dedo.
                </small>

                <button
                  type="button"
                  className="devolucao-limpar"
                  onClick={limparAssinatura}
                >
                  Limpar assinatura
                </button>
              </div>

              <div className="devolucao-aviso">
                Assinatura apenas para demonstração.
                Não possui validade de autenticação digital.
              </div>

              <div className="devolucao-acoes">
                <button
                  type="button"
                  className="devolucao-secundario"
                  onClick={() => {
                    setEtapa(1);
                    setAssinado(false);
                  }}
                >
                  ← Voltar
                </button>

                <button
                  type="button"
                  className="devolucao-primario"
                  disabled={!assinado || busy}
                  onClick={async () => {
                    setBusy(true); setError("");
                    try {
                      await claimService.completeReturn(claimId, canvasRef.current.toDataURL("image/png"));
                      setConcluido(true); onReturned?.();
                    } catch (error) { setError(error.message); }
                    finally { setBusy(false); }
                  }}
                >
                  Confirmar assinatura
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
