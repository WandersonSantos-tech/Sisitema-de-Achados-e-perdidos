import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { authService } from "../../services/authService";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert(
        "Atenção",
        "Informe seu e-mail e sua senha."
      );

      return;
    }

    try {
      setCarregando(true);

      const { usuario } = await authService.login(
        email.trim(),
        senha
      );

      if (usuario?.role === "ADMIN") {
        await authService.logout();

        Alert.alert(
          "Acesso de funcionário",
          "Funcionários devem utilizar a versão Web do OndeTá."
        );

        return;
      }

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "UsuarioHome",
          },
        ],
      });
    } catch (error) {
      Alert.alert(
        "Erro ao entrar",
        error.message
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>OT</Text>
          </View>

          <Text style={styles.brand}>
            Onde
            <Text style={styles.blue}>Tá</Text>
          </Text>

          <Text style={styles.brandSubtitle}>
            Achados & Perdidos
          </Text>

          <View style={styles.hero}>
            <Text style={styles.title}>
              Bem-vindo de volta.
            </Text>

            <Text style={styles.subtitle}>
              Entre na sua conta para acompanhar seus objetos perdidos,
              correspondências e solicitações.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Entrar
            </Text>

            <Text style={styles.cardDescription}>
              Informe seus dados para acessar sua conta.
            </Text>

            <Text style={styles.label}>
              E-mail
            </Text>

            <TextInput
              style={styles.input}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={styles.label}>
              Senha
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#94A3B8"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() =>
                navigation.navigate("RecuperarSenha")
              }
            >
              <Text style={styles.forgotText}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={entrar}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  Entrar
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.line} />

              <Text style={styles.separatorText}>
                ou
              </Text>

              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() =>
                navigation.navigate("Cadastro")
              }
            >
              <Text style={styles.registerText}>
                Criar minha conta
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              No OndeTá, você acompanha apenas seus próprios registros e
              correspondências identificadas pelo sistema.
            </Text>
          </View>

          <Text style={styles.footer}>
            OndeTá • Achados & Perdidos
          </Text>
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
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 35,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#061A40",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  brand: {
    color: "#061A40",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 12,
  },

  blue: {
    color: "#1468D8",
  },

  brandSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },

  hero: {
    marginTop: 35,
    marginBottom: 25,
  },

  title: {
    color: "#061A40",
    fontSize: 35,
    fontWeight: "900",
  },

  subtitle: {
    color: "#64748B",
    lineHeight: 21,
    marginTop: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E1EAF5",
  },

  cardTitle: {
    color: "#061A40",
    fontWeight: "900",
    fontSize: 24,
  },

  cardDescription: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 23,
  },

  label: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 8,
  },

  input: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE6F2",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 15,
    marginBottom: 17,
    color: "#0F172A",
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },

  forgotText: {
    color: "#1468D8",
    fontWeight: "700",
    fontSize: 12,
  },

  loginButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#0B5CC6",
    alignItems: "center",
    justifyContent: "center",
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E3EAF3",
  },

  separatorText: {
    color: "#94A3B8",
    marginHorizontal: 12,
    fontSize: 11,
  },

  registerButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CFE0F5",
    backgroundColor: "#F2F7FD",
    alignItems: "center",
    justifyContent: "center",
  },

  registerText: {
    color: "#1468D8",
    fontWeight: "800",
  },

  info: {
    backgroundColor: "#EAF3FF",
    borderRadius: 17,
    padding: 17,
    marginTop: 20,
  },

  infoText: {
    color: "#52657E",
    fontSize: 11,
    lineHeight: 17,
  },

  footer: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 25,
    fontSize: 10,
  },
});