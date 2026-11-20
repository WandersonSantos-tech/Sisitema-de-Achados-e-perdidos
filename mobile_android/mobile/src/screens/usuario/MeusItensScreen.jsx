import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Image,
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
  Rect,
  Stop,
} from "react-native-svg";

import { itemService } from "../../services/dataService";
import { imageURL } from "../../services/api";

function FundoGradiente({ variante = "logo" }) {
  const [tamanho, setTamanho] = useState({ width: 1, height: 1 });

  const width = Math.max(tamanho.width, 1);
  const height = Math.max(tamanho.height, 1);
  const distancia = (width + height) / 4;

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.fundoGradiente}
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
          <LinearGradient
            id="meusItensGradiente"
            gradientUnits="userSpaceOnUse"
            x1={width / 2 - distancia}
            y1={height / 2 - distancia}
            x2={width / 2 + distancia}
            y2={height / 2 + distancia}
          >
            <Stop
              offset="0"
              stopColor={variante === "logo" ? "#0B2349" : "#1858A9"}
            />
            <Stop
              offset="1"
              stopColor={variante === "logo" ? "#1766C2" : "#2879D8"}
            />
          </LinearGradient>
        </Defs>

        <Rect
          width={width}
          height={height}
          fill="url(#meusItensGradiente)"
        />
      </Svg>
    </View>
  );
}

