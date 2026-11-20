
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import Svg, { Path } from "react-native-svg";
import { captureRef } from "react-native-view-shot";

const COR = "#172554";

export default function AssinaturaManuscrita({
  onConfirmar,
  disabled = false,
}) {
  const { width, height } = useWindowDimensions();

  const [aberto, setAberto] = useState(false);
  const [tracos, setTracos] = useState([]);
  const [atual, setAtual] = useState("");
  const [confirmada, setConfirmada] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [dimensoes, setDimensoes] = useState({
    width: 0,
    height: 0,
  });

  const areaRef = useRef(null);
  const desenhandoRef = useRef(false);
  const caminhoRef = useRef("");
  const ultimoRef = useRef(null);
  const pontosRef = useRef(0);
  const movimentosRef = useRef(0);
  const tracosRef = useRef([]);
  const bloqueadoRef = useRef(false);

  const bloqueado = disabled || salvando;

  useEffect(() => {
    bloqueadoRef.current = bloqueado;
  }, [bloqueado]);

  const limparDesenho = useCallback(() => {
    desenhandoRef.current = false;
    caminhoRef.current = "";
    ultimoRef.current = null;
    pontosRef.current = 0;
    movimentosRef.current = 0;
    tracosRef.current = [];

    setTracos([]);
    setAtual("");
    setMensagem("");
  }, []);

  function abrir() {
    if (bloqueado) {
      return;
    }

    limparDesenho();
    setAberto(true);
  }

  function fechar() {
    if (salvando) return;

    setAberto(false);
  }

  function limpar() {
    if (salvando) return;

    limparDesenho();
    setConfirmada(false);
    onConfirmar?.("");
  }

  function ponto(evento) {
    const nativo = evento.nativeEvent;

    const x = Math.max(
      0,
      Math.min(
        dimensoes.width,
        Number(nativo.locationX) || 0
      )
    );

    const y = Math.max(
      0,
      Math.min(
        dimensoes.height,
        Number(nativo.locationY) || 0
      )
    );

    return {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    };
  }

  function iniciar(evento) {
    if (bloqueadoRef.current) return;

    const p = ponto(evento);

    desenhandoRef.current = true;
    ultimoRef.current = p;
    pontosRef.current = 1;
    movimentosRef.current = 0;

    caminhoRef.current = `M ${p.x} ${p.y}`;
    setAtual(caminhoRef.current);
    setMensagem("Desenhando...");
  }

  function mover(evento) {
    if (!desenhandoRef.current) return;
    if (bloqueadoRef.current) return;

    const p = ponto(evento);
    const anterior = ultimoRef.current;

    if (
      anterior &&
      Math.abs(p.x - anterior.x) < 0.5 &&
      Math.abs(p.y - anterior.y) < 0.5
    ) {
      return;
    }

    ultimoRef.current = p;

    caminhoRef.current += ` L ${p.x} ${p.y}`;
    pontosRef.current += 1;
    movimentosRef.current += 1;

    setAtual(caminhoRef.current);
  }

  function finalizar() {
    if (!desenhandoRef.current) return;

    desenhandoRef.current = false;

    let caminho = caminhoRef.current;

    if (!caminho) return;

    if (pontosRef.current === 1 && ultimoRef.current) {
      const p = ultimoRef.current;

      caminho += ` L ${p.x + 0.5} ${p.y + 0.5}`;
    }

    const novos = [...tracosRef.current, caminho];

    tracosRef.current = novos;
    setTracos(novos);

    caminhoRef.current = "";
    ultimoRef.current = null;
    pontosRef.current = 0;

    setAtual("");
    setMensagem("Traço registrado.");
  }

  async function confirmar() {
    if (bloqueado) return;

    if (tracosRef.current.length === 0) {
      Alert.alert(
        "Assinatura vazia",
        "Desenhe sua assinatura antes de confirmar."
      );
      return;
    }

    setSalvando(true);
    setMensagem("Gerando imagem da assinatura...");

    try {
      if (!areaRef.current) {
        throw new Error(
          "A área de captura não foi encontrada."
        );
      }

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const base64 = await captureRef(areaRef.current, {
        format: "png",
        result: "base64",
        quality: 1,
      });

      if (!base64 || base64.length < 100) {
        throw new Error(
          "A imagem da assinatura não foi gerada corretamente."
        );
      }

      const imagem = `data:image/png;base64,${base64}`;

      onConfirmar?.(imagem);

      setConfirmada(true);
      setMensagem("");
      setAberto(false);
    } catch (error) {
      setMensagem(
        error?.message ||
          "Não foi possível capturar a assinatura."
      );

      Alert.alert(
        "Erro ao salvar assinatura",
        error?.message ||
          "Não foi possível gerar a imagem."
      );
    } finally {
      setSalvando(false);
    }
  }

  const alturaArea = Math.max(
    150,
    Math.min(330, height * 0.38)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>
        Assinatura manuscrita
      </Text>

      <Text style={styles.descricao}>
        Abra a área de assinatura e desenhe com o dedo.
      </Text>

      <Pressable
        onPress={abrir}
        disabled={bloqueado}
        style={[
          styles.botaoPrincipal,
          bloqueado && styles.desabilitado,
        ]}
      >
        <Text style={styles.textoPrincipal}>
          {confirmada
            ? "Refazer assinatura"
            : "Assinar documento"}
        </Text>
      </Pressable>

      {confirmada && (
        <Text style={styles.sucesso}>
          ✓ Assinatura capturada. Marque o consentimento
          e finalize o documento.
        </Text>
      )}

      <Modal
        visible={aberto}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={fechar}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.conteudo}>
            <Text style={styles.modalTitulo}>
              Assinar documento
            </Text>

            <Text style={styles.descricao}>
              Use o dedo para desenhar sua assinatura
              na área branca abaixo.
            </Text>

            <View
              ref={areaRef}
              collapsable={false}
              style={[
                styles.area,
                { height: alturaArea },
              ]}
              onLayout={(evento) => {
                const { width: w, height: h } =
                  evento.nativeEvent.layout;

                setDimensoes({
                  width: w,
                  height: h,
                });
              }}
              onStartShouldSetResponderCapture={() => {
                return !bloqueadoRef.current;
              }}
              onMoveShouldSetResponderCapture={() =>
                !bloqueadoRef.current
              }
              onResponderGrant={iniciar}
              onResponderMove={mover}
              onResponderRelease={finalizar}
              onResponderTerminate={() => {
                finalizar();
              }}
              onResponderTerminationRequest={() => false}
            >
              <Svg
                pointerEvents="none"
                width="100%"
                height="100%"
              >
                {tracos.map((caminho, indice) => (
                  <Path
                    key={indice}
                    d={caminho}
                    stroke={COR}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}

                {!!atual && (
                  <Path
                    d={atual}
                    stroke={COR}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </Svg>
            </View>

            <Text style={styles.status}>
              {mensagem ||
                `${tracos.length} traço(s) registrado(s)`}
            </Text>

            <View style={styles.botoes}>
              <Pressable
                onPress={limpar}
                disabled={salvando}
                style={styles.botaoLimpar}
              >
                <Text style={styles.textoLimpar}>
                  Limpar
                </Text>
              </Pressable>

              <Pressable
                onPress={confirmar}
                disabled={
                  salvando || tracos.length === 0
                }
                style={[
                  styles.botaoConfirmar,
                  (salvando || tracos.length === 0) &&
                    styles.desabilitado,
                ]}
              >
                {salvando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.textoPrincipal}>
                    Confirmar assinatura
                  </Text>
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={fechar}
              disabled={salvando}
              style={styles.voltar}
            >
              <Text style={styles.textoVoltar}>
                Cancelar e voltar
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 14,
    padding: 15,
    gap: 12,
  },

  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#14264b",
  },

  descricao: {
    fontSize: 14,
    lineHeight: 21,
    color: "#64748b",
  },

  botaoPrincipal: {
    backgroundColor: "#1d4ed8",
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  textoPrincipal: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  sucesso: {
    color: "#15803d",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },

  modal: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },

  conteudo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 14,
  },

  modalTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#14264b",
  },

  area: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#93c5fd",
    borderRadius: 12,
    overflow: "hidden",
  },

  status: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
  },

  botoes: {
    flexDirection: "row",
    gap: 10,
  },

  botaoLimpar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 9,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  textoLimpar: {
    color: "#14264b",
    fontWeight: "700",
  },

  botaoConfirmar: {
    flex: 2,
    minHeight: 48,
    borderRadius: 9,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  voltar: {
    paddingVertical: 12,
    alignItems: "center",
  },

  textoVoltar: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },

  desabilitado: {
    opacity: 0.45,
  },
});
