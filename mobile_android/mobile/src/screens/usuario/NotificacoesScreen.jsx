import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { notificationService } from "../../services/dataService";

function Fundo({ tipo }) {
  const [tamanho, setTamanho] = useState({ width: 1, height: 1 });
  const width = Math.max(tamanho.width, 1);
  const height = Math.max(tamanho.height, 1);

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fundo}
      onLayout={({ nativeEvent }) => {
        const { width: w, height: h } = nativeEvent.layout;

        setTamanho((anterior) =>
          anterior.width === w && anterior.height === h
            ? anterior
            : { width: w, height: h }
        );
      }}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <Defs>
          {tipo === "pagina" ? (
            <RadialGradient
              id="fundoNotificacoes"
              gradientUnits="userSpaceOnUse"
              cx={0}
              cy={0}
              rx={Math.max(width * 0.8, 300)}
              ry={Math.max(width * 0.8, 300)}
            >
              <Stop offset="0" stopColor="#1F6FEB" stopOpacity={0.07} />
              <Stop offset="1" stopColor="#1F6FEB" stopOpacity={0} />
            </RadialGradient>
          ) : (
            <LinearGradient
              id="fundoNotificacoes"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop
                offset="0"
                stopColor={tipo === "logo" ? "#0B2349" : "#FFFFFF"}
              />
              <Stop
                offset="1"
                stopColor={tipo === "logo" ? "#1766C2" : "#F4F9FF"}
              />
            </LinearGradient>
          )}
        </Defs>

        <Rect
          width={width}
          height={height}
          fill="url(#fundoNotificacoes)"
        />
      </Svg>
    </View>
  );
}

function Botao({ children, onPress, style, textStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.botao,
        style,
        pressed && styles.pressionado,
      ]}
    >
      <Text style={[styles.botaoTexto, textStyle]}>{children}</Text>
    </Pressable>
  );
}

function tituloTipo(notificacao) {
  if (notificacao.type === "MATCH_FOUND") {
    return "Esse item pode ser seu";
  }

  if (notificacao.type === "CLAIM_RECEIVED") {
    return "Solicitação recebida";
  }

  if (notificacao.type === "CLAIM_UPDATED") {
    return "Solicitação atualizada";
  }

  if (notificacao.type === "NEW_MESSAGE") {
    return "Nova mensagem";
  }

  return notificacao.title || "Nova notificação";
}

