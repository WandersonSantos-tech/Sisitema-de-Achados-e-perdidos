
import { useState } from "react";
import "./DevolucaoFlow.css";
import { claimService } from "../services/claimService";

const localPickupTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);
};

export default function DevolucaoFlow({
  claimId,
  pickupAt,
  onReturned,
  nomeUsuario = "Usuário",
  nomeObjeto = "Objeto",
  onFechar,
}) {
  const [pickup, setPickup] = useState(
    localPickupTime(pickupAt)
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [etapa, setEtapa] = useState(1);
  const [confirmado, setConfirmado] = useState(false);
  const [signature, setSignature] = useState(null);
  const [concluido, setConcluido] = useState(false);

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
                ? "Devolução concluída"
                : etapa === 1
                  ? "Confirmação de devolução"
                  : "Coleta de assinatura"}
            </h2>

            <p>
              {concluido
                ? "Entrega física confirmada pelo funcionário."
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

            <div
              className={`devolucao-etapa ${
                etapa === 2 ? "ativa" : ""
              }`}
            >
              <span>2</span>
              Assinatura
            </div>
          </div>
        )}

        <div className="devolucao-conteudo">
          {error && <p role="alert">{error}</p>}

          {concluido ? (
            <div className="devolucao-sucesso">
              <div className="devolucao-sucesso-icone">
                ✓
              </div>

              <h3>Assinatura confirmada!</h3>

              <p>
                O objeto foi marcado como devolvido.
                A retirada foi registrada com termo
                assinado eletronicamente.
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
                Esta etapa representa a conferência
                das informações antes da retirada do objeto.
              </div>

              <label>
                Data e hora da retirada
                <input
                  type="datetime-local"
                  required
                  value={pickup}
                  onChange={(event) =>
                    setPickup(event.target.value)
                  }
                />
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
                  Confirmo que as informações foram
                  conferidas e desejo prosseguir para
                  a coleta da assinatura.
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
                    setBusy(true);
                    setError("");

                    try {
                      const dataRetirada = new Date(pickup);

                      if (
                        Number.isNaN(dataRetirada.getTime()) ||
                        (
                          pickup !== localPickupTime(pickupAt) &&
                          dataRetirada <= new Date()
                        )
                      ) {
                        setError(
                          "Escolha uma data e horário futuros para a retirada."
                        );
                        return;
                      }

                      if (
                        pickup !== localPickupTime(pickupAt)
                      ) {
                        await claimService.schedule(
                          claimId,
                          dataRetirada.toISOString()
                        );
                      }

                      setSignature(
                        await claimService.requestSignature(
                          claimId
                        )
                      );

                      setEtapa(2);
                    } catch (err) {
                      console.error(
                        "Erro ao agendar retirada:",
                        err
                      );

                      setError(
                        err?.response?.data?.detail ||
                        err?.detail ||
                        err?.message ||
                        "Não foi possível agendar a retirada."
                      );
                    } finally {
                      setBusy(false);
                    }
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
                  O usuário deve aceitar e assinar o termo
                  em Minhas solicitações.
                </p>

                <div className="devolucao-campo">
                  <span>Nome</span>
                  <strong>{nomeUsuario}</strong>
                </div>
              </div>

              <div className="devolucao-assinatura">
                <p role="status">
                  Situação: {signature?.status || "pending"}
                </p>


                <div className="devolucao-aviso">
                  <p>
                    O termo de devolução de quatro páginas foi
                    disponibilizado ao solicitante.
                  </p>

                  <p>
                    O usuário deverá acessar Minhas solicitações,
                    visualizar o documento completo e desenhar sua
                    assinatura com o mouse, dedo ou caneta.
                  </p>

                  <p>
                    <strong>Situação:</strong>{" "}
                    {signature?.status === "pending"
                      ? "Aguardando aceite do usuário"
                      : signature?.status === "accepted"
                        ? "Aguardando assinatura manuscrita"
                        : signature?.status === "signed"
                          ? "Documento assinado com sucesso"
                          : signature?.status === "rejected"
                            ? "Proposta recusada"
                            : "Aguardando atualização"}
                  </p>
                </div>


                {signature?.status === "rejected" && (
                  <p>
                    A proposta foi recusada.
                    Feche esta janela e faça um novo agendamento.
                  </p>
                )}


                {signature?.status === "signed" && (
                  <button
                    type="button"
                    className="devolucao-secundario"
                    onClick={async () => {
                      try {
                        setError("");

                        const url = await claimService.openReturnPdf(
                          claimId,
                          true
                        );

                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `termo-devolucao-${claimId}.pdf`;

                        document.body.appendChild(link);
                        link.click();
                        link.remove();

                        setTimeout(() => {
                          URL.revokeObjectURL(url);
                        }, 30000);
                      } catch (err) {
                        setError(
                          err.message || "Erro ao baixar o termo."
                        );
                      }
                    }}
                  >
                    Baixar termo assinado (PDF)
                  </button>
                )}


                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");

                    try {
                      setSignature(
                        await claimService.signatureStatus(
                          claimId
                        )
                      );
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Consultar assinatura
                </button>

                <p>
                  A assinatura eletrônica é registrada
                  no Onde Tá. Confirme a devolução somente
                  após entregar fisicamente o objeto.
                </p>
              </div>

              <div className="devolucao-acoes">
                <button
                  type="button"
                  className="devolucao-secundario"
                  onClick={() => setEtapa(1)}
                >
                  ← Voltar
                </button>

                <button
                  type="button"
                  className="devolucao-primario"
                  disabled={
                    signature?.status !== "signed" || busy
                  }
                  onClick={async () => {
                    setBusy(true);
                    setError("");

                    try {
                      await claimService.completeReturn(
                        claimId
                      );

                      setConcluido(true);
                      onReturned?.();
                    } catch (error) {
                      setError(error.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Confirmar entrega física
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
