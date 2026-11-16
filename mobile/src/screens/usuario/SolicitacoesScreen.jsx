import ReturnSignatureStatus from "../../components/ReturnSignatureStatus";
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  AppState,
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

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useIsFocused } from "@react-navigation/native";

import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { useAuth } from "../../contexts/AuthContext";
import { apiRequest, imageURL } from "../../services/api";

function Txt({ style, ...props }) {
  return <Text {...props} style={[styles.text, style]} />;
}

function ChatIcon({ name, size = 20, color = "#285CA3" }) {
  const paths = {
    refresh: [
      "M20 11a8 8 0 0 0-14-5L4 8",
      "M4 4v4h4",
      "M4 13a8 8 0 0 0 14 5l2-2",
      "M16 16h4v4",
    ],
    send: [
      "m22 2-7 20-4-9-9-4Z",
      "M22 2 11 13",
    ],
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {(paths[name] || []).map((d, index) => (
        <Path key={index} d={d} />
      ))}
    </Svg>
  );
}

function HeaderBackground() {
  const [size, setSize] = useState({
    width: 1,
    height: 1,
  });

  const width = Math.max(size.width, 1);
  const height = Math.max(size.height, 1);
  const distance = (width + height) / 4;

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFillObject,
        {
          zIndex: -1,
        },
      ]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;

        setSize((previous) => {
          if (
            previous.width === width &&
            previous.height === height
          ) {
            return previous;
          }

          return { width, height };
        });
      }}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <Defs>
          <LinearGradient
            id="solicitacoesHeader"
            gradientUnits="userSpaceOnUse"
            x1={width / 2 - distance}
            y1={height / 2 - distance}
            x2={width / 2 + distance}
            y2={height / 2 + distance}
          >
            <Stop offset="0%" stopColor="#071B3C" />
            <Stop offset="100%" stopColor="#0C3F89" />
          </LinearGradient>
        </Defs>

        <Rect
          width={width}
          height={height}
          fill="url(#solicitacoesHeader)"
        />
      </Svg>
    </View>
  );
}

function BasicButton({
  title,
  onPress,
  disabled = false,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.basicButton,
        style,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Txt
        style={[
          styles.basicButtonText,
          disabled && { color: "#8A8A8A" },
        ]}
      >
        {title}
      </Txt>
    </Pressable>
  );
}

