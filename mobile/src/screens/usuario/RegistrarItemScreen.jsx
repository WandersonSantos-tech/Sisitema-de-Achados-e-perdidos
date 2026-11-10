import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
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
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import {
  categories,
  itemService,
} from "../../services/dataService";

function Icon({ name, size = 22, color = "#1766C2" }) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "arrowLeft" && (
        <Path d="M19 12H5m7-7-7 7 7 7" {...stroke} />
      )}

      {name === "package" && (
        <>
          <Path d="M4 7l8-4 8 4v10l-8 4-8-4V7Z" {...stroke} />
          <Path d="M4 7l8 4 8-4M12 11v10" {...stroke} />
        </>
      )}

      {name === "location" && (
        <>
          <Path
            d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
            {...stroke}
          />
          <Circle cx={12} cy={10} r={2.5} {...stroke} />
        </>
      )}

      {name === "shield" && (
        <>
          <Path
            d="M12 3 20 6v5c0 5.1-3.4 8.7-8 10-4.6-1.3-8-4.9-8-10V6l8-3Z"
            {...stroke}
          />
          <Path d="m9 12 2 2 4-4" {...stroke} />
        </>
      )}

      {name === "calendar" && (
        <>
          <Rect
            x={3}
            y={5}
            width={18}
            height={16}
            rx={2}
            {...stroke}
          />
          <Path d="M16 3v4M8 3v4M3 10h18" {...stroke} />
        </>
      )}

      {name === "check" && (
        <Path d="m5 12 4 4L19 6" {...stroke} />
      )}
    </Svg>
  );
}

function Campo({
  label,
  opcional,
  value,
  onChangeText,
  multiline,
  style,
  icon,
  unidade,
  ...props
}) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={[s.campo, style]}>
      <Text style={s.label}>
        {label}
        {!!opcional && <Text style={s.opcional}> {opcional}</Text>}
      </Text>

      <View style={[s.inputBox, focado && s.inputFocado]}>
        {!!icon && (
          <View style={s.inputIcon}>
            <Icon name={icon} size={18} color="#7188A4" />
          </View>
        )}

        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          style={[
            s.input,
            multiline && s.textarea,
            icon && { paddingLeft: 45 },
            unidade && { paddingRight: 52 },
          ]}
          {...props}
        />

        {!!unidade && (
          <Text style={s.unidade}>{unidade}</Text>
        )}
      </View>
    </View>
  );
}

function Botao({
  children,
  onPress,
  disabled,
  primary,
  icon,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.botao,
        primary ? s.botaoPrimary : s.botaoCancel,
        style,
        disabled && s.desabilitado,
        pressed && s.pressionado,
      ]}
    >
      {primary && (
        <LinearGradient
          colors={["#1858A9", "#2879D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
          pointerEvents="none"
        />
      )}

      {!!icon && (
        <Icon
          name={icon}
          size={19}
          color={primary ? "#FFFFFF" : "#50637B"}
        />
      )}

      <Text style={[s.botaoTexto, primary && s.botaoTextoPrimary]}>
        {children}
      </Text>
    </Pressable>
  );
}

function dataLocalParaISO(valor) {
  const partes = valor.match(
    /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/
  );

  if (!partes) {
    throw new Error("Informe a data no formato DD/MM/AAAA HH:MM.");
  }

  const [, dia, mes, ano, hora, minuto] = partes.map(Number);
  const data = new Date(ano, mes - 1, dia, hora, minuto);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia ||
    data.getHours() !== hora ||
    data.getMinutes() !== minuto
  ) {
    throw new Error("Informe uma data e hora válida.");
  }

  return data.toISOString();
}

function mascaraData(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 12);
  let resultado = numeros.slice(0, 2);

  if (numeros.length > 2) resultado += "/" + numeros.slice(2, 4);
  if (numeros.length > 4) resultado += "/" + numeros.slice(4, 8);
  if (numeros.length > 8) resultado += " " + numeros.slice(8, 10);
  if (numeros.length > 10) resultado += ":" + numeros.slice(10, 12);

  return resultado;
}

