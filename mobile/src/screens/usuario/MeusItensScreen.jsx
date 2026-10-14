import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MeusItensScreen({
  navigation,
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text style={styles.title}>
          Meus itens perdidos
        </Text>

        <Text style={styles.subtitle}>
          Seus registros aparecerão aqui
          após serem carregados da API.
        </Text>

        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Nenhum objeto carregado
          </Text>

          <Text style={styles.emptyText}>
            Registre um objeto perdido
            para iniciar a busca por
            correspondências.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate(
                "RegistrarItem"
              )
            }
          >
            <Text
              style={styles.buttonText}
            >
              Registrar objeto
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
      lineHeight: 20,
    },

    empty: {
      marginTop: 30,
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      padding: 25,
    },

    emptyTitle: {
      fontSize: 19,
      fontWeight: "900",
      color: "#061A40",
    },

    emptyText: {
      color: "#64748B",
      lineHeight: 21,
      marginTop: 9,
    },

    button: {
      marginTop: 22,
      height: 54,
      borderRadius: 14,
      backgroundColor: "#0B5CC6",
      justifyContent: "center",
      alignItems: "center",
    },

    buttonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },
  });