function FotoObjeto({ photo, title }) {
  const [falhou, setFalhou] = useState(false);
  const uri = imageURL(photo?.image_url);

  if (!uri || falhou) {
    return (
      <View style={styles.photoFallback}>
        <Txt style={styles.photoFallbackText}>
          Imagem indisponível
        </Txt>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      accessibilityLabel={title || "Foto do objeto"}
      style={styles.photo}
      resizeMode="contain"
      onError={() => setFalhou(true)}
    />
  );
}

function formatarData(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("pt-BR");
}

function formatarHorario(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ClaimChatMobile({
  itemId,
  interlocutorId,
  interlocutorNome,
}) {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const smallScreen = width <= 600;

  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [inputHeight, setInputHeight] = useState(43);
  const [inputFocused, setInputFocused] = useState(false);

  const scrollRef = useRef(null);
  const refreshRef = useRef(null);
  const mounted = useRef(true);
  const sendingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isFocused) return;

    let ativo = true;
    let consultando = false;

    setCarregando(true);
    setMensagens([]);

    async function atualizar() {
      if (
        !ativo ||
        consultando ||
        !itemId ||
        !interlocutorId
      ) {
        return;
      }

      if (
        AppState.currentState &&
        AppState.currentState !== "active"
      ) {
        return;
      }

      consultando = true;

      try {
        const resposta = await apiRequest(
          `/messages/items/${itemId}/messages?interlocutor_id=${encodeURIComponent(
            interlocutorId
          )}`
        );

        if (!ativo) return;

        setMensagens(resposta.messages || []);
        setErro("");
      } catch (error) {
        if (ativo) {
          setErro(
            error.message || "Erro ao atualizar mensagens."
          );
        }
      } finally {
        consultando = false;

        if (ativo) setCarregando(false);
      }
    }

    refreshRef.current = atualizar;

    atualizar();

    const intervalo = setInterval(atualizar, 3000);

    const subscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") atualizar();
      }
    );

    return () => {
      ativo = false;
      clearInterval(intervalo);
      subscription.remove();
      refreshRef.current = null;
    };
  }, [itemId, interlocutorId, isFocused]);

  async function enviarMensagem() {
    if (!texto.trim() || sendingRef.current) return;

    sendingRef.current = true;
    setEnviando(true);
    setErro("");

    try {
      await apiRequest(
        `/messages/items/${itemId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            receiver_id: interlocutorId,
            content: texto.trim(),
          }),
        }
      );

      if (!mounted.current) return;

      setTexto("");
      setInputHeight(43);

      await refreshRef.current?.();
    } catch (error) {
      if (mounted.current) {
        setErro(
          error.message || "Erro ao enviar mensagem."
        );
      }
    } finally {
      sendingRef.current = false;

      if (mounted.current) setEnviando(false);
    }
  }

  const availableHeight =
    height - insets.top - insets.bottom;

  const chatHeight = smallScreen
    ? Math.max(300, Math.min(availableHeight * 0.7, 550))
    : 480;

  let ultimaData = "";

  return (
    <View
      style={[
        styles.chat,
        {
          height: chatHeight,
          marginTop: smallScreen ? 12 : 20,
          borderRadius: smallScreen ? 12 : 16,
        },
      ]}
    >
      <View
        style={[
          styles.chatHeader,
          smallScreen && { padding: 12 },
        ]}
      >
        <View style={styles.chatAvatar}>
          <Txt style={styles.chatAvatarText}>
            {(interlocutorNome || "F")
              .charAt(0)
              .toUpperCase()}
          </Txt>
        </View>

        <View style={styles.chatContact}>
          <Txt
            numberOfLines={1}
            style={styles.chatContactName}
          >
            {interlocutorNome || "Funcionário"}
          </Txt>

          <Txt style={styles.chatContactDescription}>
            Conversa sobre o objeto
          </Txt>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atualizar mensagens"
          onPress={() => refreshRef.current?.()}
          style={styles.chatRefresh}
        >
          <ChatIcon name="refresh" />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        style={styles.chatMessages}
        contentContainerStyle={[
          styles.chatMessagesContent,
          smallScreen && {
            paddingVertical: 14,
            paddingHorizontal: 10,
          },
          mensagens.length === 0 && {
            flexGrow: 1,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          scrollRef.current?.scrollToEnd({
            animated: true,
          });
        }}
      >
        {carregando && mensagens.length === 0 && (
          <View style={styles.chatEmpty}>
            <Txt style={styles.chatEmptyText}>
              Carregando mensagens...
            </Txt>
          </View>
        )}

        {!carregando && mensagens.length === 0 && (
          <View style={styles.chatEmpty}>
            <View style={styles.chatEmptyIcon}>
              <Txt style={styles.chatEmptyIconText}>
                ✉
              </Txt>
            </View>

            <Txt style={styles.chatEmptyTitle}>
              Inicie a conversa
            </Txt>

            <Txt style={styles.chatEmptyText}>
              Envie uma mensagem para começar.
            </Txt>
          </View>
        )}

        {mensagens.map((mensagem) => {
          const minha =
            String(mensagem.sender_id) === String(user?.id);

          const dataAtual = formatarData(
            mensagem.created_at
          );

          const mostrarData =
            dataAtual && dataAtual !== ultimaData;

          ultimaData = dataAtual;

          return (
            <View key={mensagem.id}>
              {!!mostrarData && (
                <View style={styles.chatDate}>
                  <Txt style={styles.chatDateText}>
                    {dataAtual}
                  </Txt>
                </View>
              )}

              <View
                style={[
                  styles.chatMessageRow,
                  {
                    alignItems: minha
                      ? "flex-end"
                      : "flex-start",
                  },
                ]}
              >
                <View
                  style={[
                    styles.chatBubble,
                    {
                      maxWidth: smallScreen ? "85%" : "75%",
                    },
                    smallScreen && {
                      paddingTop: 10,
                      paddingHorizontal: 12,
                      paddingBottom: 7,
                    },
                    minha
                      ? styles.chatBubbleSent
                      : styles.chatBubbleReceived,
                  ]}
                >
                  <Txt
                    style={[
                      styles.chatMessageText,
                      {
                        fontSize: smallScreen ? 13 : 14,
                        lineHeight:
                          (smallScreen ? 13 : 14) * 1.55,
                      },
                      minha && { color: "#FFFFFF" },
                    ]}
                  >
                    {mensagem.content}
                  </Txt>

                  <Txt
                    style={[
                      styles.chatTime,
                      minha && { color: "#D6E5F9" },
                    ]}
                  >
                    {formatarHorario(mensagem.created_at)}
                  </Txt>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {!!erro && (
        <View
          accessibilityRole="alert"
          style={styles.chatError}
        >
          <Txt style={styles.chatErrorText}>{erro}</Txt>
        </View>
      )}

      <View
        style={[
          styles.chatFooter,
          smallScreen && {
            padding: 10,
            gap: 8,
          },
        ]}
      >
        <TextInput
          accessibilityLabel="Digite sua mensagem"
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#9AA7B8"
          multiline
          maxLength={5000}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onContentSizeChange={(event) => {
            setInputHeight(
              Math.max(
                43,
                Math.min(
                  120,
                  event.nativeEvent.contentSize.height
                )
              )
            );
          }}
          style={[
            styles.chatInput,
            {
              height: inputHeight,
              fontSize: smallScreen ? 16 : 14,
            },
            inputFocused && styles.chatInputFocused,
          ]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          accessibilityState={{
            disabled: enviando || !texto.trim(),
          }}
          onPress={enviarMensagem}
          disabled={enviando || !texto.trim()}
          style={[
            styles.chatSend,
            {
              width: smallScreen ? 42 : 43,
              height: smallScreen ? 42 : 43,
            },
            (enviando || !texto.trim()) && {
              opacity: 0.5,
            },
          ]}
        >
          {enviando ? (
            <ActivityIndicator
              color="#FFFFFF"
              size="small"
            />
          ) : (
            <ChatIcon
              name="send"
              size={21}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function SolicitacoesScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [contatos, setContatos] = useState({});
  const [conversaAberta, setConversaAberta] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [notas, setNotas] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [abrindoContato, setAbrindoContato] = useState(null);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState({});
  const [selecionandoNota, setSelecionandoNota] = useState(null);

  const contatoRequest = useRef(0);
  const reviewLocks = useRef(new Set());

  const columnHeader = width <= 750;
  const compactContent = width <= 640;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    let ativo = true;

    setCarregando(true);
    setErro("");

    apiRequest(
      `/claims/my-claims?page=${page}&page_size=20`
    )
      .then((resposta) => {
        if (!ativo) return;

        setSolicitacoes(resposta.items || []);
        setTotal(resposta.total || 0);
      })
      .catch((error) => {
        if (ativo) setErro(error.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [page]);

  useEffect(() => {
    return () => {
      contatoRequest.current += 1;
    };
  }, []);

  async function abrirConversa(solicitacao) {
    const requestId = ++contatoRequest.current;

    if (conversaAberta === solicitacao.id) {
      setConversaAberta(null);
      setAbrindoContato(null);
      return;
    }

    setErro("");
    setAbrindoContato(solicitacao.id);

    try {
      if (!contatos[solicitacao.id]) {
        const contato = await apiRequest(
          `/messages/claims/${solicitacao.id}/contact`
        );

        if (requestId !== contatoRequest.current) return;

        setContatos((anterior) => ({
          ...anterior,
          [solicitacao.id]: contato,
        }));
      }

      if (requestId === contatoRequest.current) {
        setConversaAberta(solicitacao.id);
      }
    } catch (error) {
      if (requestId === contatoRequest.current) {
        setErro(
          error.message || "Erro ao abrir conversa."
        );
      }
    } finally {
      if (requestId === contatoRequest.current) {
        setAbrindoContato(null);
      }
    }
  }

  async function enviarAvaliacao(solicitacao) {
    if (reviewLocks.current.has(solicitacao.id)) return;

    reviewLocks.current.add(solicitacao.id);

    setErro("");
    setEnviandoAvaliacao((previous) => ({
      ...previous,
      [solicitacao.id]: true,
    }));

    try {
      await apiRequest(
        `/items/${solicitacao.item_id}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: Number(notas[solicitacao.id] ?? 5),
            comment: comentarios[solicitacao.id] || null,
          }),
        }
      );

      setAvaliacoes((previous) => ({
        ...previous,
        [solicitacao.id]: "Avaliação enviada.",
      }));
    } catch (error) {
      setErro(error.message);
    } finally {
      reviewLocks.current.delete(solicitacao.id);

      setEnviandoAvaliacao((previous) => ({
        ...previous,
        [solicitacao.id]: false,
      }));
    }
  }

  async function verAvaliacoes(solicitacao) {
    try {
      const reviews = await apiRequest(
        `/items/${solicitacao.item_id}/reviews`
      );

      setAvaliacoes((previous) => ({
        ...previous,
        [solicitacao.id]: reviews,
      }));
    } catch (error) {
      setErro(error.message);
    }
  }

  function formatarStatus(status) {
    const nomes = {
      CORRESPONDENCIA:
        "Correspondência enviada — aguardando verificação",
      PENDENTE: "Aguardando análise",
      APROVADA: "Aprovada - aguardando retirada",
      REJEITADA: "Rejeitada",
      CANCELADA: "Cancelada",
    };

    return nomes[status] || status || "Não informado";
  }

  const statusInfo = (s) => {
    if (s.returned_at) return { label: "Devolvido", kind: "done" };
    const values = {
      CORRESPONDENCIA: ["Correspondência recebida", "waiting"],
      PENDENTE: ["Em análise", "waiting"],
      APROVADA: ["Aguardando retirada", "progress"],
      REJEITADA: ["Rejeitada", "closed"],
      CANCELADA: ["Cancelada", "closed"],
    };
    const [label, kind] = values[s.status] || [(s.status || "Em andamento").replace(/_/g, " "), "progress"];
    return { label, kind };
  };

  return (
    <SafeAreaView style={modern.safe} edges={["top", "left", "right"]}>
      <SafeAreaView style={modern.body} edges={["bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={modern.page}>
            <View style={modern.hero}>
              <View style={modern.heroInner}>
                <Txt style={modern.brand}>Onde<Txt style={modern.brandAccent}>Tá</Txt></Txt>
                <View style={modern.heroTag}><Txt style={modern.heroTagText}>ÁREA DO USUÁRIO</Txt></View>
                <Txt style={modern.heroTitle}>Minhas solicitações</Txt>
                <Txt style={modern.heroDescription}>Acompanhe suas correspondências, documentos e devoluções em um só lugar.</Txt>
                <Pressable onPress={() => navigation.navigate("UsuarioHome")} style={modern.backButton}>
                  <Txt style={modern.backText}>← Voltar ao início</Txt>
                </Pressable>
              </View>
            </View>
            <View style={modern.content}>
              <View style={modern.overview}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Txt style={modern.eyebrow}>CENTRAL DE ACOMPANHAMENTO</Txt>
                  <Txt style={modern.overviewTitle}>Suas solicitações</Txt>
                  <Txt style={modern.muted}>Confira o andamento e os próximos passos de cada objeto.</Txt>
                </View>
                <View style={modern.totalBox}>
                  <Txt style={modern.totalNumber}>{total}</Txt>
                  <Txt style={modern.totalLabel}>Solicitações</Txt>
                </View>
              </View>
              {!!erro && <View style={modern.errorBox}><Txt style={modern.errorText}>{erro}</Txt></View>}
              {carregando && <View style={modern.empty}><ActivityIndicator color="#1554b5"/><Txt style={modern.muted}>Carregando suas solicitações...</Txt></View>}
              {!carregando && !erro && solicitacoes.length === 0 && (
                <View style={modern.empty}>
                  <Txt style={modern.emptyIcon}>◇</Txt>
                  <Txt style={modern.emptyTitle}>Nenhuma solicitação por enquanto</Txt>
                  <Txt style={modern.muted}>Quando uma correspondência for enviada, ela aparecerá aqui.</Txt>
                </View>
              )}
              {solicitacoes.map((s) => {
                const objeto = s.lost_item || s.item || {};
                const status = statusInfo(s);
                const imagens = objeto.images || [];
                const encerrada = ["REJEITADA", "CANCELADA"].includes(s.status);
                const avaliacao = avaliacoes[s.id];
                const avaliacaoEnviada = typeof avaliacao === "string";
                const conversaVisivel = conversaAberta === s.id && contatos[s.id];
                return (
                  <View key={s.id} style={modern.card}>
                    <View style={modern.cardTop}>
                      <View style={modern.objectRow}>
                        <View style={modern.objectIcon}><Txt style={modern.diamond}>◇</Txt></View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Txt style={modern.eyebrow}>OBJETO CADASTRADO</Txt>
                          <Txt style={modern.objectTitle}>{objeto.title || "Objeto"}</Txt>
                          {!!objeto.description && <Txt style={modern.objectDescription}>{objeto.description}</Txt>}
                        </View>
                      </View>
                      <View style={[modern.status, modern["status_" + status.kind]]}>
                        <View style={[modern.statusDot, modern["dot_" + status.kind]]}/>
                        <Txt style={[modern.statusText, modern["text_" + status.kind]]}>{status.label}</Txt>
                      </View>
                    </View>
                    {imagens.length > 0 && (
                      <View style={modern.gallery}>
                        {imagens.map((photo, index) => <FotoObjeto key={photo.id || index} photo={photo} title={objeto.title}/>)}
                      </View>
                    )}
                    <View style={[modern.details, width > 700 && { flexDirection: "row" }]}>
                      <View style={modern.detail}>
                        <View style={modern.detailIcon}><Txt style={modern.detailSymbol}>⌖</Txt></View>
                        <View style={{ flex: 1 }}><Txt style={modern.detailLabel}>Local do registro</Txt><Txt style={modern.detailValue}>{objeto.location_name || "Não informado"}</Txt></View>
                      </View>
                      <View style={modern.detail}>
                        <View style={modern.detailIcon}><Txt style={modern.detailSymbol}>◷</Txt></View>
                        <View style={{ flex: 1 }}><Txt style={modern.detailLabel}>Retirada</Txt><Txt style={modern.detailValue}>{s.pickup_at ? new Date(s.pickup_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Ainda não agendada"}</Txt></View>
                      </View>
                    </View>
                    {!!s.pickup_at && (
                    <View style={modern.document}>
                      <View style={modern.documentHeader}>
                        <View style={{ flex: 1 }}>
                          <Txt style={modern.eyebrow}>DOCUMENTAÇÃO</Txt>
                          <Txt style={modern.documentTitle}>
                            Termo de devolução
                          </Txt>
                          <Txt style={modern.muted}>
                            Consulte e assine seu documento eletrônico.
                          </Txt>
                        </View>

                        <View style={modern.documentIcon}>
                          <Txt style={modern.documentSymbol}>▤</Txt>
                        </View>
                      </View>

                      <ReturnSignatureStatus claimId={s.id} />
                    </View>
                  )}


                    
                    {!encerrada && (
                      <View style={modern.footer}>
                        <View style={modern.footerNote}><View style={modern.onlineDot}/><Txt style={modern.muted}>Atendimento e acompanhamento</Txt></View>
                        <Pressable disabled={abrindoContato === s.id} onPress={() => abrirConversa(s)} style={[modern.primaryButton, abrindoContato === s.id && { opacity: 0.5 }]}>
                          <Txt style={modern.primaryText}>{abrindoContato === s.id ? "Abrindo conversa..." : conversaAberta === s.id ? "Fechar conversa ↑" : "Conversar com funcionário →"}</Txt>
                        </Pressable>
                      </View>
                    )}
                    {!!conversaVisivel && <View style={modern.chatWrap}><ClaimChatMobile itemId={s.item_id} interlocutorId={contatos[s.id].id} interlocutorNome={contatos[s.id].name}/></View>}
                  </View>
                );
              })}
              {total > 20 && (
                <View style={modern.pagination}>
                  <Pressable disabled={carregando || page <= 1} onPress={() => setPage((old) => old - 1)} style={modern.secondaryButton}><Txt style={modern.secondaryText}>← Anterior</Txt></Pressable>
                  <Txt style={modern.muted}>Página {page} de {Math.ceil(total / 20)}</Txt>
                  <Pressable disabled={carregando || page * 20 >= total} onPress={() => setPage((old) => old + 1)} style={modern.secondaryButton}><Txt style={modern.secondaryText}>Próxima →</Txt></Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "#0B1F3A",
    fontSize: 16,
  },

  flex: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: "#071B3C",
  },

  body: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  scroll: {
    flex: 1,
  },

  page: {
    flexGrow: 1,
    paddingBottom: 60,
    backgroundColor: "#F4F7FC",
  },

  header: {
    position: "relative",
    justifyContent: "space-between",
    paddingVertical: 45,
    paddingHorizontal: "7%",
    backgroundColor: "#071B3C",
  },

  headerContent: {
    flexShrink: 1,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  brandAccent: {
    color: "#3F9CFF",
  },

  title: {
    marginTop: 12,
    marginBottom: 8,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  headerDescription: {
    color: "#C9DBF3",
    fontSize: 16,
    lineHeight: 24,
  },

  backButton: {
    flexShrink: 0,
    alignSelf: "flex-start",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  main: {
    width: "90%",
    maxWidth: 1150,
    alignSelf: "center",
    marginVertical: 45,
  },

  sectionTitle: {
    marginBottom: 25,
    color: "#0B1F3A",
    fontSize: 24,
    fontWeight: "700",
  },

  paragraph: {
    marginVertical: 16,
    color: "#0B1F3A",
    fontSize: 16,
    lineHeight: 24,
  },

  bold: {
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },

  itemTitle: {
    marginVertical: 18,
    color: "#0B1F3A",
    fontSize: 19,
    fontWeight: "700",
  },

  itemDescription: {
    marginBottom: 16,
    color: "#0B1F3A",
    fontSize: 16,
    lineHeight: 24,
  },

  photos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  photo: {
    width: 120,
    height: 100,
  },

  photoFallback: {
    width: 120,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7FB",
    padding: 8,
  },

  photoFallbackText: {
    color: "#718096",
    fontSize: 11,
    textAlign: "center",
  },

  reviewTitle: {
    marginVertical: 21,
    color: "#0B1F3A",
    fontSize: 16,
    fontWeight: "700",
  },

  reviewForm: {
    alignItems: "flex-start",
    gap: 8,
  },

  reviewField: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  reviewInput: {
    flex: 1,
    minWidth: 140,
    minHeight: 30,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    color: "#0B1F3A",
    fontSize: 16,
  },

  ratingSelect: {
    minWidth: 65,
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#9CA3AF",
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  ratingArrow: {
    color: "#374151",
    fontSize: 13,
  },

  basicButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#8B8B8B",
    borderRadius: 3,
    backgroundColor: "#EFEFEF",
  },

  basicButtonText: {
    color: "#172033",
    fontSize: 16,
    textAlign: "center",
  },

  conversationButton: {
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 10,
    backgroundColor: "#1554B4",
  },

  conversationButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19.6,
    textAlign: "center",
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },

  disabled: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.8,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(3,17,38,0.6)",
  },

  ratingModal: {
    width: "100%",
    maxWidth: 320,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  ratingModalTitle: {
    marginBottom: 12,
    paddingHorizontal: 12,
    color: "#0B1F3A",
    fontSize: 18,
    fontWeight: "700",
  },

  ratingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  ratingOptionSelected: {
    backgroundColor: "#EAF3FF",
  },

  ratingOptionText: {
    fontSize: 16,
  },

  chat: {
    width: "100%",
    minHeight: 300,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5F0",
    overflow: "hidden",
    boxShadow: "0px 4px 18px rgba(19,46,85,0.05)",
  },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EDF5",
  },

  chatAvatar: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#E8F0FC",
  },

  chatAvatarText: {
    color: "#285CA3",
    fontSize: 18,
    fontWeight: "700",
  },

  chatContact: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  chatContactName: {
    color: "#172B4D",
    fontSize: 15,
    fontWeight: "700",
  },

  chatContactDescription: {
    color: "#8190A5",
    fontSize: 12,
  },

  chatRefresh: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#EEF4FC",
  },

  chatMessages: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#F7F9FD",
  },

  chatMessagesContent: {
    padding: 20,
  },

  chatDate: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },

  chatDateText: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: "#E8EDF5",
    color: "#718096",
    fontSize: 11,
    fontWeight: "600",
  },

  chatMessageRow: {
    width: "100%",
    marginBottom: 12,
  },

  chatBubble: {
    paddingTop: 11,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    boxShadow: "0px 2px 5px rgba(20,45,80,0.03)",
  },

  chatBubbleSent: {
    backgroundColor: "#285CA3",
    borderColor: "#285CA3",
    borderBottomRightRadius: 5,
  },

  chatBubbleReceived: {
    borderBottomLeftRadius: 5,
  },

  chatMessageText: {
    color: "#25364E",
  },

  chatTime: {
    alignSelf: "flex-end",
    marginTop: 5,
    color: "#8997AA",
    fontSize: 10,
  },

  chatEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  chatEmptyText: {
    color: "#8290A4",
    fontSize: 13,
    textAlign: "center",
  },

  chatEmptyTitle: {
    color: "#263E60",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  chatEmptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF1FB",
  },

  chatEmptyIconText: {
    color: "#285CA3",
    fontSize: 25,
  },

  chatError: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFF0F0",
    borderTopWidth: 1,
    borderTopColor: "#F4D4D4",
  },

  chatErrorText: {
    color: "#A32E2E",
    fontSize: 12,
    lineHeight: 18,
  },

  chatFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E7EDF5",
  },

  chatInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 43,
    maxHeight: 120,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E1E8F2",
    borderRadius: 22,
    backgroundColor: "#F4F7FB",
    color: "#26364D",
    lineHeight: 22,
    textAlignVertical: "top",
  },

  chatInputFocused: {
    borderColor: "#91B0DD",
    backgroundColor: "#FFFFFF",
  },

  chatSend: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#285CA3",
  },
});


