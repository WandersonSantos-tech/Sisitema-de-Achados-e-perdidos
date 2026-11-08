import React, { useEffect, useRef, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import authService from "../../services/authService";

function Campo({ label, style, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#9CA8BA"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          style,
          focused && styles.inputFocused,
        ]}
      />
    </View>
  );
}

function Gradiente({ horizontal = false }) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient
          id="cadastroButtonGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2={horizontal ? "0%" : "100%"}
        >
          <Stop offset="0%" stopColor="#071D49" />
          <Stop offset="100%" stopColor="#1557B0" />
        </LinearGradient>
      </Defs>

      <Rect
        width="100%"
        height="100%"
        fill="url(#cadastroButtonGradient)"
      />
    </Svg>
  );
}

export default function CadastroScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const smallScreen = width <= 600;
  const inputFontSize = width <= 640 ? 16 : 14;

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [backgroundSize, setBackgroundSize] = useState({
    width,
    height: 900,
  });

  const redirectTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  function formatarCpf(value) {
    const numeros = value.replace(/\D/g, "").slice(0, 11);

    const formatado = numeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");

    setCpf(formatado);
  }

  function voltarLogin() {
    navigation.navigate("Login");
  }

  async function handleSubmit() {
    if (carregando) return;

    setErro("");
    setSucesso("");

    if (
      !nome.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !cpf.trim() ||
      !confirmarSenha.trim()
    ) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas informadas não são iguais.");
      return;
    }

    try {
      setCarregando(true);

      await authService.register({
        name: nome.trim(),
        cpf: cpf.replace(/\D/g, ""),
        email: email.trim(),
        phone: telefone.trim() || null,
        password: senha,
      });

      setSucesso("Conta criada com sucesso.");

      redirectTimer.current = setTimeout(() => {
        navigation.navigate("Login");
      }, 1200);
    } catch (error) {
      setErro(
        error.message || "Não foi possível criar sua conta."
      );
    } finally {
      setCarregando(false);
    }
  }

  const radialRadius =
    Math.hypot(
      backgroundSize.width * 0.85,
      backgroundSize.height * 0.8
    ) * 0.28;

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
            smallScreen && styles.pageSmall,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={(contentWidth, contentHeight) => {
            setBackgroundSize((previous) => {
              if (
                previous.width === contentWidth &&
                previous.height === contentHeight
              ) {
                return previous;
              }

              return {
                width: contentWidth,
                height: contentHeight,
              };
            });
          }}
        >
          <Svg
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          >
            <Defs>
              <LinearGradient
                id="cadastroBackground"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor="#EEF4FC" />
                <Stop offset="50%" stopColor="#F8FAFF" />
                <Stop offset="100%" stopColor="#EDF3FB" />
              </LinearGradient>

              <RadialGradient
                id="cadastroGlowOne"
                gradientUnits="userSpaceOnUse"
                cx={backgroundSize.width * 0.15}
                cy={backgroundSize.height * 0.2}
                rx={radialRadius}
                ry={radialRadius}
              >
                <Stop
                  offset="0%"
                  stopColor="#1557B0"
                  stopOpacity={0.12}
                />
                <Stop
                  offset="100%"
                  stopColor="#1557B0"
                  stopOpacity={0}
                />
              </RadialGradient>

              <RadialGradient
                id="cadastroGlowTwo"
                gradientUnits="userSpaceOnUse"
                cx={backgroundSize.width * 0.9}
                cy={backgroundSize.height * 0.8}
                rx={radialRadius}
                ry={radialRadius}
              >
                <Stop
                  offset="0%"
                  stopColor="#071D49"
                  stopOpacity={0.1}
                />
                <Stop
                  offset="100%"
                  stopColor="#071D49"
                  stopOpacity={0}
                />
              </RadialGradient>
            </Defs>

            <Rect
              width="100%"
              height="100%"
              fill="url(#cadastroBackground)"
            />
            <Rect
              width="100%"
              height="100%"
              fill="url(#cadastroGlowOne)"
            />
            <Rect
              width="100%"
              height="100%"
              fill="url(#cadastroGlowTwo)"
            />
          </Svg>

          <View
            style={[
              styles.card,
              smallScreen && styles.cardSmall,
            ]}
          >
            <View style={styles.cardTopLine}>
              <Gradiente horizontal />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={voltarLogin}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
            >
              <Text style={styles.backButtonText}>
                ← Voltar
              </Text>
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.badge}>PRIMEIRO ACESSO</Text>

              <Text
                accessibilityRole="header"
                style={[
                  styles.title,
                  smallScreen && styles.titleSmall,
                ]}
              >
                Criar minha conta
              </Text>

              <Text style={styles.description}>
                Cadastre seus dados para utilizar o Portal de
                Achados e Perdidos.
              </Text>
            </View>

            {!!erro && (
              <View
                accessibilityRole="alert"
                style={[styles.message, styles.errorMessage]}
              >
                <Text style={[styles.messageText, styles.errorText]}>
                  {erro}
                </Text>
              </View>
            )}

            {!!sucesso && (
              <View
                accessibilityLiveRegion="polite"
                style={[styles.message, styles.successMessage]}
              >
                <Text
                  style={[styles.messageText, styles.successText]}
                >
                  {sucesso}
                </Text>
              </View>
            )}

            <View style={styles.form}>
              <Campo
                label="Nome completo"
                placeholder="Digite seu nome"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                style={{ fontSize: inputFontSize }}
              />

              <Campo
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChangeText={formatarCpf}
                keyboardType="number-pad"
                maxLength={14}
                style={{ fontSize: inputFontSize }}
              />

              <Campo
                label="E-mail"
                placeholder="Digite seu e-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ fontSize: inputFontSize }}
              />

              <Campo
                label="Telefone"
                placeholder="(34) 99999-9999"
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
                style={{ fontSize: inputFontSize }}
              />

              <Campo
                label="Senha"
                placeholder="Mínimo de 8 caracteres"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={{ fontSize: inputFontSize }}
              />

              <Campo
                label="Confirmar senha"
                placeholder="Digite novamente sua senha"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={{ fontSize: inputFontSize }}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: carregando }}
                onPress={handleSubmit}
                disabled={carregando}
                style={({ pressed }) => [
                  styles.submitButton,
                  carregando && styles.submitButtonDisabled,
                  pressed &&
                    !carregando &&
                    styles.submitButtonPressed,
                ]}
              >
                <Gradiente />

                <Text style={styles.submitButtonText}>
                  {carregando ? "Criando conta..." : "Criar conta"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Já possui uma conta?
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={voltarLogin}
              >
                <Text style={styles.footerLink}>Fazer login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: "#EEF4FC",
  },

  scroll: {
    flex: 1,
  },

  page: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#F4F7FC",
  },

  pageSmall: {
    paddingVertical: 20,
    paddingHorizontal: 14,
  },

  card: {
    position: "relative",
    width: "100%",
    maxWidth: 520,
    padding: 40,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(7, 29, 73, 0.1)",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow:
      "0px 25px 60px rgba(7, 29, 73, 0.12), 0px 4px 15px rgba(7, 29, 73, 0.06)",
  },

  cardSmall: {
    paddingVertical: 30,
    paddingHorizontal: 22,
    borderRadius: 18,
  },

  cardTopLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F6FB",
    borderWidth: 1,
    borderColor: "#E2E8F1",
    borderRadius: 9,
  },

  backButtonPressed: {
    backgroundColor: "#EAF0F9",
  },

  backButtonText: {
    color: "#071D49",
    fontSize: 13,
    fontWeight: "700",
  },

  header: {
    marginBottom: 28,
  },

  badge: {
    alignSelf: "flex-start",
    marginBottom: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: "#EDF3FC",
    color: "#071D49",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  title: {
    marginBottom: 10,
    color: "#071D49",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  titleSmall: {
    fontSize: 27,
  },

  description: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 24.75,
  },

  form: {
    gap: 18,
  },

  field: {
    gap: 8,
    minWidth: 0,
  },

  label: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },

  input: {
    width: "100%",
    minWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 15,
    backgroundColor: "#FBFCFE",
    borderWidth: 1,
    borderColor: "#DBE3EF",
    borderRadius: 11,
    color: "#111827",
    fontSize: 14,
  },

  inputFocused: {
    backgroundColor: "#FFFFFF",
    borderColor: "#1557B0",
    boxShadow: "0px 0px 0px 4px rgba(21, 87, 176, 0.1)",
  },

  submitButton: {
    position: "relative",
    width: "100%",
    marginTop: 8,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 11,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1557B0",
    boxShadow: "0px 9px 22px rgba(21, 87, 176, 0.22)",
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonPressed: {
    opacity: 0.9,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  message: {
    marginBottom: 20,
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19.5,
  },

  errorMessage: {
    backgroundColor: "#FFF1F0",
    borderColor: "#FFD3CF",
  },

  errorText: {
    color: "#B42318",
  },

  successMessage: {
    backgroundColor: "#EDF9F2",
    borderColor: "#CCEBD9",
  },

  successText: {
    color: "#137A4B",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 26,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#EDF0F5",
  },

  footerText: {
    color: "#6B7280",
    fontSize: 13,
  },

  footerLink: {
    color: "#1557B0",
    fontSize: 13,
    fontWeight: "800",
  },
});