import React, { useEffect, useRef, useState } from "react";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import {
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { useAuth } from "../../contexts/AuthContext";

function AppText({ style, ...props }) {
  return <Text {...props} style={[styles.typography, style]} />;
}

function FundoApresentacao() {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient
          id="loginPresentationGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop offset="0%" stopColor="#08162E" />
          <Stop offset="48%" stopColor="#102A56" />
          <Stop offset="100%" stopColor="#123C7A" />
        </LinearGradient>

        <RadialGradient
          id="loginPresentationGlowOne"
          cx="20%"
          cy="20%"
          rx="65%"
          ry="65%"
        >
          <Stop
            offset="0%"
            stopColor="#3B82F6"
            stopOpacity={0.22}
          />
          <Stop
            offset="100%"
            stopColor="#3B82F6"
            stopOpacity={0}
          />
        </RadialGradient>

        <RadialGradient
          id="loginPresentationGlowTwo"
          cx="90%"
          cy="80%"
          rx="60%"
          ry="60%"
        >
          <Stop
            offset="0%"
            stopColor="#60A5FA"
            stopOpacity={0.14}
          />
          <Stop
            offset="100%"
            stopColor="#60A5FA"
            stopOpacity={0}
          />
        </RadialGradient>
      </Defs>

      <Rect
        width="100%"
        height="100%"
        fill="url(#loginPresentationGradient)"
      />
      <Rect
        width="100%"
        height="100%"
        fill="url(#loginPresentationGlowOne)"
      />
      <Rect
        width="100%"
        height="100%"
        fill="url(#loginPresentationGlowTwo)"
      />
    </Svg>
  );
}

