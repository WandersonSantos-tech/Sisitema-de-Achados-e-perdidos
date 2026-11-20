
import React, { useRef, useState } from "react";

import {
  ActivityIndicator,
  Keyboard,
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

export default function VerificacaoEmailScreen({
  navigation,
  route,
}) {
  const { login } = useAuth();

  const email = route.params?.email || "";
  const challengeToken = route.params?.challengeToken;

  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const enviando = useRef(false);

  async function verificarCodigo() {
    if (enviando.current) return;

    const codigoLimpo = codigo.replace(/\D/g, "");

    if (codigoLimpo.length !== 6) {
      setErro("Digite o código de 6 dígitos enviado ao e-mail.");
      return;
    }

    if (!challengeToken) {
      setErro(
        "Sua verificação expirou. Volte ao login e tente novamente."
      );
      return;
    }

    enviando.current = true;
    setCarregando(true);
    setErro("");

    Keyboard.dismiss();

    try {
      await login(
        email,
        "",
        challengeToken,
        codigoLimpo
      );

      // O AuthContext atualiza o usuário autenticado.
      // O AppNavigator abre automaticamente a área do usuário.
    } catch (error) {
      setErro(
        error?.message ||
          "Código inválido ou expirado. Tente novamente."
      );
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>✉</Text>
            </View>

            <Text style={styles.title}>
              Verificação de e-mail
            </Text>

            <Text style={styles.description}>
              Para proteger sua conta, enviamos um
              código de 6 dígitos para:
            </Text>

            <Text style={styles.email}>{email}</Text>

            <Text style={styles.label}>
              Código de verificação
            </Text>

            <TextInput
              style={styles.input}
              value={codigo}
              onChangeText={(valor) => {
                setCodigo(valor.replace(/\D/g, "").slice(0, 6));
                setErro("");
              }}
              placeholder="000000"
              placeholderTextColor="#A1AAB8"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              editable={!carregando}
              textAlign="center"
              returnKeyType="done"
              onSubmitEditing={verificarCodigo}
            />

            {!!erro && (
              <Text style={styles.error}>{erro}</Text>
            )}

            <Pressable
              onPress={verificarCodigo}
              disabled={carregando}
              style={[
                styles.button,
                carregando && styles.buttonDisabled,
              ]}
            >
              <LinearGradient
                colors={["#184F9F", "#2669C9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    Verificar código
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => navigation.goBack()}
              disabled={carregando}
              style={styles.backButton}
            >
              <Text style={styles.backText}>
                Voltar para o login
              </Text>
            </Pressable>

            <Text style={styles.footer}>
              Não recebeu o código? Verifique sua
              caixa de spam. Se necessário, volte ao
              login para solicitar um novo código.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  flex: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 35,
  },

  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderWidth: 1,
    borderColor: "#E3E9F2",
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },

  icon: {
    fontSize: 32,
    color: "#184F9F",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#061A40",
    textAlign: "center",
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  email: {
    fontSize: 15,
    color: "#184F9F",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#172033",
    marginBottom: 10,
  },

  input: {
    height: 58,
    borderWidth: 1,
    borderColor: "#D7DEEA",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    color: "#172033",
    letterSpacing: 8,
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  error: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },

  button: {
    marginTop: 24,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  backButton: {
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 8,
  },

  backText: {
    color: "#184F9F",
    fontSize: 14,
    fontWeight: "600",
  },

  footer: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 24,
  },
});
