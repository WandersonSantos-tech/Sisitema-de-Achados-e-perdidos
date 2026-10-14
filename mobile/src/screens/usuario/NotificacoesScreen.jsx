import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function NotificacoesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Notificações
        </Text>

        <View style={styles.card}>
          <Text style={styles.badge}>
            CORRESPONDÊNCIA
          </Text>

          <Text style={styles.cardTitle}>
            Esse objeto pode ser seu
          </Text>

          <Text style={styles.text}>
            Quando o backend identificar
            uma correspondência, a
            notificação será exibida
            nesta tela com o percentual
            de compatibilidade.
          </Text>
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
      padding: 22,
    },

    title: {
      color: "#061A40",
      fontSize: 28,
      fontWeight: "900",
      marginBottom: 25,
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 22,
      padding: 22,
    },

    badge: {
      color: "#1468D8",
      fontSize: 10,
      fontWeight: "900",
    },

    cardTitle: {
      color: "#061A40",
      fontSize: 19,
      fontWeight: "900",
      marginTop: 8,
    },

    text: {
      color: "#64748B",
      lineHeight: 21,
      marginTop: 10,
    },
  });