export default function RegistrarItemScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const mobile = width <= 700;
  const colunaUnica = width <= 1000;

  const [categorias, setCategorias] = useState([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [categoriaAberta, setCategoriaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [selecionando, setSelecionando] = useState(false);
  const [erro, setErro] = useState("");
  const [imagens, setImagens] = useState([]);

  const envioEmAndamento = useRef(false);
  const itemSalvo = useRef(null);

  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    secret_details: "",
    location_name: "",
    event_date: "",
    height_cm: "",
    width_cm: "",
  });
  const [seletorData, setSeletorData] = useState(null);
const [dataTemporaria, setDataTemporaria] = useState(new Date());

function abrirCalendario() {
  let data = new Date();

  if (form.event_date) {
    try {
      data = new Date(dataLocalParaISO(form.event_date));
    } catch {
      data = new Date();
    }
  }

  setDataTemporaria(data);
  setSeletorData("date");
}

function salvarDataSelecionada(data) {
  const dois = (numero) => String(numero).padStart(2, "0");

  alterarCampo(
    "event_date",
    `${dois(data.getDate())}/${dois(
      data.getMonth() + 1
    )}/${data.getFullYear()} ${dois(data.getHours())}:${dois(
      data.getMinutes()
    )}`
  );
}

function alterarDataSelecionada(event, data) {
  if (Platform.OS === "android") {
    const etapa = seletorData;
    setSeletorData(null);

    if (event.type !== "set" || !data) return;

    setDataTemporaria(data);

    if (etapa === "date") {
      setTimeout(() => setSeletorData("time"), 100);
    } else {
      salvarDataSelecionada(data);
    }

    return;
  }

  if (data) setDataTemporaria(data);
}

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setCarregandoCategorias(true);
      const response = await categories();
      setCategorias(response || []);
    } catch (error) {
      setErro(
        error.message || "Não foi possível carregar as categorias."
      );
    } finally {
      setCarregandoCategorias(false);
    }
  }

  function alterarCampo(nome, valor) {
    setForm((anterior) => ({
      ...anterior,
      [nome]: valor,
    }));
  }

  async function selecionarImagens() {
    if (selecionando || salvando) return;

    try {
      setSelecionando(true);

      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        throw new Error(
          "Permita o acesso às fotos nas configurações do celular."
        );
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 3 - imagens.length,
        quality: 1,
      });

      if (resultado.canceled) return;

      if (imagens.length + resultado.assets.length > 3) {
        throw new Error("Você pode adicionar no máximo 3 imagens.");
      }

      const novas = [];

      for (const arquivo of resultado.assets) {
        if (
          arquivo.fileSize &&
          arquivo.fileSize > 5 * 1024 * 1024
        ) {
          throw new Error("Cada imagem pode ter no máximo 5 MB.");
        }

        // Normaliza fotos do celular, incluindo HEIC, para JPG.
        const convertida = await ImageManipulator.manipulateAsync(
          arquivo.uri,
          [],
          {
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const resposta = await fetch(convertida.uri);
        const blob = await resposta.blob();

        if (blob.size > 5 * 1024 * 1024) {
          throw new Error("Cada imagem pode ter no máximo 5 MB.");
        }

        novas.push({
          uri: convertida.uri,
          fileName: `objeto-${Date.now()}-${novas.length}.jpg`,
          mimeType: "image/jpeg",
        });
      }

      setImagens((anteriores) => [...anteriores, ...novas]);
      setErro("");
    } catch (error) {
      setErro(error.message || "Não foi possível selecionar as imagens.");
    } finally {
      setSelecionando(false);
    }
  }

  function removerImagem(index) {
    setImagens((anteriores) =>
      anteriores.filter((_, indice) => indice !== index)
    );
  }

  async function cadastrarItem() {
    if (envioEmAndamento.current) return;

    setErro("");

    if (!form.category_id) {
      setErro("Selecione uma categoria.");
      return;
    }

    if (form.title.trim().length < 3) {
      setErro("O título deve possuir pelo menos 3 caracteres.");
      return;
    }

    if (form.description.trim().length < 10) {
      setErro("A descrição deve possuir pelo menos 10 caracteres.");
      return;
    }

    if (!form.location_name.trim()) {
      setErro("Informe onde o objeto foi perdido.");
      return;
    }

    if (!form.event_date) {
      setErro("Informe a data e hora aproximada da perda.");
      return;
    }

    try {
      const eventDate = dataLocalParaISO(form.event_date);

      const dimensao = (valor, nome) => {
        if (valor === "") return null;

        const numero = Number(valor.replace(",", "."));

        if (!Number.isFinite(numero) || numero < 0.1) {
          throw new Error(`${nome} deve ser de pelo menos 0,1 cm.`);
        }

        return numero;
      };

      const payload = {
        category_id: Number(form.category_id),
        title: form.title.trim(),
        description: form.description.trim(),
        secret_details: form.secret_details.trim() || null,
        location_name: form.location_name.trim(),
        height_cm: dimensao(form.height_cm, "A altura"),
        width_cm: dimensao(form.width_cm, "A largura"),
        event_date: eventDate,
      };

      envioEmAndamento.current = true;
      setSalvando(true);

      if (!itemSalvo.current) {
        itemSalvo.current = await itemService.create(payload);
      }

      if (imagens.length > 0) {
        try {
          await itemService.upload(itemSalvo.current.id, imagens);
        } catch (error) {
          setErro(
            `Objeto cadastrado, mas houve falha no envio das imagens: ${
              error.message || "Tente conferir as fotos no registro."
            }`
          );
          return;
        }
      }

      navigation.navigate("UsuarioHome");
    } catch (error) {
      setErro(error.message || "Não foi possível cadastrar o objeto.");
    } finally {
      envioEmAndamento.current = false;
      setSalvando(false);
    }
  }

  const categoriaSelecionada = categorias.find(
    (categoria) => String(categoria.id) === String(form.category_id)
  );

  const larguraCampo = mobile ? "100%" : "48%";

  const dicas = [
    {
      icon: "package",
      titulo: "Descreva o objeto",
      texto: "Informe características visíveis e detalhes gerais.",
    },
    {
      icon: "location",
      titulo: "Informe o local",
      texto: "Diga onde e quando percebeu a perda.",
    },
    {
      icon: "shield",
      titulo: "Proteja detalhes únicos",
      texto:
        "Características secretas ajudam na validação da propriedade.",
    },
  ];

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
              <Text style={s.brandSubtitulo}>Achados & Perdidos</Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o início"
            onPress={() => navigation.navigate("UsuarioHome")}
            style={[s.voltar, mobile && { paddingHorizontal: 11 }]}
          >
            <Icon
              name="arrowLeft"
              size={mobile ? 20 : 18}
              color="#164F97"
            />

            {!mobile && (
              <Text style={s.voltarTexto}>Voltar para o início</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={s.pagina}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.scroll}
        >
          <View
            style={[
              s.main,
              colunaUnica && { flexDirection: "column" },
              mobile && { paddingTop: 35 },
            ]}
          >
            <View
              style={[
                s.intro,
                colunaUnica && { width: "100%", flex: undefined },
              ]}
            >
              <View style={s.introBadge}>
                <Text style={s.introBadgeTexto}>
                  REGISTRAR OBJETO PERDIDO
                </Text>
              </View>

              <Text
                accessibilityRole="header"
                style={[
                  s.introTitulo,
                  {
                    fontSize: Math.min(61, Math.max(38, width * 0.04)),
                    letterSpacing: mobile ? -1 : -2,
                  },
                ]}
              >
                Conte para o OndeTá{"\n"}o que você perdeu.
              </Text>

              <Text style={s.introDescricao}>
                Quanto mais informações você fornecer, melhores serão
                as chances de encontrarmos uma possível correspondência.
              </Text>

              <View style={s.dicas}>
                {dicas.map((dica) => (
                  <View key={dica.icon} style={s.dica}>
                    <View style={s.dicaIcon}>
                      <Icon name={dica.icon} size={20} />
                    </View>

                    <View style={s.flex}>
                      <Text style={s.dicaTitulo}>{dica.titulo}</Text>
                      <Text style={s.dicaTexto}>{dica.texto}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                s.formCard,
                colunaUnica && { width: "100%", flex: undefined },
                mobile && {
                  paddingVertical: 24,
                  paddingHorizontal: 18,
                  borderRadius: 20,
                },
              ]}
            >
              <View style={s.formHeading}>
                <Text style={s.eyebrow}>NOVO REGISTRO</Text>
                <Text accessibilityRole="header" style={s.formTitulo}>
                  Informações do objeto
                </Text>
                <Text style={s.formDescricao}>
                  Preencha os dados abaixo para iniciar a busca automática.
                </Text>
              </View>

              {!!erro && (
                <View style={s.erroBox}>
                  <Text accessibilityRole="alert" style={s.erroTexto}>
                    {erro}
                  </Text>

                  {!!itemSalvo.current && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        navigation.navigate("ItemDetalhe", {
                          id: itemSalvo.current.id,
                        })
                      }
                      style={{ marginTop: 12 }}
                    >
                      <Text style={s.link}>Abrir objeto cadastrado</Text>
                    </Pressable>
                  )}
                </View>
              )}

              <View style={s.form}>
                <View style={[s.campo, { width: larguraCampo }]}>
                  <Text style={s.label}>Categoria</Text>

                  <Pressable
                    accessibilityRole="button"
                    disabled={carregandoCategorias}
                    onPress={() => setCategoriaAberta(true)}
                    style={[
                      s.select,
                      carregandoCategorias && s.desabilitado,
                    ]}
                  >
                    <Text style={s.selectTexto}>
                      {carregandoCategorias
                        ? "Carregando categorias..."
                        : categoriaSelecionada?.name ||
                          "Selecione uma categoria"}
                    </Text>
                    <Text style={s.selectSeta}>⌄</Text>
                  </Pressable>
                </View>

                <Campo
                  style={{ width: larguraCampo }}
                  label="Nome do objeto"
                  placeholder="Ex.: Fone de ouvido Bluetooth"
                  value={form.title}
                  onChangeText={(v) => alterarCampo("title", v)}
                  maxLength={150}
                />

                <Campo
                  style={s.full}
                  label="Descrição"
                  placeholder="Descreva cor, marca, modelo, tamanho e outras características..."
                  value={form.description}
                  onChangeText={(v) => alterarCampo("description", v)}
                  multiline
                />

                <View style={s.full}>
                  <Campo
                    label="Características específicas"
                    placeholder="Ex.: possui um risco na lateral, adesivo interno, iniciais gravadas..."
                    value={form.secret_details}
                    onChangeText={(v) =>
                      alterarCampo("secret_details", v)
                    }
                    multiline
                  />
                  <Text style={s.ajuda}>
                    Essas informações podem ser utilizadas para comprovar
                    que o objeto realmente pertence a você.
                  </Text>
                </View>

                <Campo
                  style={{ width: larguraCampo }}
                  label="Local da perda"
                  placeholder="Ex.: Biblioteca"
                  value={form.location_name}
                  onChangeText={(v) => alterarCampo("location_name", v)}
                  maxLength={255}
                />

                <View style={[s.campo, { width: larguraCampo }]}>
                <Text style={s.label}>Data e hora aproximada</Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Selecionar data e hora aproximada da perda"
                  onPress={abrirCalendario}
                  style={[s.select, { justifyContent: "flex-start", gap: 12 }]}
                >
                  <Icon name="calendar" size={18} color="#7188A4" />

                  <Text
                    style={[
                      s.selectTexto,
                      !form.event_date && { color: "#94A3B8" },
                    ]}
                  >
                    {form.event_date || "Selecionar data e hora"}
                  </Text>
                </Pressable>
              </View>

                <Campo
                  style={{ width: larguraCampo }}
                  label="Altura aproximada"
                  opcional="opcional"
                  unidade="cm"
                  placeholder="Ex.: 45"
                  keyboardType="decimal-pad"
                  value={form.height_cm}
                  onChangeText={(v) => alterarCampo("height_cm", v)}
                />

                <Campo
                  style={{ width: larguraCampo }}
                  label="Largura aproximada"
                  opcional="opcional"
                  unidade="cm"
                  placeholder="Ex.: 30"
                  keyboardType="decimal-pad"
                  value={form.width_cm}
                  onChangeText={(v) => alterarCampo("width_cm", v)}
                />

                <View style={[s.campo, s.full]}>
                  <Text style={s.label}>
                    Imagens do objeto
                    <Text style={s.opcional}> opcional · máximo 3</Text>
                  </Text>

                  <View style={s.imagesArea}>
                    <View style={s.imagesHeader}>
                      <View style={s.flex}>
                        <Text style={s.imagesTitulo}>
                          Adicione fotos que ajudem na identificação
                        </Text>
                        <Text style={s.imagesDescricao}>
                          Você pode enviar fotos do objeto, embalagem,
                          nota fiscal ou algum detalhe importante.
                        </Text>
                      </View>

                      <View style={s.count}>
                        <Text style={s.countTexto}>{imagens.length}/3</Text>
                      </View>
                    </View>

                    {imagens.length < 3 && (
                      <Pressable
                        accessibilityRole="button"
                        disabled={salvando || selecionando}
                        onPress={selecionarImagens}
                        style={[
                          s.imagePicker,
                          (salvando || selecionando) && s.desabilitado,
                        ]}
                      >
                        <View style={s.plusBox}>
                          <Text style={s.plus}>+</Text>
                        </View>

                        <View style={s.flex}>
                          <Text style={s.pickerTitulo}>
                            {selecionando
                              ? "Preparando imagens..."
                              : "Selecionar imagens"}
                          </Text>
                          <Text style={s.pickerAjuda}>
                            JPG, PNG ou WEBP · até 5 MB cada
                          </Text>
                        </View>
                      </Pressable>
                    )}

                    {imagens.length > 0 && (
                      <View style={s.previews}>
                        {imagens.map((imagem, index) => (
                          <View
                            key={`${imagem.uri}-${index}`}
                            style={[
                              s.preview,
                              { width: mobile ? "100%" : "30%" },
                            ]}
                          >
                            <Image
                              source={{ uri: imagem.uri }}
                              accessibilityLabel={`Prévia ${index + 1}`}
                              style={s.previewImagem}
                              resizeMode="cover"
                            />

                            <Text style={s.previewLegenda}>
                              Imagem {index + 1}
                            </Text>

                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Remover imagem ${index + 1}`}
                              disabled={salvando}
                              onPress={() => removerImagem(index)}
                              style={s.remover}
                            >
                              <Text style={s.removerTexto}>×</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <View style={s.security}>
                  <Icon name="shield" size={21} />

                  <View style={s.flex}>
                    <Text style={s.securityTitulo}>
                      Informações protegidas
                    </Text>
                    <Text style={s.securityTexto}>
                      Objetos encontrados não são exibidos publicamente
                      para outros usuários.
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    s.actions,
                    mobile && { flexDirection: "column-reverse" },
                  ]}
                >
                  <Botao
                    disabled={salvando}
                    onPress={() => navigation.navigate("UsuarioHome")}
                    style={mobile && s.full}
                  >
                    Cancelar
                  </Botao>

                  <Botao
                    primary
                    icon={salvando ? undefined : "check"}
                    disabled={
                      salvando ||
                      carregandoCategorias ||
                      selecionando ||
                      !!itemSalvo.current
                    }
                    onPress={cadastrarItem}
                    style={mobile && s.full}
                  >
                    {salvando
                      ? "Cadastrando..."
                      : "Registrar objeto perdido"}
                  </Botao>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === "android" && seletorData && (
        <DateTimePicker
          value={dataTemporaria}
          mode={seletorData}
          display="default"
          is24Hour
          onChange={alterarDataSelecionada}
        />
      )}

      {Platform.OS === "ios" && (
        <Modal
          visible={seletorData !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSeletorData(null)}
        >
          <View style={s.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setSeletorData(null)}
              accessibilityLabel="Fechar calendário"
            />

            <View style={s.modalCard}>
              <Text style={s.modalTitulo}>Data e hora da perda</Text>

              <DateTimePicker
                value={dataTemporaria}
                mode="datetime"
                display="spinner"
                locale="pt-BR"
                themeVariant="light"
                onChange={alterarDataSelecionada}
                style={{ width: "100%", height: 200 }}
              />

              <Botao
                primary
                onPress={() => {
                  salvarDataSelecionada(dataTemporaria);
                  setSeletorData(null);
                }}
              >
                Confirmar data e hora
              </Botao>

              <Botao onPress={() => setSeletorData(null)}>
                Cancelar
              </Botao>
            </View>
          </View>
        </Modal>
      )}
      <Modal
        visible={categoriaAberta}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoriaAberta(false)}
      >
        <View style={s.modalOverlay}>
          <Pressable
            accessibilityLabel="Fechar categorias"
            onPress={() => setCategoriaAberta(false)}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={s.modalCard}>
            <Text style={s.modalTitulo}>Selecione uma categoria</Text>

            <ScrollView>
              {categorias.map((categoria) => (
                <Pressable
                  accessibilityRole="button"
                  key={categoria.id}
                  onPress={() => {
                    alterarCampo("category_id", String(categoria.id));
                    setCategoriaAberta(false);
                  }}
                  style={[
                    s.categoriaOpcao,
                    String(form.category_id) === String(categoria.id) &&
                      s.categoriaAtiva,
                  ]}
                >
                  <Text style={s.categoriaTexto}>{categoria.name}</Text>

                  {String(form.category_id) === String(categoria.id) && (
                    <Icon name="check" size={18} />
                  )}
                </Pressable>
              ))}
            </ScrollView>

            <Botao onPress={() => setCategoriaAberta(false)}>
              Fechar
            </Botao>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  full: { width: "100%" },
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  pagina: { flex: 1, backgroundColor: "#F4F7FB" },
  scroll: { flexGrow: 1, paddingBottom: 24 },

  navbar: {
    minHeight: 88,
    paddingHorizontal: "5%",
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#0B1F3A",
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
    fontWeight: "700",
    fontSize: 13,
  },

  main: {
    width: "100%",
    maxWidth: 1380,
    alignSelf: "center",
    paddingTop: 58,
    paddingHorizontal: "5%",
    paddingBottom: 80,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 52,
  },
  intro: { flex: 0.9, minWidth: 0 },
  introBadge: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#EAF3FF",
  },
  introBadgeTexto: {
    color: "#1766C2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  introTitulo: {
    marginTop: 24,
    marginBottom: 18,
    maxWidth: 600,
    color: "#0A1F3D",
    fontWeight: "700",
    lineHeight: undefined,
  },
  introDescricao: {
    maxWidth: 560,
    color: "#64748B",
    fontSize: 17,
    lineHeight: 29.75,
  },
  dicas: { marginTop: 36, gap: 14 },
  dica: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 17,
    borderWidth: 1,
    borderColor: "#DCE7F4",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  dicaIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dicaTitulo: {
    marginBottom: 5,
    color: "#0B1F3A",
    fontSize: 14,
    fontWeight: "700",
  },
  dicaTexto: {
    color: "#7B8BA1",
    fontSize: 12,
    lineHeight: 18.6,
  },

  formCard: {
    flex: 1.25,
    minWidth: 0,
    padding: 38,
    borderWidth: 1,
    borderColor: "#E0E8F1",
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F2B52",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 25,
    elevation: 3,
  },
  formHeading: {
    paddingBottom: 26,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1F6",
  },
  eyebrow: {
    color: "#1766C2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  formTitulo: {
    marginVertical: 8,
    color: "#0B1F3A",
    fontSize: 28,
    fontWeight: "700",
  },
  formDescricao: {
    color: "#718096",
    fontSize: 14,
    lineHeight: 21,
  },
  erroBox: {
    marginTop: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    backgroundColor: "#FFF1F2",
  },
  erroTexto: {
    color: "#C2414B",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  link: {
    color: "#1766C2",
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  form: {
    marginTop: 27,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 22,
  },
  campo: { gap: 8, minWidth: 0 },
  label: {
    color: "#182B48",
    fontSize: 13,
    fontWeight: "800",
  },
  opcional: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "500",
  },
  inputBox: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#D8E2ED",
    borderRadius: 12,
    backgroundColor: "#FBFDFF",
  },
  inputFocado: {
    borderColor: "#4B8BD6",
    backgroundColor: "#FFFFFF",
    shadowColor: "#1766C2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0B1F3A",
    fontSize: 14,
  },
  textarea: {
    minHeight: 125,
    padding: 14,
    lineHeight: 22.4,
    textAlignVertical: "top",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  unidade: {
    position: "absolute",
    right: 14,
    top: 17,
    color: "#6F8199",
    fontSize: 12,
    fontWeight: "800",
  },
  ajuda: {
    marginTop: 8,
    color: "#8A99AD",
    fontSize: 11,
    lineHeight: 16.5,
  },
  select: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D8E2ED",
    borderRadius: 12,
    backgroundColor: "#FBFDFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  selectTexto: { flex: 1, color: "#0B1F3A", fontSize: 14 },
  selectSeta: { color: "#7188A4", fontSize: 20 },

  imagesArea: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#D8E5F3",
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
  },
  imagesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 15,
  },
  imagesTitulo: {
    color: "#173052",
    fontSize: 13,
    fontWeight: "700",
  },
  imagesDescricao: {
    marginTop: 5,
    color: "#7A8DA5",
    fontSize: 12,
    lineHeight: 18.6,
  },
  count: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#E7F1FF",
  },
  countTexto: {
    color: "#1766C2",
    fontSize: 11,
    fontWeight: "900",
  },
  imagePicker: {
    minHeight: 88,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#9DBFE5",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  plusBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9F3FF",
  },
  plus: {
    color: "#1766C2",
    fontSize: 26,
    fontWeight: "500",
  },
  pickerTitulo: {
    marginBottom: 4,
    color: "#164F97",
    fontSize: 13,
    fontWeight: "700",
  },
  pickerAjuda: {
    color: "#8292A7",
    fontSize: 11,
    lineHeight: 16.5,
  },
  previews: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  preview: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D9E4F0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  previewImagem: { width: "100%", height: 132 },
  previewLegenda: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    color: "#5D718B",
    fontSize: 11,
    fontWeight: "700",
  },
  remover: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(11,31,58,0.84)",
    alignItems: "center",
    justifyContent: "center",
  },
  removerTexto: { color: "#FFFFFF", fontSize: 20 },

  security: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    padding: 17,
    borderWidth: 1,
    borderColor: "#CFE1F7",
    borderRadius: 14,
    backgroundColor: "#F3F8FF",
  },
  securityTitulo: {
    marginBottom: 4,
    color: "#164F97",
    fontSize: 13,
    fontWeight: "700",
  },
  securityTexto: {
    color: "#68809C",
    fontSize: 12,
    lineHeight: 18.6,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 4,
  },
  botao: {
    position: "relative",
    minHeight: 50,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    flexShrink: 1,
  },
  botaoCancel: {
    borderWidth: 1,
    borderColor: "#D7E1EC",
    backgroundColor: "#FFFFFF",
  },
  botaoPrimary: {
    backgroundColor: "#1858A9",
    shadowColor: "#1766C2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 3,
  },
  botaoTexto: {
    color: "#50637B",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
  },
  botaoTextoPrimary: { color: "#FFFFFF" },
  desabilitado: { opacity: 0.6 },
  pressionado: { opacity: 0.8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3,17,38,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    alignSelf: "center",
    padding: 22,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  modalTitulo: {
    color: "#0B1F3A",
    fontSize: 20,
    fontWeight: "700",
  },
  categoriaOpcao: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  categoriaAtiva: { backgroundColor: "#EAF3FF" },
  categoriaTexto: {
    flex: 1,
    color: "#0B1F3A",
    fontSize: 15,
  },
});