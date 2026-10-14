import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { authService } from "../../services/authService";

export default function RedefinirSenhaScreen({ navigation, route }) {
  const [token, setToken] = useState(
    route?.params?.token || ""
  );

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function redefinirSenha() {
    if (!token.trim()) {
      Alert.alert(
        "Atenção",
        "Informe o token de recuperação."
      );

      return;
    }

    if (!novaSenha.trim() || !confirmarSenha.trim()) {
      Alert.alert(
        "Atenção",
        "Preencha os campos de senha."
      );

      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert(
        "Atenção",
        "As senhas não são iguais."
      );

      return;
    }

    try {
      setCarregando(true);

      await authService.resetPassword(
        token.trim(),
        novaSenha
      );

      Alert.alert(
        "Senha alterada",
        "Sua senha foi redefinida com sucesso.",
        [
          {
            text: "Entrar",
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "Login",
                  },
                ],
              }),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível alterar a senha",
        error.message
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.back}>
            Voltar
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Redefinir senha
        </Text>

        <Text style={styles.subtitle}>
          Informe o código de recuperação e escolha sua nova senha.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Código de recuperação
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o token"
            placeholderTextColor="#94A3B8"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />

          <Text style={styles.label}>
            Nova senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#94A3B8"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
          />

          <Text style={styles.label}>
            Confirmar nova senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite a senha novamente"
            placeholderTextColor="#94A3B8"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={redefinirSenha}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.buttonText}>
                Alterar senha
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 35,
  },

  back: {
    color: "#1468D8",
    fontWeight: "800",
    marginBottom: 40,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#061A40",
  },

  subtitle: {
    color: "#64748B",
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E2EAF4",
  },

  label: {
    color: "#334155",
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    minHeight: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE6F2",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 15,
    marginBottom: 18,
    color: "#0F172A",
  },

  button: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#0B5CC6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});