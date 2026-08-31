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

export default function RecuperarSenhaScreen({
  navigation,
}) {
  const [email, setEmail] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  async function enviar() {
    if (!email.trim()) {
      Alert.alert(
        "Atenção",
        "Informe seu e-mail."
      );
      return;
    }

    try {
      setLoading(true);

      await authService.forgotPassword(
        email.trim()
      );

      Alert.alert(
        "Solicitação enviada",
        "Confira seu e-mail para continuar a recuperação da senha."
      );
    } catch (error) {
      Alert.alert(
        "Erro",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
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
          Recuperar senha
        </Text>

        <Text style={styles.subtitle}>
          Informe o e-mail cadastrado
          na sua conta.
        </Text>

        <View style={styles.card}>
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

          <TouchableOpacity
            style={styles.button}
            onPress={enviar}
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
                Enviar recuperação
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
      flex: 1,
      padding: 24,
      paddingTop: 40,
    },

    back: {
      color: "#1468D8",
      fontWeight: "800",
      marginBottom: 45,
    },

    title: {
      fontSize: 34,
      fontWeight: "900",
      color: "#061A40",
    },

    subtitle: {
      color: "#64748B",
      marginTop: 10,
      marginBottom: 30,
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      padding: 22,
    },

    label: {
      fontWeight: "700",
      color: "#334155",
      marginBottom: 8,
    },

    input: {
      height: 56,
      borderWidth: 1,
      borderColor: "#DCE6F2",
      backgroundColor: "#F8FBFF",
      borderRadius: 14,
      paddingHorizontal: 15,
      marginBottom: 20,
    },

    button: {
      height: 56,
      backgroundColor: "#0B5CC6",
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },

    buttonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },
  });