// Estilos da tela web Solicitações, adaptados para React Native.
const modern = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#071b3d" },
  body: { flex: 1, backgroundColor: "#f3f7fd" },
  page: { flexGrow: 1, backgroundColor: "#f3f7fd", paddingBottom: 60 },
  hero: { backgroundColor: "#0b3474", paddingVertical: 30, paddingHorizontal: 20 },
  heroInner: { width: "100%", maxWidth: 1060, alignSelf: "center" },
  brand: { color: "white", fontWeight: "900", fontSize: 20 },
  brandAccent: { color: "#3f9cff" },
  heroTag: { alignSelf: "flex-start", marginTop: 22, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.10)" },
  heroTagText: { color: "#b9d7ff", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  heroTitle: { color: "white", fontSize: 30, fontWeight: "800", marginTop: 16, letterSpacing: -0.8 },
  heroDescription: { color: "#c8d9f1", fontSize: 14, lineHeight: 22, marginTop: 8 },
  backButton: { alignSelf: "flex-start", marginTop: 20, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: "#7194c4" },
  backText: { color: "white", fontSize: 13, fontWeight: "700" },
  content: { width: "94%", maxWidth: 1060, alignSelf: "center", marginTop: 24 },
  overview: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  eyebrow: { color: "#1261d2", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  overviewTitle: { color: "#0a2145", fontSize: 25, fontWeight: "800", marginTop: 8, marginBottom: 5 },
  muted: { color: "#788ba6", fontSize: 13, lineHeight: 20 },
  totalBox: { minWidth: 86, alignItems: "center", backgroundColor: "white", borderWidth: 1, borderColor: "#e0e9f6", borderRadius: 17, paddingVertical: 13, paddingHorizontal: 12 },
  totalNumber: { fontSize: 26, fontWeight: "800", color: "#0d4ca5" },
  totalLabel: { fontSize: 10, color: "#8292a9" },
  card: { backgroundColor: "white", borderWidth: 1, borderColor: "#e1e9f4", borderRadius: 18, padding: 18, marginBottom: 20, shadowColor: "#113364", shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  cardTop: { gap: 14 },
  objectRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  objectIcon: { width: 58, height: 58, borderRadius: 16, backgroundColor: "#eaf2ff", alignItems: "center", justifyContent: "center" },
  diamond: { color: "#1466d9", fontSize: 36 },
  objectTitle: { color: "#0a2145", fontSize: 19, fontWeight: "800", marginTop: 6, marginBottom: 4 },
  objectDescription: { color: "#70819b", fontSize: 13, lineHeight: 20 },
  status: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, borderRadius: 100, paddingHorizontal: 13, paddingVertical: 9 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: "800" },
  status_done: {
    backgroundColor: "#e0f8ea",
  },
  dot_done: {
    backgroundColor: "#16844c",
  },
  text_done: {
    color: "#16844c",
  },
  status_done: { backgroundColor: "#e0f8ea" }, dot_done: { backgroundColor: "#16844c" }, text_done: { color: "#16844c" },
  status_waiting: { backgroundColor: "#fff3d9" }, dot_waiting: { backgroundColor: "#a66a00" }, text_waiting: { color: "#a66a00" },
  status_progress: { backgroundColor: "#e8f1ff" }, dot_progress: { backgroundColor: "#155bc0" }, text_progress: { color: "#155bc0" },
  status_closed: { backgroundColor: "#f2f3f6" }, dot_closed: { backgroundColor: "#697386" }, text_closed: { color: "#697386" },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  details: { gap: 12, marginTop: 22 },
  detail: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f6f9fe", borderWidth: 1, borderColor: "#edf2f9", borderRadius: 13, padding: 14 },
  detailIcon: { width: 34, height: 34, backgroundColor: "#e5efff", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  detailSymbol: { color: "#1766cf", fontSize: 22 },
  detailLabel: { color: "#8190a6", fontSize: 11 },
  detailValue: { color: "#203d64", fontSize: 12, fontWeight: "800", marginTop: 5 },
  document: { marginTop: 22, borderWidth: 1, borderColor: "#e0e9f5", borderRadius: 17, padding: 16, backgroundColor: "#fbfdff" },
  documentHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  documentTitle: { color: "#102a50", fontSize: 17, fontWeight: "800", marginVertical: 7 },
  documentIcon: { width: 43, height: 43, borderRadius: 12, backgroundColor: "#e7f0ff", alignItems: "center", justifyContent: "center" },
  documentSymbol: { color: "#1b66cf", fontSize: 26 },
  footer: { borderTopWidth: 1, borderTopColor: "#edf1f7", marginTop: 24, paddingTop: 20, gap: 15 },
  footerNote: { flexDirection: "row", alignItems: "center", gap: 9 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#20a77c" },
  primaryButton: { backgroundColor: "#1559bc", borderRadius: 10, paddingHorizontal: 17, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "white", fontSize: 13, fontWeight: "800" },
  secondaryButton: { backgroundColor: "#edf4ff", borderWidth: 1, borderColor: "#d9e6fb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  secondaryText: { color: "#1554b5", fontSize: 12, fontWeight: "800" },
  review: { marginTop: 24, padding: 16, backgroundColor: "#f7faff", borderWidth: 1, borderColor: "#e2ebf7", borderRadius: 17 },
  stars: { flexDirection: "row", alignItems: "center", gap: 5, marginVertical: 14 },
  star: { fontSize: 29, color: "#cbd5e1" },
  starSelected: { color: "#f3b324" },
  ratingValue: { color: "#697c97", fontSize: 12, fontWeight: "800", marginLeft: 8 },
  reviewInput: { minHeight: 86, padding: 14, borderWidth: 1, borderColor: "#d9e3f1", borderRadius: 11, backgroundColor: "white", color: "#0c2446", fontSize: 13, textAlignVertical: "top" },
  reviewActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 13 },
  successBox: { marginTop: 15, backgroundColor: "#e4f8ec", padding: 13, borderRadius: 10 },
  successText: { color: "#137345", fontSize: 13, fontWeight: "700" },
  reviewEntry: { color: "#203d64", fontSize: 13, borderTopWidth: 1, borderTopColor: "#e2e9f2", paddingTop: 12, marginTop: 12 },
  chatWrap: { marginTop: 22, borderTopWidth: 1, borderTopColor: "#edf1f7", paddingTop: 20 },
  pagination: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 20 },
  empty: { padding: 28, backgroundColor: "white", borderWidth: 1, borderColor: "#e0e9f4", borderRadius: 20, alignItems: "center", gap: 12 },
  emptyIcon: { color: "#347bdf", fontSize: 42 },
  emptyTitle: { color: "#122d53", fontSize: 18, fontWeight: "800", textAlign: "center" },
  errorBox: { padding: 15, marginBottom: 20, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fff1f2", borderRadius: 12 },
  errorText: { color: "#b42318", fontSize: 13 },
});
