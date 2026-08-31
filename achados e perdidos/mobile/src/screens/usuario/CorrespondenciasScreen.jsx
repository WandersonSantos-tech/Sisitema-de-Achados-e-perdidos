import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CorrespondenciasScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Correspondências
        </Text>

        <Text style={styles.subtitle}>
          Você não precisa pesquisar
          objetos encontrados.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            BUSCA AUTOMÁTICA
          </Text>

          <Text style={styles.cardTitle}>
            O OndeTá faz isso por você
          </Text>

          <Text style={styles.text}>
            Quando um funcionário
            cadastrar um objeto
            encontrado com
            características compatíveis
            com um dos seus registros,
            você receberá a notificação
            “Esse objeto pode ser seu”.
          </Text>
        </View>

        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Nenhuma correspondência no
            momento
          </Text>

          <Text style={styles.text}>
            Continue acompanhando. O
            sistema fará novas
            comparações automaticamente.
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
      fontSize: 28,
      fontWeight: "900",
      color: "#061A40",
    },

    subtitle: {
      color: "#64748B",
      marginTop: 7,
    },

    card: {
      backgroundColor: "#EAF3FF",
      borderRadius: 23,
      padding: 22,
      marginTop: 27,
    },

    label: {
      color: "#1468D8",
      fontWeight: "900",
      fontSize: 10,
    },

    cardTitle: {
      color: "#061A40",
      fontSize: 20,
      fontWeight: "900",
      marginTop: 8,
    },

    text: {
      color: "#64748B",
      lineHeight: 21,
      marginTop: 10,
    },

    empty: {
      backgroundColor: "#FFFFFF",
      padding: 22,
      borderRadius: 23,
      marginTop: 15,
    },

    emptyTitle: {
      color: "#061A40",
      fontWeight: "900",
      fontSize: 18,
    },
  });