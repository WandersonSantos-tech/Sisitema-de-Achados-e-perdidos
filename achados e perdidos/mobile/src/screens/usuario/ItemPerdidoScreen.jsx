import React, { useState } from "react";
import { Alert } from "react-native";
// 1. Importe o itemService (ajuste o caminho de pastas conforme seu projeto)
import itemService from "../../services/itemService";

export default function ItemPerdidoScreen({ navigation }) {
  // Exemplo de estados dos seus campos:
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [dataAproximada, setDataAproximada] = useState("");
  const [caracteristicas, setCaracteristicas] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Função de envio conectada ao backend
  async function handleRegistrar() {
    if (!nome.trim() || !categoria.trim()) {
      Alert.alert("Atenção", "Preencha ao menos o nome e a categoria do objeto.");
      return;
    }

    try {
      setLoading(true);

      // Envia os dados para a função cadastrarItem do itemService
      await itemService.cadastrarItem({
        nome: nome.trim(),
        categoria: categoria.trim(),
        descricao: descricao.trim(),
        local: local.trim(),
        data_aproximada: dataAproximada,
        caracteristicas_especificas: caracteristicas.trim(),
        tipo: "PERDIDO", // Caso seu backend diferencie itens achados de perdidos
      });

      Alert.alert("Sucesso", "Objeto perdido cadastrado com sucesso!");
      navigation.goBack(); // Retorna para a tela anterior
    } catch (error) {
      console.error("Erro ao cadastrar item:", error);
      Alert.alert("Erro", error.message || "Não foi possível cadastrar o objeto.");
    } finally {
      setLoading(false);
    }
  }

  // ... restante do seu JSX e botão chamando onPress={handleRegistrar}
}