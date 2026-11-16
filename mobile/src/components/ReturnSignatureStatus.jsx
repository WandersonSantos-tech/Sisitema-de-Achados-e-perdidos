
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  API_URL,
  apiRequest,
  storage,
} from "../services/api";

import AssinaturaManuscrita from "./AssinaturaManuscrita";

const BASE_CLAIMS = "/claims/claims";

const SITUACOES = {
  not_requested: "Aguardando proposta",
  pending: "Proposta enviada",
  accepted: "Aguardando assinatura",
  signed: "Documento assinado",
  rejected: "Proposta recusada",
};

function Botao({
  title,
  onPress,
  disabled,
  tipo = "primary",
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: !!disabled,
      }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        styles[tipo],
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          tipo !== "primary" && styles.darkText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export default function ReturnSignatureStatus({
  claimId,
}) {
  const [status, setStatus] = useState(null);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdfVisualizado, setPdfVisualizado] =
    useState(false);
  const [imagem, setImagem] = useState("");
  const [consentimento, setConsentimento] =
    useState(false);
  const [motivo, setMotivo] = useState("");

  const atualizar = useCallback(async () => {
    const data = await apiRequest(
      `${BASE_CLAIMS}/${claimId}/signature`
    );

    setStatus(data);

    return data;
  }, [claimId]);

  useEffect(() => {
    let ativo = true;

    setLoading(true);
    setStatus(null);
    setErro("");
    setPdfVisualizado(false);
    setImagem("");
    setConsentimento(false);
    setMotivo("");

    apiRequest(
      `${BASE_CLAIMS}/${claimId}/signature`
    )
      .then((data) => {
        if (!ativo) return;

        setStatus(data);
      })
      .catch((error) => {
        if (!ativo) return;

        setErro(
          error?.message ||
            "Erro ao consultar assinatura."
        );
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [claimId]);

  async function executar(acao) {
    if (busy) {
      return;
    }

    setBusy(true);
    setErro("");

    try {
      await acao();
      await atualizar();
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível continuar."
      );
    } finally {
      setBusy(false);
    }
  }

  async function abrirPdf(assinado = false) {
    await executar(async () => {
      const token = await storage.getToken();

      if (!token) {
        throw new Error(
          "Sessão expirada. Entre novamente."
        );
      }

      const tipo = assinado ? "pdf" : "preview";

      const url =
        `${API_URL}${BASE_CLAIMS}/${claimId}/signature/${tipo}`;

      const nome = assinado
        ? `termo-devolucao-${claimId}-assinado.pdf`
        : `termo-devolucao-${claimId}.pdf`;

      const destino =
        `${FileSystem.cacheDirectory}${nome}`;

      const resultado =
        await FileSystem.downloadAsync(
          url,
          destino,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/pdf",
            },
          }
        );

      if (resultado.status !== 200) {
        throw new Error(
          `Erro ao carregar PDF: HTTP ${resultado.status}`
        );
      }

      const disponivel =
        await Sharing.isAvailableAsync();

      if (!disponivel) {
        throw new Error(
          "Visualização de PDF indisponível."
        );
      }

      await Sharing.shareAsync(resultado.uri, {
        mimeType: "application/pdf",
        dialogTitle: assinado
          ? "Documento assinado"
          : "Termo de devolução",
        UTI: "com.adobe.pdf",
      });

      if (!assinado) {
        setPdfVisualizado(true);
      }
    });
  }

  async function aceitar() {
    await executar(async () => {
      await apiRequest(
        `${BASE_CLAIMS}/${claimId}/signature/accept`,
        {
          method: "POST",
        }
      );

      setPdfVisualizado(false);
    });
  }

  async function recusar() {
    const reason = motivo.trim();

    if (reason.length < 3) {
      setErro("Informe o motivo da recusa.");
      return;
    }

    await executar(async () => {
      await apiRequest(
        `${BASE_CLAIMS}/${claimId}/signature/reject`,
        {
          method: "POST",
          body: JSON.stringify({
            reason,
          }),
        }
      );

      setMotivo("");
      setPdfVisualizado(false);
    });
  }

  function receberAssinatura(valor) {
    setImagem(valor || "");
  }

  async function assinar() {
    if (!imagem) {
      setErro(
        "Desenhe e confirme sua assinatura."
      );
      return;
    }

    if (!imagem.startsWith(
      "data:image/png;base64,"
    )) {
      setErro(
        "Formato da assinatura inválido."
      );
      return;
    }

    if (!consentimento) {
      setErro(
        "Marque o consentimento para assinar."
      );
      return;
    }

    await executar(async () => {
      const endpoint =
        `${BASE_CLAIMS}/${claimId}/signature/sign`;

      await apiRequest(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({
            consent: true,
            image: imagem,
          }),
          timeoutMs: 120000,
        }
      );

      setImagem("");
      setConsentimento(false);
      setPdfVisualizado(false);
    });
  }

  const situacao = status?.status;

  const mostrarPdf = [
    "pending",
    "accepted",
    "signed",
  ].includes(situacao);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        DOCUMENTO ELETRÔNICO
      </Text>

      <Text style={styles.title}>
        Termo de devolução
      </Text>

      <Text style={styles.subtitle}>
        {SITUACOES[situacao] ||
          "Consultando situação..."}
      </Text>

      {loading && (
        <ActivityIndicator
          size="small"
          color="#1d4ed8"
        />
      )}

      {!!erro && (
        <Text style={styles.error}>
          {erro}
        </Text>
      )}

      {mostrarPdf && (
        <Botao
          tipo="secondary"
          disabled={busy}
          title={
            situacao === "signed"
              ? "Visualizar PDF assinado"
              : "Abrir termo completo (4 páginas)"
          }
          onPress={() =>
            abrirPdf(situacao === "signed")
          }
        />
      )}

      {pdfVisualizado &&
        situacao !== "signed" && (
          <Text style={styles.info}>
            Documento aberto para consulta.
          </Text>
        )}

      {situacao === "pending" && (
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Leia o documento completo antes
            de aceitar a proposta.
          </Text>

          <Botao
            title="Aceitar proposta"
            disabled={
              busy || !pdfVisualizado
            }
            onPress={aceitar}
          />

          <Text style={styles.fieldLabel}>
            Motivo da recusa
          </Text>

          <TextInput
            style={styles.textarea}
            multiline
            numberOfLines={3}
            maxLength={500}
            placeholder="Explique por que deseja recusar"
            placeholderTextColor="#94a3b8"
            textAlignVertical="top"
            editable={!busy}
            value={motivo}
            onChangeText={setMotivo}
          />

          <Botao
            tipo="danger"
            title="Recusar proposta"
            disabled={
              busy ||
              motivo.trim().length < 3
            }
            onPress={recusar}
          />
        </View>
      )}

      {situacao === "accepted" && (
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Desenhe sua assinatura.
            Não é necessário manter
            o PDF aberto.
          </Text>

          <AssinaturaManuscrita
            disabled={busy}
            onConfirmar={receberAssinatura}
          />

          <Pressable
            style={styles.consentRow}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: consentimento,
            }}
            disabled={busy}
            onPress={() =>
              setConsentimento(
                (atual) => !atual
              )
            }
          >
            <View
              style={[
                styles.checkbox,
                consentimento &&
                  styles.checkboxChecked,
              ]}
            >
              {consentimento && (
                <Text
                  style={styles.checkmark}
                >
                  ✓
                </Text>
              )}
            </View>

            <Text style={styles.consentText}>
              Li o termo de devolução
              e concordo em incorporar
              minha assinatura manuscrita
              ao documento eletrônico.
            </Text>
          </Pressable>

          <Botao
            title="Finalizar assinatura do documento"
            disabled={
              busy ||
              !imagem ||
              !consentimento
            }
            onPress={assinar}
          />
        </View>
      )}

      {situacao === "signed" && (
        <View style={styles.section}>
          <Text style={styles.success}>
            ✓ Documento assinado e registrado.
          </Text>

          <Botao
            title="Baixar documento assinado"
            disabled={busy}
            onPress={() => abrirPdf(true)}
          />
        </View>
      )}

      {busy && (
        <ActivityIndicator
          size="small"
          color="#1d4ed8"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
    padding: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 16,
    width: "100%",
  },

  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#2563eb",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 8,
    color: "#14264b",
  },

  subtitle: {
    color: "#64748b",
    marginBottom: 18,
    fontSize: 14,
  },

  section: {
    marginTop: 18,
    gap: 10,
  },

  paragraph: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 22,
  },

  button: {
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  primary: {
    backgroundColor: "#1d4ed8",
    borderColor: "#1d4ed8",
  },

  secondary: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },

  danger: {
    backgroundColor: "#fff",
    borderColor: "#fecaca",
  },

  disabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },

  darkText: {
    color: "#1e40af",
  },

  error: {
    padding: 12,
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 8,
    marginVertical: 10,
  },

  info: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#eff6ff",
    color: "#1e40af",
    borderRadius: 8,
    fontSize: 13,
  },

  fieldLabel: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#14264b",
  },

  textarea: {
    width: "100%",
    minHeight: 90,
    padding: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    color: "#14264b",
    backgroundColor: "#fff",
  },

  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginVertical: 20,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  checkboxChecked: {
    backgroundColor: "#1d4ed8",
  },

  checkmark: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  consentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
  },

  success: {
    color: "#15803d",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
});