function formatarData(data) {
  if (!data) return "-";

  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarStatus(status) {
  if (!status) return "-";

  return status.replace(/_/g, " ").toUpperCase();
}

export default function MeusItensScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const mobile = width <= 700;

  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [larguraGrid, setLarguraGrid] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    carregarItens();
  }, []);

  async function carregarItens() {
    try {
      setCarregando(true);
      setErro("");

      const response = await itemService.list(1);

      setItens(response.items || []);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);

      setErro(
        error.message || "Não foi possível carregar seus itens."
      );
    } finally {
      setCarregando(false);
    }
  }

  const colunas = Math.max(
    1,
    Math.floor((larguraGrid + 22) / (310 + 22))
  );

  const larguraCard =
    larguraGrid > 0
      ? (larguraGrid - 22 * (colunas - 1)) / colunas
      : "100%";

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={styles.pagina}
        contentContainerStyle={styles.scrollConteudo}
      >
        <View style={styles.navbar}>
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
              <FundoGradiente />
              <Text style={styles.logoTexto}>OT</Text>
            </View>

            <View style={styles.brandConteudo}>
              <Text style={styles.brandNome}>
                Onde<Text style={styles.brandAzul}>Tá</Text>
              </Text>

              <Text style={styles.brandSubtitulo}>
                Achados & Perdidos
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("UsuarioHome")}
            style={({ pressed }) => [
              styles.voltar,
              pressed && styles.pressionado,
            ]}
          >
            <Text style={styles.voltarTexto}>
              ← Voltar para o início
            </Text>
          </Pressable>
        </View>

        <View style={styles.main}>
          <View
            style={[
              styles.heading,
              mobile && styles.headingMobile,
            ]}
          >
            <View style={styles.headingConteudo}>
              <Text style={styles.eyebrow}>MEUS REGISTROS</Text>

              <Text
                accessibilityRole="header"
                style={styles.titulo}
              >
                Meus objetos perdidos
              </Text>

              <Text style={styles.descricao}>
                Acompanhe todos os objetos que você registrou no OndeTá.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("RegistrarItem")}
              style={({ pressed }) => [
                styles.novo,
                mobile && styles.novoMobile,
                pressed && styles.pressionado,
              ]}
            >
              <FundoGradiente variante="botao" />

              <Text style={styles.novoTexto}>
                + Registrar objeto perdido
              </Text>
            </Pressable>
          </View>

          {!!erro && (
            <View style={styles.feedback}>
              <Text accessibilityRole="alert" style={styles.erroTexto}>
                {erro}
              </Text>
            </View>
          )}

          {carregando ? (
            <View style={styles.feedback}>
              <Text style={styles.feedbackTexto}>
                Carregando seus objetos...
              </Text>
            </View>
          ) : itens.length === 0 ? (
            <View style={styles.feedback}>
              <Text style={styles.feedbackTitulo}>
                Nenhum objeto cadastrado
              </Text>

              <Text style={styles.feedbackDescricao}>
                Você ainda não cadastrou nenhum objeto perdido.
              </Text>
            </View>
          ) : (
            <View
              style={styles.grid}
              onLayout={({ nativeEvent }) => {
                setLarguraGrid(nativeEvent.layout.width);
              }}
            >
              {itens.map((item) => {
                const imagem = item.images?.length
                  ? imageURL(item.images[0].image_url)
                  : null;

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${item.title}`}
                    onPress={() =>
                      navigation.navigate("ItemDetalhe", {
                        id: item.id,
                      })
                    }
                    style={({ pressed }) => [
                      styles.card,
                      { width: larguraCard },
                      pressed && styles.cardPressionado,
                    ]}
                  >
                    <View style={styles.imagemContainer}>
                      {imagem ? (
                        <Image
                          source={{ uri: imagem }}
                          accessibilityLabel={item.title}
                          resizeMode="cover"
                          style={styles.imagem}
                        />
                      ) : (
                        <View style={styles.semImagem}>
                          <Text style={styles.semImagemTexto}>OT</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.conteudo}>
                      <Text style={styles.categoria}>
                        {item.category?.name || "Sem categoria"}
                      </Text>

                      <Text
                        accessibilityRole="header"
                        style={styles.cardTitulo}
                      >
                        {item.title}
                      </Text>

                      <Text style={styles.local}>
                        {item.location_name}
                      </Text>

                      <View style={styles.cardFooter}>
                        <Text style={styles.data}>
                          {formatarData(item.event_date)}
                        </Text>

                        <View style={styles.statusBadge}>
                          <Text style={styles.statusTexto}>
                            {formatarStatus(item.status)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: "#F4F7FB",
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
    flexWrap: "wrap",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E3EBF5",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  brandConteudo: {
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
  fundoGradiente: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  pressionado: {
    opacity: 0.75,
  },
  main: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
    paddingTop: 55,
    paddingHorizontal: "5%",
    paddingBottom: 80,
  },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 30,
    marginBottom: 38,
  },
  headingMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  headingConteudo: {
    flexShrink: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: "#1766C2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  titulo: {
    marginVertical: 8,
    color: "#0B1F3A",
    fontSize: 42,
    fontWeight: "700",
  },
  descricao: {
    color: "#718096",
    fontSize: 16,
    lineHeight: 24,
  },
  novo: {
    position: "relative",
    overflow: "hidden",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#1858A9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
  },
  novoMobile: {
    width: "100%",
  },
  novoTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 22,
    alignItems: "flex-start",
  },
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E8F1",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  cardPressionado: {
    opacity: 0.85,
    transform: [{ translateY: -3 }],
  },
  imagemContainer: {
    height: 210,
    backgroundColor: "#EEF5FF",
  },
  imagem: {
    width: "100%",
    height: "100%",
  },
  semImagem: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  semImagemTexto: {
    color: "#1766C2",
    fontSize: 28,
    fontWeight: "900",
  },
  conteudo: {
    padding: 22,
  },
  categoria: {
    color: "#1766C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardTitulo: {
    marginVertical: 8,
    color: "#0B1F3A",
    fontSize: 20,
    fontWeight: "700",
  },
  local: {
    color: "#718096",
    fontSize: 13,
    lineHeight: 19,
  },
  cardFooter: {
    marginTop: 22,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: "#EDF1F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  data: {
    color: "#8494AA",
    fontSize: 12,
  },
  statusBadge: {
    maxWidth: "100%",
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "#EAF3FF",
  },
  statusTexto: {
    color: "#1766C2",
    fontSize: 10,
    fontWeight: "700",
  },
  feedback: {
    padding: 45,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackTexto: {
    color: "#0B1F3A",
    fontSize: 16,
    textAlign: "center",
  },
  feedbackTitulo: {
    marginTop: 20,
    marginBottom: 16,
    color: "#0B1F3A",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  feedbackDescricao: {
    marginVertical: 16,
    color: "#0B1F3A",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  erroTexto: {
    color: "#C2414B",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});