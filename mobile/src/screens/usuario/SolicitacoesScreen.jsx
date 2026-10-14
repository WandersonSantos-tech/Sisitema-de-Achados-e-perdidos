import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SolicitacoesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Solicitações
        </Text>

        <Text style={styles.subtitle}>
          Acompanhe processos de
          validação e devolução.
        </Text>

        <View style={styles.card}>
          <Text style={styles.step}>
            FLUXO DE SEGURANÇA
          </Text>

          <Text style={styles.item}>
            1. Correspondência
          </Text>

          <Text style={styles.item}>
            2. Validação de propriedade
          </Text>

          <Text style={styles.item}>
            3. Aprovação do funcionário
          </Text>

          <Text style={styles.item}>
            4. Liberação da retirada
          </Text>

          <Text style={styles.item}>
            5. Autenticação em dois
            fatores
          </Text>

          <Text style={styles.item}>
            6. Assinaturas
          </Text>

          <Text style={styles.item}>
            7. Devolução concluída
          </Text>
        </View>

        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Nenhuma solicitação ativa
          </Text>

          <Text style={styles.text}>
            Uma solicitação poderá ser
            iniciada quando existir uma
            correspondência válida.
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
      marginTop: 8,
    },

    card: {
      backgroundColor: "#061A40",
      padding: 23,
      borderRadius: 24,
      marginTop: 28,
    },

    step: {
      color: "#67A9FF",
      fontWeight: "900",
      fontSize: 10,
      marginBottom: 15,
    },

    item: {
      color: "#FFFFFF",
      marginVertical: 7,
      fontWeight: "700",
    },

    empty: {
      backgroundColor: "#FFFFFF",
      padding: 22,
      borderRadius: 22,
      marginTop: 16,
    },

    emptyTitle: {
      color: "#061A40",
      fontWeight: "900",
      fontSize: 18,
    },

    text: {
      color: "#64748B",
      lineHeight: 21,
      marginTop: 9,
    },
  });