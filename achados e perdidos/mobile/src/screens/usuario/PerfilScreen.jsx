import React, {
  useEffect,
  useState,
} from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { authService } from "../../services/authService";

export default function PerfilScreen({
  navigation,
}) {
  const [usuario, setUsuario] =
    useState(null);

  useEffect(() => {
    authService
      .getMe()
      .then(setUsuario)
      .catch(() =>
        authService
          .getUser()
          .then(setUsuario)
      );
  }, []);

  async function sair() {
    await authService.logout();

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "Login",
        },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Minha conta
        </Text>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {usuario?.name
              ?.substring(0, 1)
              ?.toUpperCase() || "U"}
          </Text>
        </View>

        <Text style={styles.name}>
          {usuario?.name || "Usuário"}
        </Text>

        <Text style={styles.email}>
          {usuario?.email || ""}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Tipo de conta
          </Text>

          <Text style={styles.value}>
            Usuário
          </Text>

          <Text style={styles.label}>
            Segurança
          </Text>

          <Text style={styles.value}>
            Conta protegida por
            autenticação
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logout}
          onPress={sair}
        >
          <Text
            style={styles.logoutText}
          >
            Sair da conta
          </Text>
        </TouchableOpacity>
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
      padding: 22,
    },

    title: {
      color: "#061A40",
      fontSize: 28,
      fontWeight: "900",
    },

    avatar: {
      width: 75,
      height: 75,
      borderRadius: 38,
      backgroundColor: "#061A40",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 30,
    },

    avatarText: {
      color: "#FFFFFF",
      fontWeight: "900",
      fontSize: 27,
    },

    name: {
      color: "#061A40",
      fontWeight: "900",
      fontSize: 22,
      marginTop: 15,
    },

    email: {
      color: "#64748B",
      marginTop: 4,
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 22,
      padding: 22,
      marginTop: 25,
    },

    label: {
      color: "#94A3B8",
      fontSize: 11,
      fontWeight: "800",
      marginTop: 8,
    },

    value: {
      color: "#061A40",
      fontWeight: "700",
      marginTop: 5,
      marginBottom: 12,
    },

    logout: {
      marginTop: 20,
      minHeight: 55,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#D7E3F2",
      alignItems: "center",
      justifyContent: "center",
    },

    logoutText: {
      color: "#C0392B",
      fontWeight: "900",
    },
  });