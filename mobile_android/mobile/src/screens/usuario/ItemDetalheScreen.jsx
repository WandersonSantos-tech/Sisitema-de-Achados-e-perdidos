import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { itemService } from "../../services/dataService";
import { imageURL } from "../../services/api";

function Botao({
  children,
  onPress,
  disabled,
  outline,
  gradient,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.botao,
        outline && s.botaoOutline,
        style,
        disabled && { opacity: 0.6 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {!!gradient && (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: 11 },
          ]}
        />
      )}

      <Text
        style={[
          s.botaoTexto,
          outline && { color: "#1554B4" },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function Campo({ label, multiline, ...props }) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={s.editField}>
      <Text style={s.editLabel}>{label}</Text>

      <TextInput
        {...props}
        accessibilityLabel={label}
        multiline={multiline}
        placeholderTextColor="#94A3B8"
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        style={[
          s.editInput,
          multiline && s.editTextarea,
          focado && s.editInputFocado,
        ]}
      />
    </View>
  );
}

function CabecalhoCard({ label, titulo, children }) {
  return (
    <View style={s.cardHeading}>
      <View style={{ flex: 1 }}>
        <Text style={s.cardEyebrow}>{label}</Text>
        <Text accessibilityRole="header" style={s.cardTitulo}>
          {titulo}
        </Text>
      </View>

      {children}
    </View>
  );
}

function formatarData(data) {
  if (!data) return "Não informado";

  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarStatus(status) {
  if (!status) return "Não informado";

  return status.replace(/_/g, " ").toUpperCase();
}

function formatarMedida(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "Não informado";
  }

  return `${valor} cm`;
}

