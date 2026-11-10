import React, {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../services/api";

const COLORS = {
  navy950: "#031126",
  navy900: "#061A40",
  blue700: "#0D4FA8",
  blue600: "#1468D8",
  blue500: "#2D84F7",
  blue400: "#5EA2FF",
  blue300: "#91C3FF",
  text900: "#0F172A",
  text500: "#64748B",
  text400: "#94A3B8",
  background: "#F4F7FB",
};

function Txt({ style, ...props }) {
  return <Text {...props} style={[styles.text, style]} />;
}

function Icon({ name, size = 22, color = COLORS.blue600 }) {
  const paths = {
    plus: ["M12 5v14", "M5 12h14"],
    bell: [
      "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z",
      "M10 21h4",
    ],
    package: [
      "M4 7l8-4 8 4v10l-8 4-8-4V7Z",
      "M4 7l8 4 8-4M12 11v10",
    ],
    location: [
      "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z",
    ],
    history: [
      "M3 12a9 9 0 1 0 3-6.7L3 8",
      "M3 3v5h5M12 7v5l3 2",
    ],
    arrow: ["M5 12h14m-5-5 5 5-5 5"],
    check: ["m5 12 4 4L19 6"],
    match: ["m11 11 2 2"],
    shield: [
      "M12 3 20 6v5c0 5.1-3.4 8.7-8 10-4.6-1.3-8-4.9-8-10V6l8-3Z",
      "m9 12 2 2 4-4",
    ],
    message: [
      "M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z",
    ],
    menu: ["M4 6h16M4 12h16M4 18h16"],
    close: ["m6 6 12 12M18 6 6 18"],
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

      {name === "location" && (
        <Circle cx={12} cy={10} r={2.5} />
      )}

      {name === "match" && (
        <>
          <Circle cx={8} cy={8} r={4} />
          <Circle cx={16} cy={16} r={4} />
        </>
      )}
    </Svg>
  );
}

function Paint({
  colors,
  locations,
  angle = 135,
  glows = [],
}) {
  const identifier = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `gradient${identifier}`;

  const [size, setSize] = useState({
    width: 1,
    height: 1,
  });

  const canvasWidth = Math.max(size.width, 1);
  const canvasHeight = Math.max(size.height, 1);

  const radians = ((angle - 90) * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);

  const length =
    Math.abs(canvasWidth * dx) +
    Math.abs(canvasHeight * dy);

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
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      >
        <Defs>
          <LinearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1={canvasWidth / 2 - (dx * length) / 2}
            y1={canvasHeight / 2 - (dy * length) / 2}
            x2={canvasWidth / 2 + (dx * length) / 2}
            y2={canvasHeight / 2 + (dy * length) / 2}
          >
            {colors.map((color, index) => (
              <Stop
                key={index}
                offset={`${
                  (locations?.[index] ??
                    index / Math.max(colors.length - 1, 1)) * 100
                }%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>

          {glows.map((glow, index) => {
            const cx = canvasWidth * glow.x;
            const cy = canvasHeight * glow.y;

            const radius = Math.max(
              1,
              Math.hypot(
                Math.max(cx, canvasWidth - cx),
                Math.max(cy, canvasHeight - cy)
              ) * glow.radius
            );

            return (
              <RadialGradient
                key={index}
                id={`${gradientId}glow${index}`}
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                rx={radius}
                ry={radius}
              >
                <Stop
                  offset="0%"
                  stopColor={glow.color}
                  stopOpacity={glow.opacity}
                />
                <Stop
                  offset="100%"
                  stopColor={glow.color}
                  stopOpacity={0}
                />
              </RadialGradient>
            );
          })}
        </Defs>

        <Rect
          width={canvasWidth}
          height={canvasHeight}
          fill={`url(#${gradientId})`}
        />

        {glows.map((_, index) => (
          <Rect
            key={index}
            width={canvasWidth}
            height={canvasHeight}
            fill={`url(#${gradientId}glow${index})`}
          />
        ))}
      </Svg>
    </View>
  );
}

function Button({
  label,
  onPress,
  icon,
  arrow,
  color = COLORS.navy900,
  style,
  textStyle,
  gradient,
  angle = 135,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && styles.pressed,
      ]}
    >
      {gradient && <Paint colors={gradient} angle={angle} />}

      {icon && <Icon name={icon} size={20} color={color} />}

      <Txt
        style={[
          styles.buttonText,
          { color },
          textStyle,
        ]}
      >
        {label}
      </Txt>

      {arrow && <Icon name="arrow" size={18} color={color} />}
    </Pressable>
  );
}

function Heading({
  eyebrow,
  title,
  description,
  titleSize,
  style,
}) {
  return (
    <View style={[styles.heading, style]}>
      <Txt style={styles.eyebrow}>{eyebrow}</Txt>

      <Txt
        accessibilityRole="header"
        style={[
          styles.sectionTitle,
          { fontSize: titleSize },
        ]}
      >
        {title}
      </Txt>

      {!!description && (
        <Txt style={styles.sectionDescription}>
          {description}
        </Txt>
      )}
    </View>
  );
}

function Brand({ small = false, footer = false, layout }) {
  return (
    <View style={[styles.brand, footer && { gap: 11 }]}>
      <View
        style={[
          styles.brandLogo,
          {
            width: small ? 40 : layout.logoSize,
            height: small ? 40 : layout.logoSize,
            borderRadius: small ? 15 : layout.logoRadius,
          },
        ]}
      >
        <Paint
          colors={[COLORS.navy900, COLORS.blue600]}
          angle={145}
        />

        <Txt style={styles.brandLogoText}>OT</Txt>
      </View>

      <View style={{ flexShrink: 1 }}>
        <Txt
          style={[
            styles.brandName,
            { fontSize: footer ? 18 : layout.brandSize },
          ]}
        >
          Onde
          <Txt style={{ color: COLORS.blue600 }}>Tá</Txt>
        </Txt>

        {footer ? (
          <Txt style={styles.footerDescription}>
            Segurança e organização na devolução de objetos.
          </Txt>
        ) : (
          !layout.phone && (
            <Txt style={styles.brandSubtitle}>
              Achados & Perdidos
            </Txt>
          )
        )}
      </View>
    </View>
  );
}

function getLayout(width) {
  const tiny = width <= 420;
  const phone = width <= 680;
  const tablet = width <= 920;
  const intermediate = width <= 1180;

  const mainWidth = phone
    ? width - (tiny ? 18 : 28)
    : Math.min(1400, width * 0.92);

  const quickWidth = Math.min(1320, mainWidth);
  const quickColumns = phone ? 1 : intermediate ? 2 : 3;

  const heroFont = tiny
    ? 33
    : phone
      ? Math.min(48, Math.max(34, width * 0.11))
      : Math.min(61, Math.max(38, width * 0.04));

  return {
    tiny,
    phone,
    tablet,
    intermediate,
    mainWidth,
    quickWidth,
    quickColumns,
    quickCardWidth:
      (quickWidth - (quickColumns - 1) * 16) / quickColumns,
    navbarHeight: tablet ? 72 : 80,
    navbarPadding: tiny
      ? 12
      : phone
        ? 18
        : width * (intermediate ? 0.03 : 0.05),
    logoSize: tiny ? 38 : phone ? 41 : 46,
    logoRadius: phone ? 13 : 15,
    brandSize: tiny ? 17 : phone ? 19 : 22,
    iconSize: tiny ? 40 : 44,
    heroFont,
    heroPaddingV: tiny ? 31 : phone ? 38 : tablet ? 48 : intermediate ? 52 : 62,
    heroPaddingH: tiny ? 18 : phone ? 23 : tablet ? 38 : intermediate ? 45 : 66,
    heroRadius: tiny ? 21 : phone ? 25 : 34,
    heroGap: tablet ? 35 : intermediate ? 40 : 70,
    sectionGap: phone ? 32 : 50,
    headingSize: phone ? 23 : 27,
    matchPaddingV: tiny ? 27 : phone ? 31 : 40,
    matchPaddingH: tiny ? 18 : phone ? 23 : 43,
    matchTitleSize: phone ? 25 : 30,
    itemPadding: tiny ? 17 : phone ? 21 : 30,
    itemIconSize: phone ? 53 : 62,
    itemGap: phone ? 12 : 15,
    ringSize: phone ? 150 : 175,
    processColumns: phone ? 1 : intermediate ? 2 : 4,
    processPaddingH: phone ? 19 : 36,
    processPaddingV: phone ? 24 : 36,
    footerWidth: phone
      ? width - 28
      : Math.min(1400, width * 0.92),
  };
}
export default function UsuarioHomeScreen({ navigation, route }) {
  const { user: usuario, logout } = useAuth();
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const width = dimensions.width - insets.left - insets.right;
  const layout = getLayout(width);

  const scrollRef = useRef(null);
  const sections = useRef({});
  const mounted = useRef(true);
  const matchRequest = useRef(0);

  const [menuAberto, setMenuAberto] = useState(false);
  const [meusItens, setMeusItens] = useState([]);
  const [carregandoItens, setCarregandoItens] = useState(true);
  const [erroItens, setErroItens] = useState("");

  const [
    itemCorrespondenciaSelecionado,
    setItemCorrespondenciaSelecionado,
  ] = useState(null);

  const [
    correspondenciasItemSelecionado,
    setCorrespondenciasItemSelecionado,
  ] = useState([]);

  const [
    carregandoCorrespondencias,
    setCarregandoCorrespondencias,
  ] = useState(false);

  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  const [atividade, setAtividade] = useState({
    itensCadastrados: 0,
    possiveisCorrespondencias: 0,
    emValidacao: 0,
    recuperados: 0,
  });

  useEffect(() => {
    mounted.current = true;

    carregarItens();
    carregarQuantidadeNotificacoes();

    return () => {
      mounted.current = false;
      matchRequest.current += 1;
    };
  }, []);

  useEffect(() => {
    if (route?.params?.secao === "correspondencias") {
      requestAnimationFrame(() => {
        irParaSecao("correspondencias");
      });
    }
  }, [route?.params?.secao]);

  async function carregarItens() {
    try {
      setCarregandoItens(true);
      setErroItens("");

      const response = await apiRequest(
        "/items?page=1&page_size=20&item_type=PERDIDO"
      );

      const itensBackend = response.items || [];

      const resultados = await Promise.all(
        itensBackend.map(async (item) => {
          try {
            const resultado = await apiRequest(
              `/items/${item.id}/matches`
            );

            return resultado.items || [];
          } catch {
            return [];
          }
        })
      );

      if (!mounted.current) return;

      setAtividade({
        itensCadastrados: itensBackend.length,
        possiveisCorrespondencias: resultados.reduce(
          (total, lista) => total + lista.length,
          0
        ),
        emValidacao: itensBackend.filter(
          (item) => item.status === "EM_NEGOCIACAO"
        ).length,
        recuperados: itensBackend.filter(
          (item) => item.status === "DEVOLVIDO"
        ).length,
      });

      setMeusItens(itensBackend);

      if (itensBackend.length > 0) {
        const primeiroItem = itensBackend[0];

        setItemCorrespondenciaSelecionado(primeiroItem);
        await carregarCorrespondenciasDoItem(primeiroItem);
      }
    } catch (error) {
      if (mounted.current) {
        setErroItens(
          error.message || "Não foi possível carregar seus itens."
        );
      }
    } finally {
      if (mounted.current) setCarregandoItens(false);
    }
  }

  async function carregarQuantidadeNotificacoes() {
    try {
      const response = await apiRequest(
        "/notifications?page=1&page_size=50"
      );

      if (!mounted.current) return;

      setNotificacoesNaoLidas(
        (response.items || []).filter((item) => !item.is_read).length
      );
    } catch {
      if (mounted.current) setNotificacoesNaoLidas(0);
    }
  }

  async function carregarCorrespondenciasDoItem(item) {
    const requestId = ++matchRequest.current;

    setCarregandoCorrespondencias(true);

    try {
      const response = await apiRequest(
        `/items/${item.id}/matches`
      );

      if (!mounted.current || requestId !== matchRequest.current) {
        return;
      }

      setCorrespondenciasItemSelecionado(
        [...(response.items || [])].sort(
          (a, b) =>
            Number(b.similarity_score) -
            Number(a.similarity_score)
        )
      );
    } catch {
      if (
        mounted.current &&
        requestId === matchRequest.current
      ) {
        setCorrespondenciasItemSelecionado([]);
      }
    } finally {
      if (
        mounted.current &&
        requestId === matchRequest.current
      ) {
        setCarregandoCorrespondencias(false);
      }
    }
  }

  function navegar(name, params) {
    setMenuAberto(false);
    navigation.navigate(name, params);
  }

  function irParaSecao(id) {
    setMenuAberto(false);

    scrollRef.current?.scrollTo({
      y: sections.current[id] || 0,
      animated: true,
    });
  }

  async function sair() {
    try {
      await logout();
    } catch (error) {
      setErroItens(error.message);
    }
  }

  function registrarPosicao(id, event) {
    sections.current[id] = event.nativeEvent.layout.y;
  }

  const temCorrespondencia =
    correspondenciasItemSelecionado.length > 0;

  const primeiraCorrespondencia =
    correspondenciasItemSelecionado[0];

  const manual = Boolean(primeiraCorrespondencia?.is_manual);

  const navItems = [
    ["Início", () => irParaSecao("inicio")],
    ["Meus itens perdidos", () => irParaSecao("meus-itens")],
    ["Correspondências", () => irParaSecao("correspondencias")],
    ["Solicitações", () => navegar("Solicitacoes")],
  ];

  const summaryItems = [
    [atividade.itensCadastrados, "Itens cadastrados", "#E65A5A"],
    [
      atividade.possiveisCorrespondencias,
      atividade.possiveisCorrespondencias === 1
        ? "Possível correspondência"
        : "Possíveis correspondências",
      "#E4A925",
    ],
    [atividade.emValidacao, "Em validação", "#528EE8"],
    [
      atividade.recuperados,
      atividade.recuperados === 1
        ? "Objeto recuperado"
        : "Objetos recuperados",
      "#22A47C",
    ],
  ];

  const processItems = [
    [
      "plus",
      "Você registra o que perdeu",
      "Informe o máximo de detalhes sobre seu objeto perdido.",
    ],
    [
      "match",
      "O sistema compara",
      "Seus dados são cruzados com os objetos cadastrados pela equipe.",
    ],
    [
      "shield",
      "A propriedade é validada",
      "Informações específicas ajudam a comprovar que o objeto é seu.",
    ],
    [
      "check",
      "Retirada autorizada",
      "Após a aprovação, o processo de devolução pode ser concluído.",
    ],
  ];

  const processInnerWidth =
    layout.mainWidth - layout.processPaddingH * 2 - 2;

  const processCardWidth =
    layout.processColumns === 4
      ? (processInnerWidth - 45 * 3) / 4
      : (processInnerWidth -
          (layout.processColumns - 1) * 15) /
        layout.processColumns;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navbarWrapper}>
        <View
          style={[
            styles.navbar,
            {
              height: layout.navbarHeight,
              paddingHorizontal: layout.navbarPadding,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="OndeTá — início"
            onPress={() => irParaSecao("inicio")}
          >
            <Brand layout={layout} />
          </Pressable>

          {!layout.tablet && (
            <View style={styles.desktopNavigation}>
              {navItems.map(([label, onPress], index) => (
                <Pressable
                  key={label}
                  onPress={onPress}
                  accessibilityRole="button"
                  style={[
                    styles.navItem,
                    layout.intermediate && {
                      paddingVertical: 11,
                      paddingHorizontal: 9,
                    },
                    index === 0 && styles.navItemActive,
                  ]}
                >
                  <Txt
                    style={[
                      styles.navItemText,
                      {
                        fontSize: layout.intermediate ? 10 : 12,
                      },
                      index === 0 && {
                        color: COLORS.blue600,
                      },
                    ]}
                  >
                    {label}
                  </Txt>
                </Pressable>
              ))}
            </View>
          )}

          <View
            style={[
              styles.navbarActions,
              { gap: layout.tiny ? 6 : 10 },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notificações"
              onPress={() => navegar("Notificacoes")}
              style={[
                styles.navbarIcon,
                {
                  width: layout.iconSize,
                  height: layout.iconSize,
                },
              ]}
            >
              <Icon name="bell" color="#40516A" />

              {notificacoesNaoLidas > 0 && (
                <View style={styles.notificationDot}>
                  <Paint
                    colors={[COLORS.blue500, COLORS.blue700]}
                  />

                  <Txt style={styles.notificationText}>
                    {notificacoesNaoLidas > 99
                      ? "99+"
                      : notificacoesNaoLidas}
                  </Txt>
                </View>
              )}
            </Pressable>

            {!layout.phone && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Minha conta"
                onPress={() => navegar("Perfil")}
                style={styles.profileButton}
              >
                <View style={styles.profileAvatar}>
                  <Paint
                    colors={["#E3EFFF", "#CFE2FB"]}
                    angle={145}
                  />

                  <Txt style={styles.profileInitial}>
                    {usuario?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Txt>
                </View>

                {!layout.tablet && (
                  <View>
                    <Txt
                      numberOfLines={1}
                      style={styles.profileName}
                    >
                      {usuario?.name || "Usuário"}
                    </Txt>
                    <Txt style={styles.profileCaption}>
                      Minha conta
                    </Txt>
                  </View>
                )}
              </Pressable>
            )}

            {layout.tablet && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  menuAberto ? "Fechar menu" : "Abrir menu"
                }
                accessibilityState={{ expanded: menuAberto }}
                onPress={() => setMenuAberto((value) => !value)}
                style={[
                  styles.menuButton,
                  {
                    width: layout.iconSize,
                    height: layout.iconSize,
                  },
                ]}
              >
                <Icon
                  name={menuAberto ? "close" : "menu"}
                  color={COLORS.navy900}
                />
              </Pressable>
            )}
          </View>
        </View>

        {layout.tablet && menuAberto && (
          <View
            style={[
              styles.mobileMenu,
              { top: layout.navbarHeight },
            ]}
          >
            {navItems.map(([label, onPress], index) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                onPress={onPress}
                style={[
                  styles.mobileMenuItem,
                  index === 0 && styles.navItemActive,
                ]}
              >
                <Txt
                  style={[
                    styles.navItemText,
                    { fontSize: 10 },
                    index === 0 && {
                      color: COLORS.blue600,
                    },
                  ]}
                >
                  {label}
                </Txt>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        <View
          style={[
            styles.main,
            {
              width: layout.mainWidth,
              paddingTop: layout.phone ? 20 : 36,
            },
          ]}
        >
          <View
            onLayout={(event) => registrarPosicao("inicio", event)}
            style={[
              styles.hero,
              {
                minHeight: layout.phone ? 0 : 540,
                paddingVertical: layout.heroPaddingV,
                paddingHorizontal: layout.heroPaddingH,
                borderRadius: layout.heroRadius,
                gap: layout.heroGap,
                flexDirection: layout.tablet ? "column" : "row",
              },
            ]}
          >
            <Paint
              colors={["#031329", "#07285F", "#0B5CC6"]}
              locations={[0, 0.52, 1]}
              glows={[
                {
                  x: 0.88,
                  y: 0.15,
                  color: "#5CA9FF",
                  opacity: 0.3,
                  radius: 0.27,
                },
                {
                  x: 0.72,
                  y: 0.87,
                  color: "#2D84F7",
                  opacity: 0.22,
                  radius: 0.28,
                },
              ]}
            />

            <View
              pointerEvents="none"
              style={styles.heroDecorationOne}
            />
            <View
              pointerEvents="none"
              style={styles.heroDecorationTwo}
            />

            <View
              style={[
                styles.heroContent,
                !layout.tablet && {
                  flex: layout.intermediate ? 1.25 : 1.4,
                },
              ]}
            >
              <Txt style={styles.heroEyebrow}>PORTAL ONDETÁ</Txt>

              <Txt style={styles.greeting}>
                Olá,{" "}
                <Txt style={styles.greetingName}>
                  {usuario?.name?.split(" ")[0] || "Usuário"}
                </Txt>
                .
              </Txt>

              <Txt
                accessibilityRole="header"
                style={[
                  styles.heroTitle,
                  {
                    fontSize: layout.heroFont,
                    lineHeight: layout.heroFont * 1.03,
                    letterSpacing: layout.phone ? -1.8 : -2.5,
                  },
                ]}
              >
                Perdeu alguma coisa?{"\n"}
                Conte para o OndeTá.
              </Txt>

              <Txt
                style={[
                  styles.heroDescription,
                  {
                    fontSize: layout.phone ? 13 : 15,
                    lineHeight: (layout.phone ? 13 : 15) * 1.75,
                  },
                ]}
              >
                Cadastre as informações do objeto que você perdeu.
                O sistema compara seu registro com os objetos
                encontrados cadastrados pela equipe responsável e
                avisa quando existir uma possível correspondência.
              </Txt>

              <View
                style={[
                  styles.heroActions,
                  layout.phone && {
                    flexDirection: "column",
                    alignItems: "stretch",
                  },
                ]}
              >
                <Button
                  label="Registrar objeto perdido"
                  icon="plus"
                  arrow
                  gradient={["#FFFFFF", "#EDF5FF"]}
                  onPress={() => navegar("RegistrarItem")}
                  style={[
                    styles.heroPrimaryButton,
                    layout.phone && { width: "100%" },
                  ]}
                />

                <Button
                  label="Ver meus itens"
                  icon="package"
                  color="#FFFFFF"
                  onPress={() => irParaSecao("meus-itens")}
                  style={[
                    styles.heroSecondaryButton,
                    layout.phone && { width: "100%" },
                  ]}
                />
              </View>

              <View style={styles.heroSecurity}>
                <Icon
                  name="shield"
                  size={18}
                  color="#91ADD0"
                />

                <Txt style={styles.heroSecurityText}>
                  Os objetos encontrados não ficam expostos
                  publicamente.
                </Txt>
              </View>
            </View>

            <View
              style={[
                styles.statusCard,
                {
                  minHeight: layout.phone
                    ? 300
                    : layout.tablet
                      ? 320
                      : 370,
                  padding: layout.phone ? 20 : 26,
                },
                layout.tablet
                  ? {
                      width: "100%",
                      maxWidth: 440,
                      alignSelf: "center",
                    }
                  : {
                      flex: layout.intermediate ? 0.75 : 0.6,
                      minWidth: layout.intermediate ? 280 : 310,
                    },
              ]}
            >
              <Paint
                colors={[
                  "rgba(255,255,255,0.15)",
                  "rgba(255,255,255,0.045)",
                ]}
                angle={145}
              />

              <View
                style={[
                  styles.statusIllustration,
                  { minHeight: layout.phone ? 210 : 250 },
                ]}
              >
                <View
                  style={[
                    styles.orbit,
                    {
                      width: layout.phone ? 165 : 190,
                      height: layout.phone ? 165 : 190,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.orbit,
                    {
                      width: layout.phone ? 205 : 235,
                      height: layout.phone ? 205 : 235,
                      opacity: 0.55,
                    },
                  ]}
                />

                <View
                  style={[
                    styles.statusCircle,
                    {
                      width: layout.phone ? 115 : 135,
                      height: layout.phone ? 115 : 135,
                    },
                  ]}
                >
                  <Paint
                    colors={[
                      "rgba(91,169,255,0.42)",
                      "rgba(37,112,212,0.16)",
                    ]}
                    angle={145}
                  />
                  <Icon name="match" size={42} color="#FFFFFF" />
                </View>

                <View
                  style={[
                    styles.floatingBadge,
                    {
                      top: 20,
                      right: layout.tiny ? -2 : 0,
                      paddingVertical: layout.phone ? 8 : 9,
                      paddingHorizontal: layout.phone ? 9 : 12,
                    },
                  ]}
                >
                  <Icon
                    name="package"
                    size={17}
                    color="#EAF4FF"
                  />
                  <Txt
                    style={[
                      styles.floatingBadgeText,
                      { fontSize: layout.phone ? 8 : 10 },
                    ]}
                  >
                    Item cadastrado
                  </Txt>
                </View>

                <View
                  style={[
                    styles.floatingBadge,
                    {
                      bottom: 22,
                      left: layout.tiny ? -2 : 0,
                      paddingVertical: layout.phone ? 8 : 9,
                      paddingHorizontal: layout.phone ? 9 : 12,
                    },
                  ]}
                >
                  <Icon name="check" size={17} color="#EAF4FF" />
                  <Txt
                    style={[
                      styles.floatingBadgeText,
                      { fontSize: layout.phone ? 8 : 10 },
                    ]}
                  >
                    Correspondência
                  </Txt>
                </View>
              </View>

              <View style={styles.statusFooter}>
                <Txt style={styles.statusFooterLabel}>
                  Correspondência automática
                </Txt>
                <Txt style={styles.statusFooterTitle}>
                  Você cadastra. O sistema procura.
                </Txt>
              </View>
            </View>
          </View>

          <View
            style={{
              width: layout.quickWidth,
              alignSelf: "center",
              marginTop: layout.sectionGap,
            }}
          >
            <Heading
              eyebrow="ACESSO RÁPIDO"
              title="Acompanhe seus objetos"
              description="Tudo relacionado aos seus registros fica concentrado em um só lugar."
              titleSize={layout.headingSize}
            />

            <View style={styles.quickGrid}>
              {[
                [
                  "plus",
                  "Registrar objeto perdido",
                  "Informe local, data, categoria, fotos e características do item.",
                  "RegistrarItem",
                ],
                [
                  "package",
                  "Meus itens perdidos",
                  "Consulte somente os objetos que foram cadastrados por você.",
                  "MeusItens",
                ],
                [
                  "history",
                  "Minhas solicitações",
                  "Acompanhe validações, retirada e andamento das suas solicitações.",
                  "Solicitacoes",
                ],
              ].map(([icon, title, description, screen], index) => (
                <Pressable
                  key={screen}
                  accessibilityRole="button"
                  onPress={() => navegar(screen)}
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      width: layout.quickCardWidth,
                      minHeight: layout.phone ? 175 : 195,
                    },
                    index === 0 && styles.quickCardPrimary,
                    pressed && styles.pressed,
                  ]}
                >
                  <Paint
                    colors={
                      index === 0
                        ? [COLORS.navy950, COLORS.blue600]
                        : ["#FFFFFF", "#FBFDFF"]
                    }
                    angle={index === 0 ? 140 : 180}
                    glows={
                      index === 0
                        ? [
                            {
                              x: 1,
                              y: 0,
                              color: "#5EA2FF",
                              opacity: 0.28,
                              radius: 0.34,
                            },
                          ]
                        : []
                    }
                  />

                  <View
                    style={[
                      styles.quickIcon,
                      index === 0 && styles.quickIconPrimary,
                    ]}
                  >
                    {index !== 0 && (
                      <Paint
                        colors={["#EDF5FF", "#E1EFFF"]}
                        angle={145}
                      />
                    )}
                    <Icon
                      name={icon}
                      color={index === 0 ? "#FFFFFF" : COLORS.blue600}
                    />
                  </View>

                  <View style={styles.quickArrow}>
                    <Icon
                      name="arrow"
                      size={20}
                      color={index === 0 ? "#C5DCF8" : "#A9B5C6"}
                    />
                  </View>

                  <Txt
                    style={[
                      styles.quickTitle,
                      index === 0 && { color: "#FFFFFF" },
                    ]}
                  >
                    {title}
                  </Txt>

                  <Txt
                    style={[
                      styles.quickDescription,
                      index === 0 && { color: "#BFD0E8" },
                    ]}
                  >
                    {description}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </View>
                    <View
            onLayout={(event) =>
              registrarPosicao("correspondencias", event)
            }
            style={{
              width: layout.quickWidth,
              alignSelf: "center",
              marginTop: layout.sectionGap,
            }}
          >
            <View
              style={[
                styles.matchCard,
                {
                  flexDirection: layout.tablet ? "column" : "row",
                },
              ]}
            >
              <Paint
                colors={["#041534", "#0A367D"]}
                angle={125}
                glows={[
                  {
                    x: 0.88,
                    y: 0.2,
                    color: "#4296FF",
                    opacity: 0.25,
                    radius: 0.3,
                  },
                ]}
              />

              <View
                pointerEvents="none"
                style={styles.matchDecoration}
              />

              <View
                style={[
                  styles.matchContent,
                  {
                    paddingVertical: layout.matchPaddingV,
                    paddingHorizontal: layout.matchPaddingH,
                  },
                  !layout.tablet && { flex: 1.35 },
                ]}
              >
                {!carregandoCorrespondencias && (
                  <View style={styles.matchSelector}>
                    <Txt style={styles.matchSelectorLabel}>
                      SEUS OBJETOS PERDIDOS
                    </Txt>

                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.matchTabs}
                    >
                      {meusItens.map((item) => {
                        const active =
                          itemCorrespondenciaSelecionado?.id ===
                          item.id;

                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => {
                              setItemCorrespondenciaSelecionado(item);
                              carregarCorrespondenciasDoItem(item);
                            }}
                            style={[
                              styles.matchTab,
                              active && styles.matchTabActive,
                            ]}
                          >
                            <Txt
                              style={[
                                styles.matchTabText,
                                active && styles.matchTabTextActive,
                              ]}
                            >
                              {item.title}
                            </Txt>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                <Txt style={styles.matchLabel}>
                  {carregandoCorrespondencias
                    ? "VERIFICANDO CORRESPONDÊNCIAS"
                    : temCorrespondencia
                      ? correspondenciasItemSelecionado.length === 1
                        ? "NOVA CORRESPONDÊNCIA"
                        : `${correspondenciasItemSelecionado.length} CORRESPONDÊNCIAS ENCONTRADAS`
                      : "CORRESPONDÊNCIAS"}
                </Txt>

                <Txt
                  accessibilityRole="header"
                  style={[
                    styles.matchTitle,
                    { fontSize: layout.matchTitleSize },
                  ]}
                >
                  {carregandoCorrespondencias
                    ? "Procurando possíveis combinações..."
                    : temCorrespondencia
                      ? "Podemos ter encontrado algo seu."
                      : "Nenhuma correspondência encontrada para este objeto."}
                </Txt>

                <Txt style={styles.matchDescription}>
                  {carregandoCorrespondencias ? (
                    <>
                      O OndeTá está verificando o objeto{" "}
                      <Txt style={styles.bold}>
                        {itemCorrespondenciaSelecionado?.title ||
                          "selecionado"}
                      </Txt>
                      .
                    </>
                  ) : temCorrespondencia ? (
                    <>
                      O sistema encontrou um objeto com características
                      semelhantes ao seu registro de{" "}
                      <Txt style={styles.bold}>
                        {itemCorrespondenciaSelecionado?.title}
                      </Txt>
                      .
                    </>
                  ) : (
                    <>
                      O objeto{" "}
                      <Txt style={styles.bold}>
                        {itemCorrespondenciaSelecionado?.title ||
                          "selecionado"}
                      </Txt>{" "}
                      continua registrado. O sistema continuará comparando
                      seus dados com objetos encontrados cadastrados pela
                      equipe.
                    </>
                  )}
                </Txt>

                {!carregandoCorrespondencias &&
                  temCorrespondencia && (
                    <View
                      style={[
                        styles.matchComparison,
                        {
                          flexDirection: layout.phone
                            ? "column"
                            : "row",
                        },
                      ]}
                    >
                      <View style={styles.matchObject}>
                        <View style={styles.matchObjectIcon}>
                          <Icon
                            name="package"
                            size={25}
                            color="#B9D8FF"
                          />
                        </View>

                        <View style={styles.matchObjectInfo}>
                          <Txt style={styles.matchObjectLabel}>
                            SEU ITEM PERDIDO
                          </Txt>
                          <Txt style={styles.matchObjectTitle}>
                            {itemCorrespondenciaSelecionado?.title}
                          </Txt>
                          <Txt style={styles.matchObjectDescription}>
                            Registrado em{" "}
                            {itemCorrespondenciaSelecionado?.event_date
                              ? new Date(
                                  itemCorrespondenciaSelecionado.event_date
                                ).toLocaleDateString("pt-BR")
                              : "-"}
                          </Txt>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.matchConnector,
                          layout.phone
                            ? {
                                width: "100%",
                                minHeight: 35,
                                flexDirection: "column",
                              }
                            : {
                                width: 52,
                                flexDirection: "row",
                              },
                        ]}
                      >
                        <View
                          style={[
                            styles.connectorLine,
                            layout.phone
                              ? { width: 1, minHeight: 2 }
                              : { height: 1 },
                          ]}
                        />
                        <View style={styles.connectorCircle}>
                          <Icon
                            name="match"
                            size={20}
                            color="#88C0FF"
                          />
                        </View>
                        <View
                          style={[
                            styles.connectorLine,
                            layout.phone
                              ? { width: 1, minHeight: 2 }
                              : { height: 1 },
                          ]}
                        />
                      </View>

                      <View style={styles.matchObject}>
                        <View
                          style={[
                            styles.matchObjectIcon,
                            { backgroundColor: "rgba(42,191,142,0.12)" },
                          ]}
                        >
                          <Icon
                            name="check"
                            size={25}
                            color="#7EE2BF"
                          />
                        </View>

                        <View style={styles.matchObjectInfo}>
                          <Txt style={styles.matchObjectLabel}>
                            POSSÍVEL CORRESPONDÊNCIA
                          </Txt>
                          <Txt style={styles.matchObjectTitle}>
                            Objeto compatível
                          </Txt>
                          <Txt style={styles.matchObjectDescription}>
                            Detalhes protegidos até a validação
                          </Txt>
                        </View>
                      </View>
                    </View>
                  )}

                {!carregandoCorrespondencias && (
                  <View style={styles.matchActions}>
                    {temCorrespondencia && (
                      <Txt style={styles.verificationText}>
                        {manual
                          ? "Esta correspondência foi enviada manualmente por um funcionário. Para comprovar que o objeto é seu, converse com a equipe pela área de Solicitações."
                          : "Esta correspondência foi encaminhada pela equipe. Acesse Solicitações para conversar com o funcionário e verificar a propriedade do objeto."}
                      </Txt>
                    )}

                    <Button
                      label={
                        temCorrespondencia
                          ? correspondenciasItemSelecionado.length === 1
                            ? "Ver correspondência"
                            : `Ver ${correspondenciasItemSelecionado.length} correspondências`
                          : "Ver meus objetos"
                      }
                      arrow
                      onPress={() => {
                        if (temCorrespondencia) {
                          navegar("Solicitacoes", {
                            itemId: itemCorrespondenciaSelecionado?.id,
                            itemTitle:
                              itemCorrespondenciaSelecionado?.title,
                          });
                        } else {
                          irParaSecao("meus-itens");
                        }
                      }}
                      style={styles.matchActionButton}
                      textStyle={{
                        fontSize: 11,
                        fontWeight: "900",
                      }}
                    />

                    <View style={styles.protectedInfo}>
                      <Icon
                        name="shield"
                        size={16}
                        color="#8CA7CB"
                      />
                      <Txt style={styles.protectedText}>
                        {temCorrespondencia
                          ? "Informações protegidas"
                          : "Monitoramento ativo"}
                      </Txt>
                    </View>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.matchScore,
                  {
                    minHeight: layout.phone
                      ? 240
                      : layout.tablet
                        ? 270
                        : 350,
                    paddingTop: layout.tablet ? 0 : 30,
                  },
                  !layout.tablet && {
                    flex: 0.65,
                    minWidth: 230,
                  },
                ]}
              >
                <View
                  style={[
                    styles.scoreRing,
                    {
                      width: layout.ringSize,
                      height: layout.ringSize,
                      borderRadius: layout.ringSize / 2,
                    },
                  ]}
                >
                  <Txt
                    style={[
                      styles.scoreNumber,
                      manual &&
                        !carregandoCorrespondencias && {
                          fontSize: 22,
                        },
                    ]}
                  >
                    {carregandoCorrespondencias ? (
                      "..."
                    ) : temCorrespondencia && manual ? (
                      "Manual"
                    ) : (
                      <>
                        {temCorrespondencia
                          ? Math.round(
                              Number(
                                primeiraCorrespondencia
                                  ?.similarity_score || 0
                              )
                            )
                          : 0}
                        <Txt style={styles.scorePercent}>%</Txt>
                      </>
                    )}
                  </Txt>

                  <Txt style={styles.scoreCaption}>
                    {carregandoCorrespondencias
                      ? "analisando"
                      : temCorrespondencia
                        ? manual
                          ? "Enviada pela equipe"
                          : "Compatibilidade"
                        : "no momento"}
                  </Txt>
                </View>

                {!carregandoCorrespondencias && (
                  <Txt style={styles.scoreDescription}>
                    {temCorrespondencia
                      ? manual
                        ? "Correspondência enviada manualmente para verificação de propriedade."
                        : "Correspondência analisada e encaminhada pela equipe."
                      : "Ainda não existe registro compatível com este objeto."}
                  </Txt>
                )}
              </View>
            </View>
          </View>

          <View
            onLayout={(event) =>
              registrarPosicao("meus-itens", event)
            }
            style={[
              styles.dashboard,
              {
                marginTop: layout.sectionGap,
                flexDirection: layout.tablet ? "column" : "row",
              },
            ]}
          >
            <View
              style={[
                styles.myItemsCard,
                { padding: layout.itemPadding },
                !layout.tablet && { flex: 1 },
              ]}
            >
              <View
                style={[
                  styles.compactHeading,
                  layout.phone && {
                    flexDirection: "column",
                    alignItems: "flex-start",
                  },
                ]}
              >
                <Heading
                  eyebrow="MEUS REGISTROS"
                  title="Seus objetos perdidos"
                  titleSize={layout.headingSize}
                  style={{ marginBottom: 0, flexShrink: 1 }}
                />

                <Button
                  label="Ver todos"
                  arrow
                  color={COLORS.blue600}
                  gradient={["#EFF5FD", "#E8F2FF"]}
                  angle={145}
                  onPress={() => navegar("MeusItens")}
                  style={[
                    styles.viewAllButton,
                    layout.tiny && { width: "100%" },
                  ]}
                  textStyle={{
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                />
              </View>

              <View style={styles.itemsList}>
                {carregandoItens && (
                  <Txt style={styles.itemsFeedback}>
                    Carregando seus itens...
                  </Txt>
                )}

                {!carregandoItens && !!erroItens && (
                  <Txt style={styles.itemsFeedback}>
                    {erroItens}
                  </Txt>
                )}

                {!carregandoItens &&
                  !erroItens &&
                  meusItens.length === 0 && (
                    <Txt style={styles.itemsFeedback}>
                      Você ainda não cadastrou nenhum objeto perdido.
                    </Txt>
                  )}

                {!carregandoItens &&
                  !erroItens &&
                  meusItens.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() =>
                        navegar("ItemDetalhe", { id: item.id })
                      }
                      style={({ pressed }) => [
                        styles.lostItemCard,
                        { gap: layout.itemGap },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Paint
                        colors={["#FFFFFF", "#FBFDFF"]}
                        angle={180}
                      />

                      <View
                        style={[
                          styles.lostItemImage,
                          {
                            width: layout.itemIconSize,
                            height: layout.itemIconSize,
                          },
                        ]}
                      >
                        <Paint
                          colors={["#EDF5FF", "#DEEBFB"]}
                          angle={145}
                        />
                        <Icon name="package" size={27} />
                      </View>

                      <View style={styles.lostItemInfo}>
                        <Txt style={styles.lostCategory}>
                          {item.category?.name ||
                            `Categoria ${item.category_id}`}
                        </Txt>

                        <Txt style={styles.lostItemTitle}>
                          {item.title}
                        </Txt>

                        <View style={styles.lostItemMeta}>
                          <View style={styles.lostItemLocation}>
                            <Icon
                              name="location"
                              size={14}
                              color={COLORS.text400}
                            />
                            <Txt style={styles.lostItemMetaText}>
                              {item.location_name}
                            </Txt>
                          </View>

                          <Txt style={styles.lostItemMetaText}>
                            {new Date(
                              item.event_date
                            ).toLocaleDateString("pt-BR")}
                          </Txt>
                        </View>
                      </View>

                      <View
                        style={
                          layout.phone
                            ? {
                                width: "100%",
                                paddingLeft: 65,
                              }
                            : undefined
                        }
                      >
                        <Txt
                          style={[
                            styles.lostStatus,
                            item.status === "EM_NEGOCIACAO"
                              ? styles.lostStatusMatch
                              : item.status === "DEVOLVIDO"
                                ? styles.lostStatusReturned
                                : styles.lostStatusSearching,
                          ]}
                        >
                          {(item.status || "")
                            .replace(/_/g, " ")
                            .toUpperCase()}
                        </Txt>
                      </View>
                    </Pressable>
                  ))}
              </View>

              <Button
                label="Registrar outro objeto perdido"
                icon="plus"
                color={COLORS.blue600}
                onPress={() => navegar("RegistrarItem")}
                style={styles.newItemButton}
                textStyle={{
                  fontSize: 10,
                  fontWeight: "800",
                }}
              />
            </View>

            <View
              style={[
                styles.sidebar,
                !layout.tablet && { width: 325 },
                layout.tablet &&
                  !layout.phone && {
                    flexDirection: "row",
                    alignItems: "flex-start",
                  },
              ]}
            >
              <View
                style={[
                  styles.summaryCard,
                  layout.tablet &&
                    !layout.phone && { flex: 1 },
                ]}
              >
                <View style={styles.summaryHeading}>
                  <View style={{ flex: 1 }}>
                    <Txt style={styles.summaryTitle}>
                      Minha atividade
                    </Txt>
                    <Txt style={styles.summarySubtitle}>
                      Visão geral dos seus registros
                    </Txt>
                  </View>
                  <Icon
                    name="history"
                    size={21}
                    color="#91A6C0"
                  />
                </View>

                {summaryItems.map(([value, label, color]) => (
                  <View key={label} style={styles.summaryStat}>
                    <View style={{ flex: 1 }}>
                      <Txt style={styles.summaryValue}>
                        {value}
                      </Txt>
                      <Txt style={styles.summaryLabel}>
                        {label}
                      </Txt>
                    </View>

                    <View
                      style={[
                        styles.summaryDotHalo,
                        { backgroundColor: `${color}20` },
                      ]}
                    >
                      <View
                        style={[
                          styles.summaryDot,
                          { backgroundColor: color },
                        ]}
                      />
                    </View>
                  </View>
                ))}

                <Button
                  label="Ver meus itens"
                  color={COLORS.blue600}
                  gradient={["#EEF5FF", "#E4EFFD"]}
                  angle={145}
                  onPress={() => navegar("MeusItens")}
                  style={styles.summaryButton}
                  textStyle={{
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                />
              </View>

              <View
                style={[
                  styles.sidebarInfo,
                  layout.tablet &&
                    !layout.phone && { flex: 1 },
                ]}
              >
                <View style={styles.infoCard}>
                  <View style={styles.infoIcon}>
                    <Icon name="shield" size={24} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Txt style={styles.privacyLabel}>
                      PRIVACIDADE
                    </Txt>
                    <Txt style={styles.infoTitle}>
                      Seus dados ajudam na validação.
                    </Txt>
                    <Txt style={styles.infoDescription}>
                      Características específicas do objeto são usadas
                      para confirmar a propriedade e não ficam disponíveis
                      para outros usuários.
                    </Txt>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIcon}>
                    <Icon name="message" size={22} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Txt style={styles.infoTitle}>
                      Precisa de ajuda?
                    </Txt>
                    <Txt style={styles.helpDescription}>
                      Consulte orientações sobre correspondência,
                      validação e retirada.
                    </Txt>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => navegar("Ajuda")}
                    >
                      <Txt style={styles.helpLink}>
                        Central de ajuda
                      </Txt>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.processSection,
              {
                marginTop: layout.sectionGap,
                paddingVertical: layout.processPaddingV,
                paddingHorizontal: layout.processPaddingH,
              },
            ]}
          >
            <Heading
              eyebrow="COMO FUNCIONA"
              title="Do registro até a devolução"
              description="O OndeTá mantém o processo seguro sem expor os objetos encontrados."
              titleSize={layout.headingSize}
              style={{ marginBottom: 30 }}
            />

            <View
              style={[
                styles.processGrid,
                {
                  gap: layout.processColumns === 4 ? 0 : 15,
                },
              ]}
            >
              {processItems.map(
                ([icon, title, description], index) => (
                  <React.Fragment key={title}>
                    <View
                      style={[
                        styles.processCard,
                        {
                          width: processCardWidth,
                          minHeight: layout.phone ? 170 : 195,
                        },
                      ]}
                    >
                      <Paint
                        colors={["#FFFFFF", "#FBFDFF"]}
                        angle={180}
                      />

                      <Txt style={styles.processNumber}>
                        {`0${index + 1}`}
                      </Txt>

                      <View style={styles.processIcon}>
                        <Paint
                          colors={["#EDF5FF", "#E1EFFF"]}
                          angle={145}
                        />
                        <Icon name={icon} />
                      </View>

                      <Txt style={styles.processTitle}>
                        {title}
                      </Txt>
                      <Txt style={styles.processDescription}>
                        {description}
                      </Txt>
                    </View>

                    {layout.processColumns === 4 && index < 3 && (
                      <View style={styles.processLineContainer}>
                        <View style={styles.processLine} />
                      </View>
                    )}
                  </React.Fragment>
                )
              )}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            {
              width: layout.footerWidth,
              flexDirection: layout.phone ? "column" : "row",
              alignItems: layout.phone ? "flex-start" : "center",
            },
          ]}
        >
          <Brand small footer layout={layout} />

          <View
            style={[
              styles.footerLinks,
              layout.phone && {
                width: "100%",
                justifyContent: "space-between",
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => navegar("Ajuda")}
              style={styles.footerButton}
            >
              <Txt style={styles.footerLinkText}>Ajuda</Txt>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={sair}
              style={styles.footerButton}
            >
              <Txt style={styles.footerLinkText}>Sair</Txt>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  text: {
    color: COLORS.text900,
  },

  bold: {
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.85,
  },

  safe: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },

    main: {
    position: "relative",
    zIndex: 1,
    alignSelf: "center",
    paddingBottom: 75,
  },

  navbarWrapper: {
    position: "relative",
    zIndex: 1000,
  },

  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.72)",
    boxShadow: "0px 8px 30px rgba(3,17,38,0.05)",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  brandLogo: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 10px 25px rgba(20,104,216,0.28)",
  },

  brandLogoText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  brandName: {
    color: COLORS.navy900,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  brandSubtitle: {
    marginTop: 5,
    color: COLORS.text500,
    fontSize: 10,
    fontWeight: "600",
  },

  desktopNavigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  navItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  navItemActive: {
    backgroundColor: "#EEF5FF",
  },

  navItemText: {
    color: COLORS.text500,
    fontWeight: "700",
  },

  navbarActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  navbarIcon: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F2F6FB",
  },

  notificationDot: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 10,
    borderRadius: 13,
  },

  profileAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    color: COLORS.blue600,
    fontWeight: "900",
  },

  profileName: {
    maxWidth: 145,
    color: COLORS.navy900,
    fontSize: 12,
    fontWeight: "700",
  },

  profileCaption: {
    marginTop: 3,
    color: COLORS.text400,
    fontSize: 10,
  },

  menuButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F2F6FB",
  },

  mobileMenu: {
    position: "absolute",
    left: "3%",
    right: "3%",
    zIndex: 1001,
    gap: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    boxShadow: "0px 18px 45px rgba(15,23,42,0.13)",
  },

  mobileMenuItem: {
    width: "100%",
    padding: 13,
    borderRadius: 10,
  },

  button: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },

  buttonText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    backgroundColor: "#07285F",
    boxShadow: "0px 35px 85px rgba(6,26,64,0.2)",
  },

  heroDecorationOne: {
    position: "absolute",
    width: 470,
    height: 470,
    top: -275,
    right: -85,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    borderRadius: 235,
    boxShadow:
      "0px 0px 0px 38px rgba(255,255,255,0.018), 0px 0px 0px 78px rgba(255,255,255,0.01)",
  },

  heroDecorationTwo: {
    position: "absolute",
    width: 350,
    height: 350,
    bottom: -245,
    left: "34%",
    borderRadius: 175,
    backgroundColor: "rgba(54,146,255,0.16)",
  },

  heroContent: {
    width: "100%",
    maxWidth: 760,
  },

  heroEyebrow: {
    alignSelf: "flex-start",
    marginBottom: 21,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "rgba(156,204,255,0.22)",
    borderRadius: 9,
    backgroundColor: "rgba(43,119,214,0.15)",
    color: "#B1D6FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  greeting: {
    marginBottom: 8,
    color: "#9EBCE3",
    fontSize: 17,
    fontWeight: "600",
  },

  greetingName: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  heroTitle: {
    maxWidth: 720,
    color: "#FFFFFF",
    fontWeight: "900",
  },

  heroDescription: {
    maxWidth: 660,
    marginTop: 23,
    color: "#B8CDE7",
  },

  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 32,
  },

  heroPrimaryButton: {
    boxShadow: "0px 14px 32px rgba(0,0,0,0.18)",
  },

  heroSecondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  heroSecurity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 21,
  },

  heroSecurityText: {
    flexShrink: 1,
    color: "#91ADD0",
    fontSize: 10,
    lineHeight: 15,
  },

  statusCard: {
    position: "relative",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.045)",
    boxShadow: "0px 20px 55px rgba(0,0,0,0.08)",
  },

  statusIllustration: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  orbit: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 200,
  },

  statusCircle: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.27)",
    borderRadius: 100,
    boxShadow:
      "0px 0px 0px 25px rgba(255,255,255,0.035), 0px 25px 60px rgba(0,0,0,0.12)",
  },

  floatingBadge: {
    position: "absolute",
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.17)",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.13)",
    boxShadow: "0px 10px 25px rgba(0,0,0,0.08)",
  },

  floatingBadgeText: {
    color: "#EAF4FF",
    fontWeight: "700",
  },

  statusFooter: {
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.11)",
  },

  statusFooterLabel: {
    color: "#8DB2DF",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  statusFooterTitle: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  heading: {
    marginBottom: 22,
  },

  eyebrow: {
    marginBottom: 7,
    color: COLORS.blue600,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  sectionTitle: {
    color: COLORS.navy900,
    fontWeight: "700",
    letterSpacing: -0.9,
  },

  sectionDescription: {
    maxWidth: 620,
    marginTop: 8,
    color: COLORS.text500,
    fontSize: 12,
    lineHeight: 19.2,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  quickCard: {
    position: "relative",
    overflow: "hidden",
    alignItems: "flex-start",
    padding: 23,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    boxShadow: "0px 8px 25px rgba(15,23,42,0.06)",
  },

  quickCardPrimary: {
    borderColor: "transparent",
    backgroundColor: COLORS.navy950,
    boxShadow: "0px 20px 45px rgba(6,34,82,0.2)",
  },

  quickIcon: {
    position: "relative",
    overflow: "hidden",
    width: 46,
    height: 46,
    marginBottom: 23,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF5FF",
  },

  quickIconPrimary: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  quickArrow: {
    position: "absolute",
    top: 22,
    right: 21,
  },

  quickTitle: {
    color: COLORS.navy900,
    fontSize: 14,
    fontWeight: "700",
  },

  quickDescription: {
    marginTop: 8,
    color: COLORS.text500,
    fontSize: 11,
    lineHeight: 17.6,
  },

  matchCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 29,
    backgroundColor: "#041534",
    boxShadow: "0px 24px 60px rgba(6,26,64,0.16)",
  },

  matchDecoration: {
    position: "absolute",
    width: 360,
    height: 360,
    top: -175,
    right: -130,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 180,
  },

  matchContent: {
    position: "relative",
    minWidth: 0,
  },

  matchSelector: {
    marginBottom: 26,
  },

  matchSelectorLabel: {
    marginBottom: 11,
    color: "#7EB8FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  matchTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 2,
    paddingBottom: 8,
  },

  matchTab: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  matchTabActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
    boxShadow: "0px 7px 20px rgba(0,0,0,0.14)",
  },

  matchTabText: {
    color: "#DCECFF",
    fontSize: 11,
    fontWeight: "800",
  },

  matchTabTextActive: {
    color: "#1262BD",
  },

  matchLabel: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: "rgba(79,161,255,0.12)",
    color: "#80BAFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  matchTitle: {
    maxWidth: 560,
    marginTop: 13,
    marginBottom: 9,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: -0.9,
  },

  matchDescription: {
    maxWidth: 650,
    color: "#AEC2DF",
    fontSize: 12,
    lineHeight: 20.4,
  },

  matchComparison: {
    maxWidth: 730,
    alignItems: "center",
    gap: 10,
    marginTop: 26,
  },

  matchObject: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    width: "100%",
    flex: 1,
    minWidth: 0,
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  matchObjectIcon: {
    width: 52,
    height: 52,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  matchObjectInfo: {
    flex: 1,
    minWidth: 0,
  },

  matchObjectLabel: {
    color: "#76B8FF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  matchObjectTitle: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  matchObjectDescription: {
    marginTop: 4,
    color: "#96ABC8",
    fontSize: 9,
  },

  matchConnector: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  connectorLine: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  connectorCircle: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  matchActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 15,
    marginTop: 22,
  },

  verificationText: {
    width: "100%",
    marginBottom: 12,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 23,
  },

  matchActionButton: {
    minHeight: 0,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 8,
    boxShadow: "0px 8px 22px rgba(0,0,0,0.12)",
  },

  protectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  protectedText: {
    color: "#8CA7CB",
    fontSize: 9,
  },

  matchScore: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  scoreRing: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.08)",
    borderTopColor: COLORS.blue400,
    borderRightColor: COLORS.blue400,
    borderBottomColor: COLORS.blue400,
    backgroundColor: "rgba(255,255,255,0.04)",
    boxShadow: "0px 0px 60px rgba(56,147,255,0.22)",
  },

  scoreNumber: {
    color: "#FFFFFF",
    fontSize: 45,
    fontWeight: "700",
  },

  scorePercent: {
    color: "#FFFFFF",
    fontSize: 18,
  },

  scoreCaption: {
    marginTop: 8,
    color: "#94AFD4",
    fontSize: 10,
  },

  scoreDescription: {
    maxWidth: 220,
    marginTop: 17,
    color: "#849DBF",
    fontSize: 9,
    lineHeight: 14.4,
    textAlign: "center",
  },

  dashboard: {
    alignItems: "stretch",
    gap: 23,
  },

  myItemsCard: {
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.94)",
    boxShadow: "0px 8px 25px rgba(15,23,42,0.06)",
  },

  compactHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  viewAllButton: {
    minHeight: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    gap: 6,
  },

  itemsList: {
    gap: 11,
    marginTop: 24,
  },

  itemsFeedback: {
    color: COLORS.text900,
    fontSize: 14,
    lineHeight: 22,
  },

  lostItemCard: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#EDF1F6",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  lostItemImage: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  lostItemInfo: {
    flex: 1,
    minWidth: 0,
  },

  lostCategory: {
    marginBottom: 5,
    color: COLORS.blue600,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  lostItemTitle: {
    color: COLORS.navy900,
    fontSize: 13,
    fontWeight: "700",
  },

  lostItemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 7,
  },

  lostItemLocation: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 5,
  },

  lostItemMetaText: {
    flexShrink: 1,
    color: COLORS.text400,
    fontSize: 9,
  },

  lostStatus: {
    alignSelf: "flex-start",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 30,
    fontSize: 8,
    fontWeight: "900",
  },

  lostStatusSearching: {
    backgroundColor: "#EAF2FF",
    color: COLORS.blue600,
  },

  lostStatusMatch: {
    backgroundColor: "#FFF4D8",
    color: "#AE7300",
  },

  lostStatusReturned: {
    color: COLORS.text900,
    backgroundColor: "transparent",
  },

  newItemButton: {
    width: "100%",
    minHeight: 47,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C7D9EE",
    borderRadius: 13,
    backgroundColor: "#F8FBFF",
  },

  sidebar: {
    gap: 18,
  },

  sidebarInfo: {
    gap: 18,
  },

  summaryCard: {
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.94)",
    boxShadow: "0px 8px 25px rgba(15,23,42,0.06)",
  },

  summaryHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 16,
    gap: 10,
  },

  summaryTitle: {
    color: COLORS.navy900,
    fontSize: 13,
    fontWeight: "900",
  },

  summarySubtitle: {
    marginTop: 4,
    color: COLORS.text400,
    fontSize: 8,
  },

  summaryStat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF1F5",
  },

  summaryValue: {
    color: COLORS.navy900,
    fontSize: 22,
    fontWeight: "700",
  },

  summaryLabel: {
    marginTop: 6,
    color: COLORS.text400,
    fontSize: 9,
  },

  summaryDotHalo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  summaryButton: {
    width: "100%",
    minHeight: 42,
    marginTop: 7,
    borderRadius: 10,
  },

  infoCard: {
    flexDirection: "row",
    gap: 13,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.94)",
    boxShadow: "0px 8px 25px rgba(15,23,42,0.06)",
  },

  infoIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#EAF3FF",
  },

  privacyLabel: {
    marginBottom: 5,
    color: COLORS.blue600,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  infoTitle: {
    color: COLORS.navy900,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15.95,
  },

  infoDescription: {
    marginTop: 7,
    color: COLORS.text500,
    fontSize: 9,
    lineHeight: 14.4,
  },

  helpDescription: {
    marginTop: 6,
    marginBottom: 10,
    color: COLORS.text500,
    fontSize: 9,
    lineHeight: 13.95,
  },

  helpLink: {
    color: COLORS.blue600,
    fontSize: 9,
    fontWeight: "900",
  },

  processSection: {
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.72)",
    boxShadow: "0px 8px 25px rgba(15,23,42,0.06)",
  },

  processGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },

  processCard: {
    position: "relative",
    overflow: "hidden",
    padding: 20,
    borderWidth: 1,
    borderColor: "#EDF1F6",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  processNumber: {
    position: "absolute",
    top: 18,
    right: 18,
    color: "#D8E4F2",
    fontSize: 12,
    fontWeight: "900",
  },

  processIcon: {
    position: "relative",
    overflow: "hidden",
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderRadius: 12,
  },

  processTitle: {
    color: COLORS.navy900,
    fontSize: 12,
    fontWeight: "700",
  },

  processDescription: {
    marginTop: 8,
    color: COLORS.text500,
    fontSize: 9,
    lineHeight: 14.4,
  },

  processLineContainer: {
    width: 45,
    paddingHorizontal: 8,
    justifyContent: "center",
  },

  processLine: {
    height: 1,
    backgroundColor: "#C9DCF1",
  },

  footer: {
    justifyContent: "space-between",
    gap: 25,
    paddingTop: 25,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,23,42,0.07)",
  },

  footerDescription: {
    marginTop: 5,
    color: COLORS.text400,
    fontSize: 9,
  },

  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  footerLinkText: {
    color: COLORS.text500,
    fontSize: 10,
    fontWeight: "700",
  },
});