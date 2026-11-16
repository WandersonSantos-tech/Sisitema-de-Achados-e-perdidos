
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
import { useAuth } from "../../contexts/AuthContext";

export default function RedefinirSenhaScreen({
  navigation,
  route,
}) {
  const { user, logout } = useAuth();

  const tokenDaUrl = route?.params?.token || "";

  const [token, setToken] = useState(tokenDaUrl);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function voltarLogin() {
    if (user) {
      await logout();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }

  async function redefinirSenha() {
    if (carregando) return;

    setErro("");
    setSucesso("");

    if (!token.trim()) {
      setErro("Token de recuperação não informado.");
      return;
    }

    if (novaSenha.length < 8) {
      setErro(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas informadas não são iguais.");
      return;
    }

    try {
      setCarregando(true);

      const response = await authService.resetPassword(
        token.trim(),
        novaSenha
      );

      setSucesso(
        response?.msg || "Senha redefinida com sucesso."
      );

      setTimeout(() => {
        voltarLogin();
      }, 1500);
    } catch (error) {
      setErro(
        error.message ||
          "Não foi possível redefinir a senha."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
              onPress={voltarLogin}
            >
              <Text style={styles.backText}>
                ← Voltar
              </Text>
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.badge}>NOVA SENHA</Text>

              <Text style={styles.title}>
                Redefinir senha
              </Text>

              <Text style={styles.description}>
                Escolha uma nova senha para acessar sua
                conta.
              </Text>
            </View>

            {!!erro && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {erro}
                </Text>
              </View>
            )}

            {!!sucesso && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>
                  {sucesso}
                </Text>
              </View>
            )}

            {!tokenDaUrl && (
              <View style={styles.field}>
                <Text style={styles.label}>
                  Token de recuperação
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Digite o token recebido"
                  placeholderTextColor="#9CA8BA"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>
                Nova senha
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Mínimo de 8 caracteres"
                placeholderTextColor="#9CA8BA"
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Confirmar nova senha
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Digite novamente"
                placeholderTextColor="#9CA8BA"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Pressable
              style={[
                styles.submitButton,
                carregando && styles.disabled,
              ]}
              disabled={carregando}
              onPress={redefinirSenha}
            >
              <LinearGradient
                colors={["#071D49", "#1557B0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>
                  Redefinir senha
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  page: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
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
    backgroundColor: "#F3F6FB",
    borderWidth: 1,
    borderColor: "#E2E8F1",
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    color: "#071D49",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginBottom: 10,
  },

  description: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 25,
  },

  field: {
    marginBottom: 18,
  },

  label: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#DBE3EF",
    borderRadius: 11,
    backgroundColor: "#FBFCFE",
    paddingHorizontal: 15,
    color: "#111827",
    fontSize: 16,
  },

  submitButton: {
    minHeight: 52,
    marginTop: 8,
    borderRadius: 11,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  disabled: {
    opacity: 0.6,
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
