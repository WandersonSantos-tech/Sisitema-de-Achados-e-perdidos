
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../../../services/adminService";
import { claimService } from "../../../services/claimService";
import "./DevolucoesPage.css";

const formatDate = (value) => {
  if (!value) return "Não agendada";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data inválida"
    : date.toLocaleString("pt-BR");
};

const localDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const statusText = {
  not_requested: "Aguardando preparação",
  pending: "Aguardando aceite do usuário",
  accepted: "Aguardando assinatura do usuário",
  signed: "Documento assinado",
  rejected: "Proposta recusada",
};

export default function DevolucoesPage() {
  const [params] = useSearchParams();
  const claimSelecionada = params.get("claim");

  const [claims, setClaims] = useState([]);
  const [signatures, setSignatures] = useState({});
  const [datas, setDatas] = useState({});
  const [active, setActive] = useState(claimSelecionada);
  const [tab, setTab] = useState("andamento");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const all = [];
      let page = 1;

      // A API administrativa usa paginação.
      // Limite defensivo para evitar requisições ilimitadas.
      while (page <= 50) {
        const result = await adminService.claims({
          page,
          page_size: 100,
        });

        const items = result.items || [];
        all.push(...items);

        const total = Number(result.total);

            if (
            items.length === 0 ||
            (Number.isFinite(total) && total > 0 && all.length >= total) ||
            items.length < 100
            ) {
            break;
            }
        page += 1;
      }

      setClaims(all);
      setDatas((old) => {
        const next = { ...old };
        all.forEach((claim) => {
          if (claim.pickup_at && !next[claim.id]) {
            next[claim.id] = localDateTime(claim.pickup_at);
          }
        });
        return next;
      });

      const candidates = all;

      const results = await Promise.allSettled(
        candidates.map((c) => claimService.signatureStatus(c.id))
      );

      const next = {};
      candidates.forEach((c, index) => {
        if (results[index].status === "fulfilled") {
          next[c.id] = results[index].value;
        }
      });
      setSignatures(next);
    } catch (e) {
      setError(e.message || "Não foi possível carregar as devoluções.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (claimSelecionada) {
      setActive(claimSelecionada);
      setTab("andamento");
    }
  }, [claimSelecionada]);

  const eligible = useMemo(
    () => claims,
    [claims]
    );

  const filtered = eligible.filter((c) => {
    const text = [
      c.item?.title,
      c.requester?.name,
      c.requester?.email,
      c.id,
    ].join(" ").toLowerCase();

    if (!text.includes(search.toLowerCase())) return false;

    if (tab === "concluidas") return Boolean(c.returned_at);
    if (tab === "documentos")
      return ["pending", "accepted", "signed", "rejected"]
        .includes(signatures[c.id]?.status);
    return !c.returned_at;
  });

  const selected =
  eligible.find(
    (c) => String(c.id) === String(active)
  ) || null;

  const selectedSignature = selected
    ? signatures[selected.id] || { status: "not_requested" }
    : null;

  const stats = {
    andamento: eligible.filter((c) => !c.returned_at).length,
    documentos: eligible.filter((c) =>
      ["pending", "accepted", "signed", "rejected"]
        .includes(signatures[c.id]?.status)
    ).length,
    concluidas: eligible.filter((c) => c.returned_at).length,
  };

  async function executar(id, action, message) {
    setBusy(String(id));
    setError("");
    setSuccess("");

    try {
      await action();
      setSuccess(message);
      await carregar();
    } catch (e) {
      setError(e.message || "Não foi possível concluir a operação.");
    } finally {
      setBusy("");
    }
  }

  async function abrirPdf(id, signed) {
    setBusy(String(id));
    setError("");
    let url;

    try {
      url = await claimService.openReturnPdf(id, signed);
      const janela = window.open(url, "_blank", "noopener,noreferrer");

      if (!janela) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      if (url) URL.revokeObjectURL(url);
      setError(e.message || "Erro ao abrir documento.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="returns-page">
      <div className="returns-intro">
        <div>
          <span className="returns-eyebrow">CENTRAL DE DEVOLUÇÕES</span>
          <h2>Gestão de devoluções</h2>
          <p>
            Acompanhe agendamentos, termos eletrônicos,
            assinaturas e entregas físicas.
          </p>
        </div>
        <button type="button" onClick={carregar} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar dados"}
        </button>
      </div>

      <div className="returns-stats">
        <div>
          <span>Em andamento</span>
          <strong>{stats.andamento}</strong>
        </div>
        <div>
          <span>Com documentos</span>
          <strong>{stats.documentos}</strong>
        </div>
        <div>
          <span>Devoluções concluídas</span>
          <strong>{stats.concluidas}</strong>
        </div>
      </div>

      {error && <p className="returns-alert error" role="alert">{error}</p>}
      {success && <p className="returns-alert success" role="status">{success}</p>}

      <div className="returns-tabs">
        {[
          ["andamento", "Em andamento"],
          ["documentos", "Documentos"],
          ["concluidas", "Concluídas"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "selected" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="returns-layout">
        <aside className="returns-list">
          <input
            type="search"
            placeholder="Buscar objeto ou solicitante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {loading && <p>Carregando solicitações...</p>}

          {!loading && filtered.length === 0 && (
            <p>Nenhuma devolução encontrada nesta categoria.</p>
          )}

          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`returns-list-item ${
                String(active) === String(c.id) ? "active" : ""
              }`}
              onClick={() => setActive(String(c.id))}
            >
              <strong>{c.item?.title || "Objeto sem título"}</strong>
              <span>{c.requester?.name || "Solicitante"}</span>
              <small>
                {c.returned_at
                  ? "Devolvido"
                  : statusText[signatures[c.id]?.status] ||
                    (c.pickup_at ? "Retirada agendada" : "Em negociação")}
              </small>
            </button>
          ))}
        </aside>

        <section className="returns-detail">
          {!selected ? (
            <div className="returns-empty">
              <h3>Selecione uma solicitação</h3>
              <p>
                Escolha um objeto na lista para visualizar
                o processo de devolução.
              </p>
            </div>
          ) : (
            <>
              <div className="returns-detail-header">
                <div>
                  <span className="returns-eyebrow">PROCESSO DE DEVOLUÇÃO</span>
                  <h3>{selected.item?.title || "Objeto"}</h3>
                  <p>{selected.requester?.name}</p>
                  <p>{selected.requester?.email}</p>
                </div>
                <span className="returns-status">
                  {selected.returned_at
                    ? "Devolvido"
                    : statusText[selectedSignature?.status] ||
                      "Em preparação"}
                </span>
              </div>

              <div className="returns-steps">
                <span className={selected.pickup_at ? "done" : ""}>
                  1. Agendamento
                </span>
                <span className={selectedSignature?.status !== "not_requested" ? "done" : ""}>
                  2. Documento
                </span>
                <span className={selectedSignature?.status === "signed" ? "done" : ""}>
                  3. Assinatura
                </span>
                <span className={selected.returned_at ? "done" : ""}>
                  4. Entrega
                </span>
              </div>

              <div className="returns-section">
                <h4>Agendamento da retirada</h4>

                {selected.pickup_at ? (
                  <div className="returns-confirmed">
                    <strong>Retirada agendada</strong>
                    <p>{formatDate(selected.pickup_at)}</p>
                    <small>
                      O agendamento está registrado e não
                      será solicitado novamente.
                    </small>
                  </div>
                ) : (
                  <>
                    <label htmlFor="returns-pickup">Data e hora</label>
                    <input
                      id="returns-pickup"
                      type="datetime-local"
                      value={datas[selected.id] || ""}
                      onChange={(e) =>
                        setDatas((old) => ({
                          ...old,
                          [selected.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      disabled={
                        busy !== "" ||
                        !datas[selected.id] ||
                        new Date(datas[selected.id]) <= new Date()
                      }
                      onClick={() => executar(
                        selected.id,
                        () => claimService.schedule(
                          selected.id,
                          new Date(datas[selected.id]).toISOString()
                        ),
                        "Agendamento salvo com sucesso."
                      )}
                    >
                      Salvar agendamento
                    </button>
                  </>
                )}
              </div>

              <div className="returns-section">
                <h4>Termo de devolução</h4>

                {!selected.pickup_at ? (
                  <p>Agende a retirada para preparar o documento.</p>
                ) : selectedSignature?.status === "not_requested" ? (
                  <>
                    <p>
                      O termo ainda não foi emitido.
                    </p>
                    <button
                      type="button"
                      disabled={busy !== ""}
                      onClick={() => executar(
                        selected.id,
                        () => claimService.requestSignature(selected.id),
                        "Termo disponibilizado para assinatura."
                      )}
                    >
                      Emitir termo de devolução
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Situação:</strong>{" "}
                      {statusText[selectedSignature?.status] ||
                        selectedSignature?.status}
                    </p>

                    <div className="returns-actions">
                      <button
                        type="button"
                        disabled={busy !== ""}
                        onClick={() => abrirPdf(
                          selected.id,
                          selectedSignature?.status === "signed"
                        )}
                      >
                        Visualizar PDF
                      </button>

                      {selectedSignature?.status === "signed" && (
                        <button
                          type="button"
                          className="secondary"
                          disabled={busy !== ""}
                          onClick={() => executar(
                            selected.id,
                            () => claimService.downloadSignedPdf(selected.id),
                            "Download iniciado."
                          )}
                        >
                          Baixar PDF assinado
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="returns-section">
                <h4>Assinaturas</h4>
                <p>
                  <strong>Usuário:</strong>{" "}
                  {selectedSignature?.status === "signed"
                    ? "Assinatura registrada"
                    : "Assinatura pendente"}
                </p>
                <p>
                  <strong>Funcionário:</strong>{" "}
                  Aguardando implementação da assinatura dupla.
                </p>
              </div>

              <div className="returns-section">
                <h4>Entrega física</h4>

                {selected.returned_at ? (
                  <div className="returns-confirmed">
                    <strong>Objeto devolvido</strong>
                    <p>{formatDate(selected.returned_at)}</p>
                  </div>
                ) : (
                  <>
                    <p>
                      A entrega só deve ser confirmada quando o
                      objeto for efetivamente entregue ao solicitante.
                    </p>
                    <button
                      type="button"
                      disabled={
                        busy !== "" ||
                        selectedSignature?.status !== "signed"
                      }
                      onClick={() => {
                        if (!window.confirm(
                          "O objeto foi entregue fisicamente ao solicitante?"
                        )) return;

                        executar(
                          selected.id,
                          () => claimService.completeReturn(selected.id),
                          "Entrega física confirmada."
                        );
                      }}
                    >
                      Confirmar entrega física
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