export default function ItemDetalheScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const mobile = width <= 750;
  const colunaUnica = width <= 1000;
  const id = route.params?.id;

  const [item, setItem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [larguraGaleria, setLarguraGaleria] = useState(0);

  const operacaoEmAndamento = useRef(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location_name: "",
  });

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let ativo = true;

    async function carregarItem() {
      try {
        setCarregando(true);
        setErro("");
        setEditando(false);

        if (!id) {
          throw new Error("Objeto não encontrado.");
        }

        const response = await itemService.get(id);

        if (ativo) {
          setItem(response);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error.message ||
              "Não foi possível carregar as informações do objeto."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarItem();

    return () => {
      ativo = false;
    };
  }, [id]);

  function alternarEdicao() {
    if (salvando || excluindo) return;

    if (!editando) {
      setForm({
        title: item.title || "",
        description: item.description || "",
        location_name: item.location_name || "",
      });
    }

    setEditando((anterior) => !anterior);
  }

  function alterarCampo(nome, valor) {
    setForm((anterior) => ({
      ...anterior,
      [nome]: valor,
    }));
  }

  async function salvarAlteracoes() {
    if (operacaoEmAndamento.current) return;

    if (form.title.trim().length < 3) {
      Alert.alert(
        "Confira os dados",
        "O título deve possuir pelo menos 3 caracteres."
      );
      return;
    }

    if (form.description.trim().length < 10) {
      Alert.alert(
        "Confira os dados",
        "A descrição deve possuir pelo menos 10 caracteres."
      );
      return;
    }

    if (!form.location_name.trim()) {
      Alert.alert("Confira os dados", "Informe o local.");
      return;
    }

    try {
      operacaoEmAndamento.current = true;
      setSalvando(true);

      const atualizado = await itemService.update(item.id, {
        title: form.title,
        description: form.description,
        location_name: form.location_name,
      });

      setItem(atualizado);
      setEditando(false);
    } catch (error) {
      Alert.alert(
        "Não foi possível salvar",
        error.message || "Não foi possível atualizar o objeto."
      );
    } finally {
      operacaoEmAndamento.current = false;
      setSalvando(false);
    }
  }

  function excluirItem() {
    if (operacaoEmAndamento.current) return;

    Alert.alert(
      "Excluir objeto",
      `Tem certeza que deseja excluir "${item.title}"? Essa ação não poderá ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir item",
          style: "destructive",
          onPress: confirmarExclusao,
        },
      ]
    );
  }

  async function confirmarExclusao() {
    if (operacaoEmAndamento.current) return;

    try {
      operacaoEmAndamento.current = true;
      setExcluindo(true);

      await itemService.remove(item.id);

      navigation.navigate("UsuarioHome");
    } catch (error) {
      Alert.alert(
        "Não foi possível excluir",
        error.message || "Não foi possível excluir o objeto."
      );
    } finally {
      operacaoEmAndamento.current = false;
      setExcluindo(false);
    }
  }

  if (carregando || erro || !item) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.feedback}>
          {carregando ? (
            <>
              <ActivityIndicator size="large" color="#1766C2" />

              <Text style={s.feedbackTitulo}>
                Carregando objeto...
              </Text>

              <Text style={s.feedbackTexto}>
                Estamos buscando as informações do seu registro.
              </Text>
            </>
          ) : (
            <>
              <View style={s.errorIcon}>
                <Text style={s.errorIconTexto}>!</Text>
              </View>

              <Text style={s.feedbackTitulo}>
                Não foi possível abrir o objeto
              </Text>

              <Text style={s.feedbackTexto}>
                {erro || "Objeto não encontrado."}
              </Text>

              <Botao
                style={{ marginTop: 20, backgroundColor: "#1766C2" }}
                onPress={() => navigation.navigate("MeusItens")}
              >
                Voltar para meus itens
              </Botao>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const fotos = item.images || [];

  const colunasGaleria = mobile
    ? 1
    : Math.min(Math.max(fotos.length, 1), 3);

  const larguraFoto =
    larguraGaleria > 0
      ? (larguraGaleria - 14 * (colunasGaleria - 1)) /
        colunasGaleria
      : "100%";

  const dados = [
    ["Categoria", item.category?.name || "Não informada"],
    ["Status", formatarStatus(item.status)],
    ["Local da perda", item.location_name || "Não informado"],
    ["Data e hora", formatarData(item.event_date)],
    ["Altura aproximada", formatarMedida(item.height_cm)],
    ["Largura aproximada", formatarMedida(item.width_cm)],
  ];

  const tamanhoTitulo = Math.min(48, Math.max(34, width * 0.04));

  return (
    <SafeAreaView
      style={s.safe}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.navbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="OndeTá, voltar ao início"
            onPress={() => navigation.navigate("UsuarioHome")}
            style={s.brand}
          >
            <LinearGradient
              colors={["#0B2349", "#1766C2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logo}
            >
              <Text style={s.logoTexto}>OT</Text>
            </LinearGradient>

            <View>
              <Text style={s.brandNome}>
                Onde<Text style={s.brandAzul}>Tá</Text>
              </Text>

              <Text style={s.brandSubtitulo}>
                Achados & Perdidos
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o início"
            onPress={() => navigation.navigate("UsuarioHome")}
            style={s.voltar}
          >
            <Text style={[s.voltarTexto, mobile && { fontSize: 20 }]}>
              ←
            </Text>

            {!mobile && (
              <Text style={s.voltarTexto}>Voltar para o início</Text>
            )}
          </Pressable>
        </View>

        <View style={s.pagina}>
          
          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.scrollConteudo}
          >
            <View style={[s.main, mobile && { paddingTop: 35 }]}>
              <View
                style={[
                  s.heading,
                  mobile && {
                    flexDirection: "column",
                    alignItems: "flex-start",
                  },
                ]}
              >
                <View style={s.headingConteudo}>
                  <Text style={s.eyebrow}>MEU REGISTRO</Text>

                  <Text
                    accessibilityRole="header"
                    style={[
                      s.titulo,
                      {
                        fontSize: tamanhoTitulo,
                        lineHeight: tamanhoTitulo * 1.08,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text style={s.headingDescricao}>
                    Consulte as informações cadastradas sobre este objeto
                    perdido.
                  </Text>
                </View>

                <View style={s.statusBadge}>
                  <Text style={s.statusBadgeTexto}>
                    {formatarStatus(item.status)}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  s.layout,
                  colunaUnica && { flexDirection: "column" },
                ]}
              >
                <View
                  style={[
                    s.conteudo,
                    colunaUnica && { flex: undefined, width: "100%" },
                  ]}
                >
                  <View style={[s.card, mobile && s.cardMobile]}>
                    <CabecalhoCard
                      label="FOTOS DO OBJETO"
                      titulo="Imagens cadastradas"
                    >
                      <View style={s.contador}>
                        <Text style={s.contadorTexto}>
                          {fotos.length}/3
                        </Text>
                      </View>
                    </CabecalhoCard>

                    {fotos.length > 0 ? (
                      <View
                        style={s.galeria}
                        onLayout={({ nativeEvent }) =>
                          setLarguraGaleria(nativeEvent.layout.width)
                        }
                      >
                        {fotos.map((foto, index) => (
                          <View
                            key={foto.id || `${foto.image_url}-${index}`}
                            style={[
                              s.fotoCard,
                              {
                                width: larguraFoto,
                                maxWidth:
                                  fotos.length === 1 && !mobile
                                    ? 520
                                    : undefined,
                              },
                            ]}
                          >
                            <Image
                              source={{ uri: imageURL(foto.image_url) }}
                              accessibilityLabel={`${item.title} - imagem ${
                                index + 1
                              }`}
                              resizeMode="cover"
                              style={s.foto}
                            />

                            <Text style={s.fotoLegenda}>
                              Imagem {index + 1}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={s.semFotos}>
                        <View style={s.semFotosIcon}>
                          <Text style={s.semFotosIconTexto}>OT</Text>
                        </View>

                        <Text style={s.semFotosTitulo}>
                          Nenhuma imagem cadastrada
                        </Text>

                        <Text style={s.semFotosTexto}>
                          Este registro foi criado sem fotos adicionais.
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[s.card, mobile && s.cardMobile]}>
                    <CabecalhoCard
                      label="INFORMAÇÕES"
                      titulo="Dados do objeto"
                    />

                    <View style={s.infoGrid}>
                      {dados.map(([label, valor]) => (
                        <View
                          key={label}
                          style={[
                            s.infoBox,
                            { width: mobile ? "100%" : "48%" },
                          ]}
                        >
                          <Text style={s.infoLabel}>{label}</Text>
                          <Text style={s.infoValor}>{valor}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[s.card, mobile && s.cardMobile]}>
                    <CabecalhoCard
                      label="DESCRIÇÃO"
                      titulo="Sobre o objeto"
                    />

                    <Text style={s.descricao}>
                      {item.description ||
                        "Nenhuma descrição cadastrada."}
                    </Text>
                  </View>

                  <View
                    style={[
                      s.card,
                      mobile && s.cardMobile,
                      s.secretCard,
                      mobile && { flexDirection: "column" },
                    ]}
                  >
                    <View style={s.secretIcon}>
                      <Text style={s.secretIconTexto}>✓</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={s.secretLabel}>
                        INFORMAÇÃO PROTEGIDA
                      </Text>

                      <Text style={s.secretTitulo}>
                        Características específicas
                      </Text>

                      <Text style={s.secretTexto}>
                        {item.secret_details ||
                          "Nenhuma característica específica foi informada."}
                      </Text>

                      <Text style={s.secretAjuda}>
                        Essas informações ajudam a confirmar que o objeto
                        realmente pertence a você e não são exibidas
                        publicamente.
                      </Text>
                    </View>
                  </View>

                  <View style={[s.card, mobile && s.cardMobile]}>
                    <Botao
                      outline={editando}
                      onPress={alternarEdicao}
                      disabled={salvando || excluindo}
                      style={s.editBotao}
                    >
                      {editando ? "Fechar edição" : "Editar objeto"}
                    </Botao>

                    {editando && (
                      <View style={s.editForm}>
                        <Campo
                          label="Nome do objeto"
                          value={form.title}
                          onChangeText={(v) => alterarCampo("title", v)}
                          placeholder="Digite o nome do objeto"
                          maxLength={150}
                        />

                        <Campo
                          label="Descrição"
                          value={form.description}
                          onChangeText={(v) =>
                            alterarCampo("description", v)
                          }
                          placeholder="Descreva o objeto"
                          multiline
                        />

                        <Campo
                          label="Local"
                          value={form.location_name}
                          onChangeText={(v) =>
                            alterarCampo("location_name", v)
                          }
                          placeholder="Informe o local"
                          maxLength={255}
                        />

                        <Botao
                          onPress={salvarAlteracoes}
                          disabled={salvando || excluindo}
                          style={[
                            s.salvarBotao,
                            width <= 600 && { alignSelf: "stretch" },
                          ]}
                        >
                          {salvando ? "Salvando..." : "Salvar alterações"}
                        </Botao>
                      </View>
                    )}
                  </View>

                  <LinearGradient
                    colors={["#FFFAFA", "#FFF7F8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      s.danger,
                      width <= 700 && {
                        flexDirection: "column",
                        alignItems: "stretch",
                      },
                    ]}
                  >
                    <View style={s.dangerConteudo}>
                      <Text style={s.dangerLabel}>ZONA DE PERIGO</Text>

                      <Text style={s.dangerTitulo}>
                        Excluir objeto perdido
                      </Text>

                      <Text style={s.dangerTexto}>
                        Ao excluir este registro, o objeto deixará de
                        participar das buscas por correspondência. As
                        informações e imagens relacionadas a este registro
                        não ficarão mais disponíveis.
                      </Text>
                    </View>

                    <Botao
                      onPress={excluirItem}
                      disabled={salvando || excluindo}
                      gradient={["#DC5050", "#C63D49"]}
                      style={s.excluirBotao}
                    >
                      {excluindo ? "Excluindo..." : "Excluir item"}
                    </Botao>
                  </LinearGradient>
                </View>

                <View
                  style={[
                    s.sidebar,
                    colunaUnica && { width: "100%" },
                  ]}
                >
                  <View style={s.sidebarCard}>
                    <Text style={s.sidebarLabel}>
                      STATUS DO REGISTRO
                    </Text>

                    <View style={s.statusCircle}>
                      <View style={s.statusHalo}>
                        <View style={s.statusDot} />
                      </View>
                    </View>

                    <Text style={s.sidebarTitulo}>
                      {formatarStatus(item.status)}
                    </Text>

                    <Text style={s.sidebarTexto}>
                      Seu objeto permanece registrado no sistema e será
                      comparado com objetos encontrados cadastrados pela
                      equipe.
                    </Text>
                  </View>

                  <View style={[s.sidebarCard, s.privacyCard]}>
                    <View style={s.privacyIcon}>
                      <Text style={s.privacyIconTexto}>✓</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={s.privacyTitulo}>
                        Seus dados estão protegidos
                      </Text>

                      <Text style={s.privacyTexto}>
                        Objetos encontrados de outros usuários não são
                        expostos publicamente.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  pagina: { flex: 1, backgroundColor: "#F4F7FB" },
  scrollConteudo: { flexGrow: 1, paddingBottom: 24 },

  navbar: {
    minHeight: 88,
    paddingHorizontal: "5%",
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: "#E3EBF5",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  brandNome: {
    color: "#0B1F3A",
    fontSize: 20,
    fontWeight: "700",
  },
  brandAzul: { color: "#1766C2" },
  brandSubtitulo: {
    marginTop: 5,
    color: "#718096",
    fontSize: 11,
  },
  voltar: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D7E2EF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voltarTexto: {
    color: "#164F97",
    fontSize: 13,
    fontWeight: "800",
  },

  main: {
    width: "100%",
    maxWidth: 1380,
    alignSelf: "center",
    paddingTop: 55,
    paddingHorizontal: "5%",
    paddingBottom: 80,
  },
  heading: {
    marginBottom: 34,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 30,
  },
  headingConteudo: { flexShrink: 1, minWidth: 0 },
  eyebrow: {
    color: "#1766C2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  titulo: {
    marginVertical: 8,
    color: "#0A1F3D",
    fontWeight: "700",
    letterSpacing: -1.5,
  },
  headingDescricao: {
    color: "#718096",
    fontSize: 14,
    lineHeight: 21,
  },
  statusBadge: {
    maxWidth: "100%",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: "#EAF3FF",
  },
  statusBadgeTexto: {
    color: "#1766C2",
    fontSize: 11,
    fontWeight: "900",
  },
  layout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 28,
  },
  conteudo: { flex: 1, minWidth: 0, gap: 22 },
  card: {
    padding: 28,
    borderWidth: 1,
    borderColor: "#E0E8F1",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F2B52",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  cardMobile: { padding: 21 },
  cardHeading: {
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  cardEyebrow: {
    color: "#1766C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  cardTitulo: {
    marginTop: 5,
    color: "#0B1F3A",
    fontSize: 21,
    fontWeight: "700",
  },
  contador: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "#EDF5FF",
  },
  contadorTexto: {
    color: "#1766C2",
    fontSize: 11,
    fontWeight: "700",
  },

  galeria: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  fotoCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DCE6F1",
    borderRadius: 16,
    backgroundColor: "#F4F7FB",
  },
  foto: { width: "100%", height: 245 },
  fotoLegenda: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: "#718096",
    backgroundColor: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  semFotos: {
    minHeight: 220,
    padding: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD9E9",
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  semFotosIcon: {
    width: 55,
    height: 55,
    marginBottom: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F2FF",
  },
  semFotosIconTexto: { color: "#1766C2", fontWeight: "900" },
  semFotosTitulo: {
    color: "#183354",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  semFotosTexto: {
    marginTop: 6,
    color: "#8292A7",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  infoBox: {
    padding: 17,
    borderWidth: 1,
    borderColor: "#E6EDF5",
    borderRadius: 14,
    backgroundColor: "#F8FBFF",
  },
  infoLabel: {
    marginBottom: 6,
    color: "#8190A5",
    fontSize: 11,
  },
  infoValor: {
    color: "#183354",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20.3,
  },
  descricao: {
    color: "#5F7188",
    fontSize: 14,
    lineHeight: 25.2,
  },

  secretCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 17,
    borderColor: "#CFE1F7",
    backgroundColor: "#F6FAFF",
  },
  secretIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4F1FF",
  },
  secretIconTexto: {
    color: "#1766C2",
    fontSize: 19,
    fontWeight: "900",
  },
  secretLabel: {
    color: "#1766C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secretTitulo: {
    marginTop: 6,
    marginBottom: 10,
    color: "#183354",
    fontSize: 19,
    fontWeight: "700",
  },
  secretTexto: {
    color: "#5F7188",
    fontSize: 14,
    lineHeight: 23.8,
  },
  secretAjuda: {
    marginTop: 13,
    color: "#8292A7",
    fontSize: 13,
    lineHeight: 20.15,
  },

  botao: {
    position: "relative",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: "#1554B4",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoOutline: {
    borderWidth: 1,
    borderColor: "#1554B4",
    backgroundColor: "#FFFFFF",
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  editBotao: { alignSelf: "flex-start" },
  editForm: { marginTop: 26, gap: 22 },
  editField: { gap: 9, width: "100%" },
  editLabel: {
    color: "#0B1F3A",
    fontSize: 14,
    fontWeight: "700",
  },
  editInput: {
    width: "100%",
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#DCE5F0",
    borderRadius: 11,
    backgroundColor: "#F8FBFF",
    color: "#0B1F3A",
    fontSize: 14,
    lineHeight: 21,
  },
  editTextarea: { minHeight: 115, textAlignVertical: "top" },
  editInputFocado: {
    borderColor: "#1766C2",
    backgroundColor: "#FFFFFF",
  },
  salvarBotao: {
    alignSelf: "flex-start",
    minHeight: 46,
    paddingHorizontal: 24,
  },

  danger: {
    marginTop: 4,
    paddingVertical: 26,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 28,
    borderWidth: 1,
    borderColor: "#F1C7CC",
    borderRadius: 20,
  },
  dangerConteudo: { flexShrink: 1, maxWidth: 650 },
  dangerLabel: {
    marginBottom: 7,
    color: "#C94C57",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  dangerTitulo: {
    color: "#7F1D2D",
    fontSize: 19,
    fontWeight: "700",
  },
  dangerTexto: {
    marginTop: 8,
    color: "#8B6469",
    fontSize: 12,
    lineHeight: 20.4,
  },
  excluirBotao: {
    minWidth: 135,
    minHeight: 45,
    paddingHorizontal: 18,
    borderRadius: 11,
    backgroundColor: "#C63D49",
    shadowColor: "#C63D49",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 13,
    elevation: 2,
  },

  sidebar: { width: 330, gap: 18 },
  sidebarCard: {
    padding: 24,
    borderWidth: 1,
    borderColor: "#E0E8F1",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  sidebarLabel: {
    color: "#1766C2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statusCircle: {
    width: 54,
    height: 54,
    marginTop: 22,
    marginBottom: 16,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF5FF",
  },
  statusHalo: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(23,102,194,0.12)",
  },
  statusDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#1766C2",
  },
  sidebarTitulo: {
    marginTop: 7,
    marginBottom: 8,
    color: "#0B1F3A",
    fontSize: 19,
    fontWeight: "700",
  },
  sidebarTexto: {
    color: "#718096",
    fontSize: 12,
    lineHeight: 19.8,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#F8FBFF",
  },
  privacyIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E4F1FF",
  },
  privacyIconTexto: { color: "#1766C2", fontWeight: "900" },
  privacyTitulo: {
    marginBottom: 5,
    color: "#183354",
    fontSize: 12,
    fontWeight: "700",
  },
  privacyTexto: {
    color: "#7A8DA5",
    fontSize: 11,
    lineHeight: 17.05,
  },

  feedback: {
    flex: 1,
    padding: 30,
    backgroundColor: "#F4F7FB",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackTitulo: {
    marginTop: 18,
    marginBottom: 7,
    color: "#0B1F3A",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  feedbackTexto: {
    maxWidth: 450,
    color: "#718096",
    fontSize: 16,
    lineHeight: 25.6,
    textAlign: "center",
  },
  errorIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F1",
  },
  errorIconTexto: {
    color: "#C2414B",
    fontSize: 24,
    fontWeight: "900",
  },
});