function GradienteBotao() {
  return (
    <ExpoLinearGradient
      colors={["#184F9F", "#2669C9"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}
    />
  );
}
export default function LoginScreen({ navigation }) {
  const { login, error: sessionError } = useAuth();

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isMounted = useRef(true);
  const submitting = useRef(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [senhaFocused, setSenhaFocused] = useState(false);

  const mostrarApresentacao = width > 800;
  const intermediateScreen = width <= 1000;
  const smallScreen = width <= 480;

  const availableHeight = Math.max(
    height - insets.top - insets.bottom,
    0
  );

  const mensagemErro = erro || sessionError;

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  async function handleSubmit() {
    if (submitting.current) return;

    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Informe seu e-mail e sua senha.");
      return;
    }

    submitting.current = true;
    setCarregando(true);

    try {
      await login(email.trim(), senha.trim());
    } catch (error) {
      if (isMounted.current) {
        setErro(
          error?.response?.data?.detail ||
            error.message ||
            "Não foi possível realizar o acesso. Verifique suas credenciais."
        );
      }
    } finally {
      submitting.current = false;

      if (isMounted.current) {
        setCarregando(false);
      }
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.page,
            { minHeight: availableHeight },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {mostrarApresentacao && (
            <View
              style={[
                styles.presentation,
                {
                  width: intermediateScreen ? "48%" : "54%",
                  minHeight: availableHeight,
                  paddingHorizontal: intermediateScreen ? 40 : 65,
                  paddingVertical: intermediateScreen ? 40 : 42,
                },
              ]}
            >
              <FundoApresentacao />

              <View
                pointerEvents="none"
                style={styles.presentationCircleTop}
              />
              <View
                pointerEvents="none"
                style={styles.presentationCircleBottom}
              />

              <View style={styles.institutionHeader}>
                <View style={styles.institutionLogo}>
                  <AppText style={styles.institutionLogoText}>
                    AP
                  </AppText>
                </View>

                <View style={styles.institutionText}>
                  <AppText style={styles.presentationBrand}>
                    Onde
                    <AppText style={styles.presentationBrandAccent}>
                      Tá
                    </AppText>
                  </AppText>

                  <AppText style={styles.presentationBrandSubtitle}>
                    Achados & Perdidos
                  </AppText>

                  <AppText style={styles.institutionDescription}>
                    Sistema de Achados e Perdidos
                  </AppText>
                </View>
              </View>

              <View style={styles.presentationContent}>
                <AppText style={styles.portalBadge}>
                  PORTAL OndeTá
                </AppText>

                <AppText
                  accessibilityRole="header"
                  style={[
                    styles.presentationTitle,
                    {
                      fontSize: intermediateScreen
                        ? 42
                        : Math.min(59, Math.max(38, width * 0.04)),
                    },
                  ]}
                >
                  Um jeito mais seguro de recuperar o que é seu.
                </AppText>

                <AppText style={styles.presentationDescription}>
                  Consulte objetos encontrados, registre itens perdidos
                  e acompanhe todo o processo de devolução em um único
                  lugar.
                </AppText>

                <View style={styles.presentationFeatures}>
                  {[
                    [
                      "01",
                      "Registre um item perdido",
                      "Informe características, local e data aproximada da perda.",
                    ],
                    [
                      "02",
                      "Encontre possíveis correspondências",
                      "O sistema compara objetos perdidos com os itens encontrados cadastrados.",
                    ],
                    [
                      "03",
                      "Retirada com segurança",
                      "A propriedade do objeto é validada antes da confirmação da devolução.",
                    ],
                  ].map(([number, title, description]) => (
                    <View
                      key={number}
                      style={styles.presentationFeature}
                    >
                      <View style={styles.featureIcon}>
                        <AppText style={styles.featureNumber}>
                          {number}
                        </AppText>
                      </View>

                      <View style={styles.featureContent}>
                        <AppText style={styles.featureTitle}>
                          {title}
                        </AppText>

                        <AppText style={styles.featureDescription}>
                          {description}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <AppText style={styles.presentationFooter}>
                Plataforma de gerenciamento de objetos perdidos e
                encontrados
              </AppText>
            </View>
          )}

          <View
            style={[
              styles.loginArea,
              {
                minHeight: availableHeight,
                width: mostrarApresentacao
                  ? intermediateScreen
                    ? "52%"
                    : "46%"
                  : "100%",
              },
              !mostrarApresentacao && styles.loginAreaMobile,
              smallScreen && styles.loginAreaSmall,
            ]}
          >
            <View style={styles.loginContainer}>
              {!mostrarApresentacao && (
                <View style={styles.mobileBrand}>
                  <View
                    style={[
                      styles.institutionLogo,
                      styles.mobileInstitutionLogo,
                    ]}
                  >
                    <AppText style={styles.mobileLogoText}>
                      AP
                    </AppText>
                  </View>

                  <View style={styles.mobileBrandContent}>
                    <AppText style={styles.mobileBrandTitle}>
                      Achados e Perdidos
                      <AppText style={styles.mobileBrandAccent}>
                        Tá
                      </AppText>
                    </AppText>

                    <AppText style={styles.mobileBrandSubtitle}>
                      Portal Institucional
                    </AppText>
                  </View>
                </View>
              )}

              <View style={styles.loginType}>
                <AppText style={styles.accessIndicator}>
                  ACESSO DO USUÁRIO
                </AppText>
              </View>

              <View style={styles.loginHeader}>
                <AppText
                  accessibilityRole="header"
                  style={[
                    styles.loginTitle,
                    smallScreen && styles.loginTitleSmall,
                  ]}
                >
                  Olá, seja bem-vindo
                </AppText>

                <AppText style={styles.loginDescription}>
                  Acesse sua conta para consultar e acompanhar seus
                  objetos.
                </AppText>
              </View>

              {!!mensagemErro && (
                <View
                  accessibilityRole="alert"
                  style={styles.errorMessage}
                >
                  <View style={styles.errorIcon}>
                    <AppText style={styles.errorIconText}>!</AppText>
                  </View>

                  <AppText style={styles.errorText}>
                    {mensagemErro}
                  </AppText>
                </View>
              )}

              <View style={styles.formGroup}>
                <AppText style={styles.label}>E-mail</AppText>

                <View style={styles.inputContainer}>
                  <TextInput
                    accessibilityLabel="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Digite seu e-mail cadastrado"
                    placeholderTextColor="#A1AAB8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!carregando}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      emailFocused && styles.inputFocused,
                    ]}
                  />

                  <AppText
                    pointerEvents="none"
                    style={styles.inputIcon}
                  >
                    @
                  </AppText>
                </View>
              </View>

              <View style={styles.formGroup}>
                <View
                  style={[
                    styles.labelRow,
                    smallScreen && styles.labelRowSmall,
                  ]}
                >
                  <AppText style={styles.label}>Senha</AppText>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      navigation.navigate("RecuperarSenha")
                    }
                    disabled={carregando}
                    style={styles.forgotButton}
                  >
                    <AppText style={styles.forgotText}>
                      Esqueci minha senha
                    </AppText>
                  </Pressable>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    accessibilityLabel="Senha"
                    value={senha}
                    onChangeText={setSenha}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#A1AAB8"
                    secureTextEntry={!mostrarSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    editable={!carregando}
                    onFocus={() => setSenhaFocused(true)}
                    onBlur={() => setSenhaFocused(false)}
                    onSubmitEditing={handleSubmit}
                    returnKeyType="go"
                    style={[
                      styles.input,
                      senhaFocused && styles.inputFocused,
                    ]}
                  />

                  <AppText
                    pointerEvents="none"
                    style={styles.inputIcon}
                  >
                    ●
                  </AppText>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                    }
                    onPress={() => setMostrarSenha((value) => !value)}
                    disabled={carregando}
                    style={styles.passwordToggle}
                  >
                    <AppText style={styles.passwordToggleText}>
                      {mostrarSenha ? "Ocultar" : "Mostrar"}
                    </AppText>
                  </Pressable>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Entrar"
                accessibilityState={{ disabled: carregando }}
                onPress={handleSubmit}
                disabled={carregando}
                style={({ pressed }) => [
                  styles.loginButton,
                  carregando && styles.loginButtonDisabled,
                  pressed &&
                    !carregando &&
                    styles.loginButtonPressed,
                ]}
              >
                <GradienteBotao />

                <View
                  pointerEvents="none"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText style={styles.loginButtonText}>
                    {carregando ? "Validando acesso..." : "Entrar"}
                  </AppText>
                </View>
              </Pressable>

              <View style={styles.registerArea}>
                <AppText style={styles.registerText}>
                  Primeiro acesso?
                </AppText>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate("Cadastro")}
                  disabled={carregando}
                >
                  <AppText style={styles.registerLink}>
                    Criar minha conta
                  </AppText>
                </Pressable>
              </View>

              <View style={styles.securityMessage}>
                <AppText style={styles.securityDot}>●</AppText>

                <AppText style={styles.securityText}>
                  Ambiente protegido. Não compartilhe suas
                  credenciais de acesso.
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  typography: {
    fontFamily: Platform.OS === "ios" ? "Arial" : "sans-serif",
  },

  flex: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },

  scroll: {
    flex: 1,
  },

  page: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#F6F8FC",
  },

  presentation: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#102A56",
  },

  presentationCircleTop: {
    position: "absolute",
    top: -180,
    right: -160,
    width: 480,
    height: 480,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 240,
  },

  presentationCircleBottom: {
    position: "absolute",
    bottom: -260,
    left: -180,
    width: 520,
    height: 520,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 260,
  },

  institutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  institutionLogo: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.17)",
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.11)",
  },

  institutionLogoText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -1,
  },

  institutionText: {
    flex: 1,
  },

  presentationBrand: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  presentationBrandAccent: {
    color: "#5DA9FF",
  },

  presentationBrandSubtitle: {
    marginTop: 3,
    color: "#A9C8F5",
    fontSize: 13,
    fontWeight: "500",
  },

  institutionDescription: {
    marginTop: 4,
    color: "rgba(255, 255, 255, 0.58)",
    fontSize: 12,
  },

  presentationContent: {
    width: "100%",
    maxWidth: 620,
    marginVertical: "auto",
    paddingVertical: 40,
  },

  portalBadge: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(147, 197, 253, 0.18)",
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.13)",
    color: "#BFDBFE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  presentationTitle: {
    maxWidth: 600,
    marginTop: 25,
    marginBottom: 20,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: -2,
  },

  presentationDescription: {
    maxWidth: 570,
    color: "rgba(255, 255, 255, 0.68)",
    fontSize: 15,
    lineHeight: 25.5,
  },

  presentationFeatures: {
    gap: 20,
    marginTop: 38,
  },

  presentationFeature: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
  },

  featureIcon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
  },

  featureNumber: {
    color: "#93C5FD",
    fontSize: 11,
    fontWeight: "700",
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    marginBottom: 4,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  featureDescription: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 12,
    lineHeight: 18,
  },

  presentationFooter: {
    color: "rgba(255, 255, 255, 0.38)",
    fontSize: 11,
  },

  loginArea: {
    justifyContent: "center",
    alignItems: "center",
    padding: 45,
  },

  loginAreaMobile: {
    paddingVertical: 35,
    paddingHorizontal: 25,
  },

  loginAreaSmall: {
    paddingVertical: 28,
    paddingHorizontal: 20,
  },

  loginContainer: {
    width: "100%",
    maxWidth: 430,
  },

  mobileBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 42,
  },

  mobileInstitutionLogo: {
    backgroundColor: "#174D98",
  },

  mobileLogoText: {
    marginTop: 3,
    color: "#929CAB",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: -1,
  },

  mobileBrandContent: {
    flex: 1,
  },

  mobileBrandTitle: {
    color: "#071D49",
    fontSize: 21,
    fontWeight: "800",
  },

  mobileBrandAccent: {
    color: "#1557B0",
  },

  mobileBrandSubtitle: {
    marginTop: 3,
    color: "#929CAB",
    fontSize: 10,
  },

  loginType: {
    marginBottom: 16,
  },

  accessIndicator: {
    alignSelf: "flex-start",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: "#EAF2FF",
    color: "#1858BB",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  loginHeader: {
    marginBottom: 30,
  },

  loginTitle: {
    color: "#111827",
    fontSize: 31,
    fontWeight: "700",
    letterSpacing: -1,
  },

  loginTitleSmall: {
    fontSize: 27,
  },

  loginDescription: {
    marginTop: 10,
    color: "#687386",
    fontSize: 14,
    lineHeight: 21.7,
  },

  formGroup: {
    marginBottom: 21,
  },

  label: {
    marginBottom: 8,
    color: "#344054",
    fontSize: 13,
    fontWeight: "600",
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  labelRowSmall: {
    alignItems: "flex-end",
  },

  inputContainer: {
    position: "relative",
    justifyContent: "center",
  },

  input: {
    width: "100%",
    height: 52,
    paddingVertical: 0,
    paddingLeft: 44,
    paddingRight: 82,
    borderWidth: 1,
    borderColor: "#D7DEEA",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    color: "#172033",
    fontFamily: Platform.OS === "ios" ? "Arial" : "sans-serif",
    fontSize: 14,
  },

  inputFocused: {
    borderColor: "#3274D9",
    boxShadow: "0px 0px 0px 3px rgba(50, 116, 217, 0.09)",
  },

  inputIcon: {
    position: "absolute",
    left: 15,
    width: 18,
    zIndex: 1,
    color: "#8D98A9",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  passwordToggle: {
    position: "absolute",
    right: 14,
    padding: 5,
  },

  passwordToggleText: {
    color: "#326BC4",
    fontSize: 11,
    fontWeight: "600",
  },

  forgotButton: {
    marginBottom: 8,
  },

  forgotText: {
    color: "#326BC4",
    fontSize: 11,
    fontWeight: "600",
  },

  loginButton: {
    position: "relative",
    width: "100%",
    height: 52,
    marginTop: 3,
    overflow: "hidden",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#184F9F",
    boxShadow: "0px 7px 18px rgba(25, 84, 165, 0.18)",
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonPressed: {
    opacity: 0.9,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  errorMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 20,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 9,
    backgroundColor: "#FFF6F6",
  },

  errorIcon: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },

  errorIconText: {
    color: "#B42318",
    fontSize: 11,
    fontWeight: "800",
  },

  errorText: {
    flex: 1,
    color: "#B42318",
    fontSize: 12,
    lineHeight: 18,
  },

  registerArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 22,
  },

  registerText: {
    color: "#7C8798",
    fontSize: 12,
  },

  registerLink: {
    color: "#2864BF",
    fontSize: 12,
    fontWeight: "700",
  },

  securityMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 22,
  },

  securityDot: {
    color: "#4A8BDC",
    fontSize: 7,
  },

  securityText: {
    flexShrink: 1,
    color: "#9AA3AF",
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
});