function formatarData(data) {
  if (!data) return "";

  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificacoesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const mobile = width <= 700;
  const estreita = width < 360;

  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  async function carregarNotificacoes() {
    try {
      setCarregando(true);
      setErro("");

      const response = await notificationService.list();

      setNotificacoes(response.items || []);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);

      setErro(
        error.message || "Não foi possível carregar suas notificações."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function abrirNotificacao(notificacao) {
    try {
      if (!notificacao.is_read) {
        await notificationService.read(notificacao.id);

        setNotificacoes((anteriores) =>
          anteriores.map((item) =>
            item.id === notificacao.id
              ? { ...item, is_read: true }
              : item
          )
        );
      }

      if (
        [
          "MATCH_FOUND",
          "CLAIM_UPDATED",
          "CLAIM_RECEIVED",
          "NEW_MESSAGE",
        ].includes(notificacao.type)
      ) {
        navigation.navigate("Solicitacoes");
      } else if (notificacao.item_id) {
        navigation.navigate("ItemDetalhe", {
          id: notificacao.item_id,
        });
      }
    } catch (error) {
      console.error("Erro ao abrir notificação:", error);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <View style={styles.pagina}>
        <Fundo tipo="pagina" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollConteudo}
        >
          <View
            style={[
              styles.navbar,
              mobile && styles.navbarMobile,
              estreita && styles.navbarEstreita,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="OndeTá, voltar ao início"
              onPress={() => navigation.navigate("UsuarioHome")}
              style={({ pressed }) => [
                styles.brand,
                pressed && styles.pressionado,
              ]}
            >
              <View style={styles.logo}>
                <Fundo tipo="logo" />
                <Text style={styles.logoTexto}>OT</Text>
              </View>

              <View>
                <Text style={styles.brandNome}>
                  Onde<Text style={styles.brandAzul}>Tá</Text>
                </Text>

                {!mobile && (
                  <Text style={styles.brandSubtitulo}>
                    Achados & Perdidos
                  </Text>
                )}
              </View>
            </Pressable>

            <Botao
              onPress={() => navigation.navigate("UsuarioHome")}
              style={styles.voltar}
              textStyle={styles.voltarTexto}
            >
              ← Voltar ao início
            </Botao>
          </View>

          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate("Solicitacoes")}
            style={styles.linkSolicitacoes}
          >
            <Text style={styles.linkSolicitacoesTexto}>
              Ver correspondências, solicitações e mensagens
            </Text>
          </Pressable>

          <View
            style={[
              styles.main,
              mobile && styles.mainMobile,
            ]}
          >
            <View style={styles.heading}>
              <Text style={styles.eyebrow}>CENTRAL DE AVISOS</Text>

              <Text
                accessibilityRole="header"
                style={[styles.titulo, mobile && styles.tituloMobile]}
              >
                Notificações
              </Text>

              <Text style={styles.descricao}>
                Acompanhe correspondências, solicitações e atualizações
                relacionadas aos seus objetos.
              </Text>
            </View>

            {carregando && (
              <View
                style={[
                  styles.feedback,
                  mobile && styles.feedbackMobile,
                ]}
              >
                <ActivityIndicator size="large" color="#1766C2" />

                <Text style={styles.feedbackTitulo}>
                  Carregando notificações...
                </Text>
              </View>
            )}

            {!carregando && !!erro && (
              <View
                style={[
                  styles.feedback,
                  mobile && styles.feedbackMobile,
                ]}
              >
                <Text style={styles.feedbackTitulo}>
                  Não foi possível carregar
                </Text>

                <Text accessibilityRole="alert" style={styles.feedbackTexto}>
                  {erro}
                </Text>

                <Botao
                  onPress={carregarNotificacoes}
                  style={styles.feedbackBotao}
                >
                  Tentar novamente
                </Botao>
              </View>
            )}

            {!carregando && !erro && notificacoes.length === 0 && (
              <View
                style={[
                  styles.feedback,
                  mobile && styles.feedbackMobile,
                ]}
              >
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconTexto}>OT</Text>
                </View>

                <Text style={styles.feedbackTitulo}>
                  Nenhuma notificação no momento
                </Text>

                <Text style={styles.feedbackTexto}>
                  Quando houver uma possível correspondência ou alguma
                  atualização importante, você será avisado por aqui.
                </Text>

                <Botao
                  onPress={() => navigation.navigate("UsuarioHome")}
                  style={styles.feedbackBotao}
                >
                  Voltar ao início
                </Botao>
              </View>
            )}

            {!carregando && !erro && notificacoes.length > 0 && (
              <View style={styles.lista}>
                {notificacoes.map((notificacao) => (
                  <View
                    key={notificacao.id}
                    style={[
                      styles.card,
                      mobile && styles.cardMobile,
                      !notificacao.is_read && styles.cardNaoLida,
                    ]}
                  >
                    {!notificacao.is_read && <Fundo tipo="card" />}

                    <View
                      style={[
                        styles.indicador,
                        mobile && styles.indicadorMobile,
                      ]}
                    >
                      <View
                        style={[
                          styles.dotHalo,
                          notificacao.is_read && styles.dotHaloLida,
                        ]}
                      >
                        <View
                          style={[
                            styles.dot,
                            notificacao.is_read && styles.dotLida,
                          ]}
                        />
                      </View>
                    </View>

                    <View style={styles.conteudo}>
                      <View style={styles.topo}>
                        <Text style={styles.tipo}>
                          {notificacao.type === "MATCH_FOUND"
                            ? "POSSÍVEL CORRESPONDÊNCIA"
                            : "ONDETÁ"}
                        </Text>

                        {!notificacao.is_read && (
                          <View style={styles.novaBadge}>
                            <Text style={styles.novaTexto}>NOVA</Text>
                          </View>
                        )}
                      </View>

                      <Text
                        accessibilityRole="header"
                        style={styles.cardTitulo}
                      >
                        {tituloTipo(notificacao)}
                      </Text>

                      <Text style={styles.cardMensagem}>
                        {notificacao.message ||
                          "Existe uma nova atualização relacionada ao seu registro."}
                      </Text>

                      <View
                        style={[
                          styles.footer,
                          mobile && styles.footerMobile,
                        ]}
                      >
                        <Text style={styles.data}>
                          {formatarData(notificacao.created_at)}
                        </Text>

                        {!!notificacao.item_id && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => abrirNotificacao(notificacao)}
                            style={({ pressed }) => [
                              styles.abrirBotao,
                              pressed && styles.pressionado,
                            ]}
                          >
                            <Text style={styles.abrirTexto}>
                              {notificacao.type === "MATCH_FOUND"
                                ? "Ver item"
                                : "Abrir"}
                            </Text>

                            <Text style={styles.abrirTexto}>→</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pagina: {
    flex: 1,
    position: "relative",
    backgroundColor: "#F4F7FB",
  },
  fundo: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  navbar: {
    minHeight: 88,
    paddingHorizontal: "5%",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E3EBF5",
    backgroundColor: "#FFFFFF",
  },
  navbarMobile: {
    minHeight: 74,
  },
  navbarEstreita: {
    flexWrap: "wrap",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  logo: {
    position: "relative",
    width: 46,
    height: 46,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B2349",
  },
  logoTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  brandNome: {
    color: "#0B1F3A",
    fontSize: 20,
    fontWeight: "700",
  },
  brandAzul: {
    color: "#1766C2",
  },
  brandSubtitulo: {
    marginTop: 4,
    color: "#718096",
    fontSize: 11,
  },
  botao: {
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor: "#1766C2",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  voltar: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D7E2EF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexShrink: 1,
  },
  voltarTexto: {
    color: "#1766C2",
  },
  pressionado: {
    opacity: 0.75,
  },
  linkSolicitacoes: {
    marginVertical: 16,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  linkSolicitacoesTexto: {
    color: "#0000EE",
    textDecorationLine: "underline",
    fontSize: 16,
    lineHeight: 23,
  },
  main: {
    width: "90%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingTop: 55,
    paddingBottom: 80,
  },
  mainMobile: {
    width: "100%",
    paddingHorizontal: 14,
    paddingTop: 35,
  },
  heading: {
    marginBottom: 30,
  },
  eyebrow: {
    color: "#1766C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  titulo: {
    marginVertical: 7,
    color: "#0B1F3A",
    fontSize: 42,
    fontWeight: "700",
  },
  tituloMobile: {
    fontSize: 34,
  },
  descricao: {
    color: "#718096",
    fontSize: 16,
    lineHeight: 24,
  },
  lista: {
    gap: 14,
  },
  card: {
    position: "relative",
    flexDirection: "row",
    gap: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E0E8F1",
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
  },
  cardMobile: {
    flexDirection: "column",
  },
  cardNaoLida: {
    borderColor: "#BDD8F7",
    shadowColor: "#1766C2",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  indicador: {
    width: 45,
    paddingTop: 7,
    alignItems: "center",
  },
  indicadorMobile: {
    width: "auto",
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  dotHalo: {
    width: 23,
    height: 23,
    margin: -6,
    borderRadius: 12,
    backgroundColor: "rgba(23, 102, 194, 0.11)",
    alignItems: "center",
    justifyContent: "center",
  },
  dotHaloLida: {
    backgroundColor: "transparent",
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#1766C2",
  },
  dotLida: {
    backgroundColor: "#B5C3D4",
  },
  conteudo: {
    flex: 1,
    minWidth: 0,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  tipo: {
    flexShrink: 1,
    color: "#1766C2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  novaBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#EAF3FF",
  },
  novaTexto: {
    color: "#1766C2",
    fontSize: 8,
    fontWeight: "700",
  },
  cardTitulo: {
    marginVertical: 8,
    color: "#0B1F3A",
    fontSize: 20,
    fontWeight: "700",
  },
  cardMensagem: {
    color: "#657890",
    fontSize: 13,
    lineHeight: 22.1,
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: "#EDF1F6",
  },
  footerMobile: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  data: {
    flexShrink: 1,
    color: "#93A1B4",
    fontSize: 13,
  },
  abrirBotao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#1766C2",
  },
  abrirTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  feedback: {
    minHeight: 350,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E8F1",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  feedbackMobile: {
    paddingHorizontal: 24,
  },
  feedbackTitulo: {
    marginTop: 17,
    marginBottom: 8,
    color: "#0B1F3A",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  feedbackTexto: {
    maxWidth: 550,
    color: "#718096",
    fontSize: 16,
    lineHeight: 27.2,
    textAlign: "center",
  },
  feedbackBotao: {
    marginTop: 20,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#EAF3FF",
  },
  emptyIconTexto: {
    color: "#1766C2",
    fontSize: 16,
    fontWeight: "900",
  },
});