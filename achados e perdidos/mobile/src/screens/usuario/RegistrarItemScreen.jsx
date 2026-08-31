import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function RegistrarItemScreen({
  navigation,
}) {
  const [titulo, setTitulo] =
    useState("");
  const [categoria, setCategoria] =
    useState("");
  const [descricao, setDescricao] =
    useState("");
  const [local, setLocal] =
    useState("");
  const [data, setData] =
    useState("");
  const [
    caracteristicas,
    setCaracteristicas,
  ] = useState("");

  function salvar() {
    if (
      !titulo ||
      !categoria ||
      !descricao ||
      !local ||
      !data
    ) {
      Alert.alert(
        "Atenção",
        "Preencha os campos obrigatórios."
      );
      return;
    }

    Alert.alert(
      "Tela preparada",
      "Agora falta conectar esta tela ao endpoint de itens do backend."
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text style={styles.title}>
          Registrar objeto perdido
        </Text>

        <Text style={styles.subtitle}>
          Quanto mais detalhes você
          informar, melhor será a
          comparação automática.
        </Text>

        <Text style={styles.label}>
          Nome do objeto
        </Text>

        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ex.: Mochila preta"
        />

        <Text style={styles.label}>
          Categoria
        </Text>

        <TextInput
          style={styles.input}
          value={categoria}
          onChangeText={setCategoria}
          placeholder="Ex.: Mochilas"
        />

        <Text style={styles.label}>
          Descrição
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.textarea,
          ]}
          multiline
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descreva o objeto"
        />

        <Text style={styles.label}>
          Local aproximado da perda
        </Text>

        <TextInput
          style={styles.input}
          value={local}
          onChangeText={setLocal}
          placeholder="Ex.: Bloco C"
        />

        <Text style={styles.label}>
          Data aproximada
        </Text>

        <TextInput
          style={styles.input}
          value={data}
          onChangeText={setData}
          placeholder="31/08/2026"
        />

        <Text style={styles.label}>
          Características específicas
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.textarea,
          ]}
          multiline
          value={caracteristicas}
          onChangeText={
            setCaracteristicas
          }
          placeholder="Detalhes que podem ajudar na validação de propriedade"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={salvar}
        >
          <Text
            style={styles.buttonText}
          >
            Registrar objeto
          </Text>
        </TouchableOpacity>
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
      paddingBottom: 50,
    },

    title: {
      color: "#061A40",
      fontSize: 28,
      fontWeight: "900",
    },

    subtitle: {
      color: "#64748B",
      lineHeight: 21,
      marginTop: 8,
      marginBottom: 25,
    },

    label: {
      color: "#334155",
      fontWeight: "700",
      marginBottom: 8,
    },

    input: {
      minHeight: 54,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#DCE6F2",
      borderRadius: 14,
      paddingHorizontal: 15,
      marginBottom: 18,
    },

    textarea: {
      minHeight: 110,
      paddingTop: 15,
      textAlignVertical: "top",
    },

    button: {
      minHeight: 57,
      backgroundColor: "#0B5CC6",
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },

    buttonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },
  });