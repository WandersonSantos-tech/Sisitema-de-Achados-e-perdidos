
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";

const VALIDADE = 300;

export default function VerificacaoEmailScreen({
  navigation,
  route,
}) {
  const { login } = useAuth();

  const email = route.params?.email || "";
  const challengeToken = route.params?.challengeToken;

  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(VALIDADE);

  const inputRef = useRef(null);
  const enviando = useRef(false);

  useEffect(() => {
    if (!email || !challengeToken) {
      navigation.replace("Login");
      return;
    }

    const timer = setInterval(() => {
      setSegundos((atual) => Math.max(0, atual - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [email, challengeToken, navigation]);

  function protegerEmail(valor) {
    const partes = valor.split("@");

    if (partes.length !== 2) return valor;

    return `${partes[0].slice(0, 2)}***@${partes[1]}`;
  }

  const tempo = `${String(
    Math.floor(segundos / 60)
  ).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;

  async function verificar() {
    if (enviando.current) return;

    if (codigo.length !== 6) {
      setErro("Digite os seis números do código.");
      return;
    }

    if (segundos <= 0) {
      setErro("O código expirou. Volte ao login.");
      return;
    }

    enviando.current = true;
    setCarregando(true);
    setErro("");

    try {
      await login(email, "", challengeToken, codigo);

      // O AuthContext atualiza o usuário autenticado.
      // O AppNavigator abre automaticamente a área do usuário.
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível validar o código."
      );
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  }

  if (!email || !challengeToken) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#071D40", "#123D78", "#2161A8"]}
      style={styles.background}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.brand}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>AP</Text>
                </View>

                <View>
                  <Text style={styles.brandTitle}>
                    Onde<Text style={styles.brandAccent}>Tá</Text>
                  </Text>
                  <Text style={styles.brandSubtitle}>
                    Achados & Perdidos
                  </Text>
                </View>
              </View>

              <View style={styles.iconCircle}>
                <Text style={styles.icon}>✉</Text>
              </View>

              <Text style={styles.title}>
                Verifique seu e-mail
              </Text>

              <Text style={styles.description}>
                Para proteger sua conta, enviamos um código
                de segurança de 6 dígitos para:
              </Text>

              <Text style={styles.email}>
                {protegerEmail(email)}
              </Text>

              <Text style={styles.label}>
                Código de verificação
              </Text>

              <Pressable
                style={styles.digits}
                onPress={() => inputRef.current?.focus()}
                accessibilityRole="button"
                accessibilityLabel="Digitar código de verificação"
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.digit,
                      codigo.length === index &&
                        styles.digitActive,
                    ]}
                  >
                    <Text style={styles.digitText}>
                      {codigo[index] || ""}
                    </Text>
                  </View>
                ))}

                <TextInput
                  ref={inputRef}
                  value={codigo}
                  onChangeText={(valor) => {
                    setCodigo(
                      valor.replace(/\D/g, "").slice(0, 6)
                    );
                    setErro("");
                  }}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  maxLength={6}
                  editable={!carregando}
                  caretHidden
                  style={styles.hiddenInput}
                  accessibilityLabel="Código de seis dígitos"
                />
              </Pressable>

              {!!erro && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{erro}</Text>
                </View>
              )}

              <Text style={styles.timer}>
                {segundos > 0
                  ? `O código expira em ${tempo}`
                  : "O código expirou."}
              </Text>

              <Pressable
                style={[
                  styles.submit,
                  (carregando ||
                    codigo.length !== 6 ||
                    segundos === 0) &&
                    styles.submitDisabled,
                ]}
                disabled={
                  carregando ||
                  codigo.length !== 6 ||
                  segundos === 0
                }
                onPress={verificar}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>
                    Verificar e continuar
                  </Text>
                )}
              </Pressable>

              <View style={styles.resend}>
                <Text style={styles.resendTitle}>
                  Não recebeu o código?
                </Text>
                <Text style={styles.resendDescription}>
                  Confira sua caixa de spam ou lixo eletrônico.
                </Text>
                <Text style={styles.resendPending}>
                  Reenvio de código: próxima etapa
                </Text>
              </View>

              <Pressable
                style={styles.backButton}
                onPress={() => navigation.replace("Login")}
                disabled={carregando}
              >
                <Text style={styles.backText}>
                  ← Voltar para o login
                </Text>
              </Pressable>

              <View style={styles.security}>
                <Text style={styles.securityText}>
                  🔒 Sua conta está protegida com autenticação
                  de dois fatores.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  background: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 470,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  logo: {
    width: 47,
    height: 47,
    borderRadius: 12,
    backgroundColor: "#174B91",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },
  brandTitle: {
    color: "#102D54",
    fontSize: 25,
    fontWeight: "800",
  },
  brandAccent: { color: "#2879D3" },
  brandSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
    color: "#2464B4",
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#112B4D",
    textAlign: "center",
    marginBottom: 13,
  },
  description: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 330,
  },
  email: {
    color: "#174B91",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 30,
  },
  label: {
    color: "#243B59",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 15,
  },
  digits: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    position: "relative",
  },
  digit: {
    flex: 1,
    maxWidth: 49,
    height: 57,
    borderWidth: 2,
    borderColor: "#DCE5F0",
    borderRadius: 10,
    backgroundColor: "#F9FBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  digitActive: {
    borderColor: "#2879D3",
    backgroundColor: "#F2F7FF",
  },
  digitText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#163D73",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.01,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 9,
    padding: 12,
    marginTop: 17,
    width: "100%",
  },
  errorText: {
    color: "#B42318",
    fontSize: 13,
    textAlign: "center",
  },
  timer: {
    color: "#64748B",
    fontSize: 13,
    marginVertical: 23,
  },
  submit: {
    backgroundColor: "#205BB1",
    borderRadius: 10,
    width: "100%",
    minHeight: 53,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: {
    backgroundColor: "#9AB5D8",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  resend: {
    alignItems: "center",
    marginTop: 27,
  },
  resendTitle: {
    color: "#64748B",
    fontSize: 13,
  },
  resendDescription: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },
  resendPending: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 7,
  },
  backButton: {
    marginTop: 27,
    padding: 8,
  },
  backText: {
    color: "#205BB1",
    fontSize: 14,
    fontWeight: "600",
  },
  security: {
    borderTopWidth: 1,
    borderTopColor: "#E8EDF4",
    marginTop: 30,
    paddingTop: 20,
    width: "100%",
  },
  securityText: {
    color: "#8795A8",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
  },
});
