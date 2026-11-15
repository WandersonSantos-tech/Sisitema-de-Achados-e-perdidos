
import { useEffect, useState } from "react";
import { claimService } from "../services/claimService";
import AssinaturaManuscrita from "./AssinaturaManuscrita";
import "./ReturnSignatureStatus.css";

export default function ReturnSignatureStatus({ claimId }) {
  const [status, setStatus] = useState(null);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [imagem, setImagem] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [motivo, setMotivo] = useState("");

  async function atualizar() {
    const data = await claimService.signatureStatus(claimId);
    setStatus(data);
  }

  useEffect(() => {
    let ativo = true;

    claimService.signatureStatus(claimId)
      .then((data) => {
        if (ativo) setStatus(data);
      })
      .catch((e) => {
        if (ativo) setErro(e.message);
      });

    return () => {
      ativo = false;
    };
  }, [claimId]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  async function executar(acao) {
    setBusy(true);
    setErro("");

    try {
      await acao();
      await atualizar();
    } catch (e) {
      setErro(e.message || "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }

  async function abrirPdf(signed = false) {
    await executar(async () => {
      const url = await claimService.openReturnPdf(
        claimId,
        signed
      );
      setPdfUrl(url);
    });
  }

  const situacoes = {
    not_requested: "Aguardando proposta",
    pending: "Proposta enviada",
    accepted: "Aguardando assinatura",
    signed: "Documento assinado",
    rejected: "Proposta recusada",
  };

  return (
    <section className="return-signature">
      <div className="return-signature-header">
        <div>
          <span className="return-signature-label">
            DOCUMENTO ELETRÔNICO
          </span>

          <h3>Termo de devolução</h3>

          <p>
            {situacoes[status?.status] ||
              "Consultando situação..."}
          </p>
        </div>
      </div>

      {erro && (
        <p className="return-signature-error" role="alert">
          {erro}
        </p>
      )}

      {["pending", "accepted", "signed"].includes(
        status?.status
      ) && (
        <button
          type="button"
          className="return-signature-button secondary"
          disabled={busy}
          onClick={() =>
            abrirPdf(status.status === "signed")
          }
        >
          {status.status === "signed"
            ? "Visualizar PDF assinado"
            : "Abrir termo completo (4 páginas)"}
        </button>
      )}

      {pdfUrl && (
        <div className="return-signature-viewer">
          <div className="return-signature-viewer-header">
            <strong>Visualização do documento</strong>

            <button
              type="button"
              onClick={() => setPdfUrl("")}
            >
              Fechar
            </button>
          </div>

          <iframe
            src={pdfUrl}
            title="Termo de devolução em PDF"
          />
        </div>
      )}

      {status?.status === "pending" && (
        <div className="return-signature-section">
          <p>
            Leia o documento completo antes de aceitar
            a proposta de devolução.
          </p>

          <div className="return-signature-actions">
            <button
              type="button"
              className="return-signature-button primary"
              disabled={busy || !pdfUrl}
              onClick={() =>
                executar(() =>
                  claimService.acceptSignature(claimId)
                )
              }
            >
              Aceitar proposta
            </button>
          </div>

          <label className="return-signature-field">
            Motivo da recusa
            <textarea
              value={motivo}
              maxLength={500}
              rows={2}
              placeholder="Explique por que deseja recusar"
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="return-signature-button danger"
            disabled={busy || motivo.trim().length < 3}
            onClick={() =>
              executar(() =>
                claimService.rejectSignature(
                  claimId,
                  motivo.trim()
                )
              )
            }
          >
            Recusar proposta
          </button>
        </div>
      )}

      {status?.status === "accepted" && (
        <div className="return-signature-section">
          <AssinaturaManuscrita
            disabled={busy}
            onConfirmar={setImagem}
          />

          <label className="return-signature-consent">
            <input
              type="checkbox"
              checked={consentimento}
              onChange={(e) =>
                setConsentimento(e.target.checked)
              }
            />

            <span>
              Li o termo de devolução e concordo em
              incorporar minha assinatura manuscrita
              ao documento eletrônico.
            </span>
          </label>

          <button
            type="button"
            className="return-signature-button primary"
            disabled={
              busy ||
              !imagem ||
              !consentimento ||
              !pdfUrl
            }
            onClick={() =>
              executar(async () => {
                await claimService.signSignature(
                  claimId,
                  imagem
                );
                setPdfUrl("");
              })
            }
          >
            Finalizar assinatura do documento
          </button>
        </div>
      )}

      {status?.status === "signed" && (
        <div className="return-signature-section">
          <p className="return-signature-success">
            ✓ Documento assinado e registrado.
          </p>

          <button
            type="button"
            className="return-signature-button primary"
            disabled={busy}
            onClick={() =>
              executar(async () => {
                const url =
                  await claimService.openReturnPdf(
                    claimId,
                    true
                  );

                const link = document.createElement("a");
                link.href = url;
                link.download = `termo-devolucao-${claimId}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();

                setTimeout(
                  () => URL.revokeObjectURL(url),
                  30000
                );
              })
            }
          >
            Baixar documento assinado
          </button>
        </div>
      )}
    </section>
  );
}
