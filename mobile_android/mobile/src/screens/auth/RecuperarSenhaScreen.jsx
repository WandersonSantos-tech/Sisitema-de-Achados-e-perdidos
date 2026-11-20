
import React, { useState } from "react";
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
import { authService } from "../../services/authService";

export default function RecuperarSenhaScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [focado, setFocado] = useState(false);

  async function enviar() {
    if (carregando) return;

    setErro("");
    setSucesso("");

    if (!email.trim()) {
      setErro("Informe seu e-mail.");
      return;
    }

    try {
      setCarregando(true);

      const response = await authService.forgotPassword(
        email.trim()
      );

      setSucesso(
        response?.msg ||
          "Se o e-mail existir, as instruções foram enviadas."
      );
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível solicitar a recuperação."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          <View style={styles.card}>
            <LinearGradient
              colors={["#071D49", "#1557B0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.topLine}
            />

            <Pressable
              style={styles.backButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.getParent()?.goBack();
                }
              }}
            >
              <Text style={styles.backText}>← Voltar</Text>
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.badge}>
                RECUPERAÇÃO DE ACESSO
              </Text>

              <Text style={styles.title}>
                Esqueceu sua senha?
              </Text>

              <Text style={styles.description}>
                Informe o e-mail utilizado no cadastro.
                Enviaremos as instruções para redefinir
                sua senha.
              </Text>
            </View>

            {!!erro && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{erro}</Text>
              </View>
            )}

            {!!sucesso && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  {sucesso}
                </Text>
              </View>
            )}

            <Text style={styles.label}>E-mail</Text>

            <TextInput
              style={[
                styles.input,
                focado && styles.inputFocused,
              ]}
              placeholder="Digite seu e-mail cadastrado"
              placeholderTextColor="#9CA8BA"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
            />

        <Pressable
          onPress={enviar}
          disabled={carregando}
          style={[
            styles.submitButton,
            carregando && styles.disabled,
          ]}
        >
          {carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              Enviar instruções
            </Text>
          )}
        </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Lembrou sua senha?
              </Text>

              <Pressable
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.footerLink}>
                  Voltar ao login
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  safe: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  page: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
    backgroundColor: "#F4F7FC",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1E7F0",
    paddingHorizontal: 22,
    paddingVertical: 30,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#071D49",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F3F6FB",
    borderWidth: 1,
    borderColor: "#E2E8F1",
    borderRadius: 9,
    marginBottom: 28,
  },

  backText: {
    color: "#071D49",
    fontSize: 13,
    fontWeight: "700",
  },

  header: {
    marginBottom: 28,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#EDF3FC",
    color: "#071D49",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#071D49",
    letterSpacing: -0.7,
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 25,
    color: "#6B7280",
  },

  label: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#DBE3EF",
    borderRadius: 11,
    backgroundColor: "#FBFCFE",
    color: "#111827",
    fontSize: 16,
    marginBottom: 18,
  },

  inputFocused: {
    borderColor: "#1557B0",
    backgroundColor: "#FFFFFF",
  },

  submitButton: {
    width: "100%",
    height: 54,
    backgroundColor: "#1557B0",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 2,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.6,
  },

  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
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

  errorBox: {
    padding: 13,
    backgroundColor: "#FFF1F0",
    borderColor: "#FFD3CF",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
  },

  errorText: {
    color: "#B42318",
    fontSize: 13,
  },

  successBox: {
    padding: 13,
    backgroundColor: "#EDF9F2",
    borderColor: "#CCEBD9",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
  },

  successText: {
    color: "#137A4B",
    fontSize: 13,
  },
});
