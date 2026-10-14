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

export default function CadastroScreen({
  navigation,
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] =
    useState("");
  const [telefone, setTelefone] =
    useState("");
  const [senha, setSenha] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  async function cadastrar() {
    if (
      !nome ||
      !email ||
      !telefone ||
      !senha
    ) {
      Alert.alert(
        "Atenção",
        "Preencha todos os campos."
      );
      return;
    }

    try {
      setLoading(true);

      await authService.register({
        name: nome.trim(),
        email: email.trim(),
        phone: telefone.trim(),
        password: senha,
      });

      Alert.alert(
        "Conta criada",
        "Seu cadastro foi realizado com sucesso.",
        [
          {
            text: "Entrar",
            onPress: () =>
              navigation.navigate(
                "Login"
              ),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Erro no cadastro",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.container
          }
        >
          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text style={styles.back}>
              Voltar
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            Criar conta
          </Text>

          <Text style={styles.subtitle}>
            Cadastre-se para registrar
            seus objetos perdidos e
            acompanhar correspondências.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>
              Nome completo
            </Text>

            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
            />

            <Text style={styles.label}>
              E-mail
            </Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seuemail@exemplo.com"
            />

            <Text style={styles.label}>
              Telefone
            </Text>

            <TextInput
              style={styles.input}
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
              placeholder="(34) 99999-9999"
            />

            <Text style={styles.label}>
              Senha
            </Text>

            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              placeholder="Crie uma senha"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={cadastrar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Criar conta
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: "#F4F7FB",
    },

    container: {
      padding: 24,
      paddingTop: 35,
    },

    back: {
      color: "#1468D8",
      fontWeight: "800",
      marginBottom: 30,
    },

    title: {
      color: "#061A40",
      fontSize: 34,
      fontWeight: "900",
    },

    subtitle: {
      color: "#64748B",
      lineHeight: 21,
      marginTop: 10,
      marginBottom: 28,
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      padding: 22,
    },

    label: {
      color: "#334155",
      fontWeight: "700",
      marginBottom: 8,
    },

    input: {
      height: 55,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#DCE6F2",
      backgroundColor: "#F8FBFF",
      paddingHorizontal: 15,
      marginBottom: 18,
    },

    button: {
      backgroundColor: "#0B5CC6",
      height: 56,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 5,
    },

    buttonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },
  });