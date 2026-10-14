import React, {
  useCallback,
  useState,
} from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFocusEffect,
} from "@react-navigation/native";
import { authService } from "../../services/authService";

export default function UsuarioHomeScreen({
  navigation,
}) {
  const [usuario, setUsuario] =
    useState(null);

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        const user =
          await authService.getUser();

        setUsuario(user);
      }

      carregar();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.small}>
              Bem-vindo ao OndeTá
            </Text>

            <Text style={styles.name}>
              Olá,{" "}
              {usuario?.name ||
                "usuário"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notification}
            onPress={() =>
              navigation.navigate(
                "Notificacoes"
              )
            }
          >
            <Text style={styles.notificationText}>
              Avisos
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroBadge}>
            OBJETO PERDIDO
          </Text>

          <Text style={styles.heroTitle}>
            Perdeu alguma coisa?
          </Text>

          <Text
            style={
              styles.heroDescription
            }
          >
            Registre o objeto. O OndeTá
            compara seu cadastro com os
            itens encontrados.
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() =>
              navigation.navigate(
                "RegistrarItem"
              )
            }
          >
            <Text
              style={
                styles.heroButtonText
              }
            >
              Registrar objeto perdido
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Acompanhe seus registros
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate(
              "MeusItens"
            )
          }
        >
          <Text style={styles.cardLabel}>
            MEUS OBJETOS
          </Text>

          <Text style={styles.cardTitle}>
            Meus itens perdidos
          </Text>

          <Text
            style={
              styles.cardDescription
            }
          >
            Veja os objetos que você
            cadastrou e acompanhe seus
            status.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.matchCard}
          onPress={() =>
            navigation.navigate(
              "Correspondencias"
            )
          }
        >
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text
                style={
                  styles.matchLabel
                }
              >
                CORRESPONDÊNCIAS
              </Text>

              <Text
                style={
                  styles.matchTitle
                }
              >
                Esse objeto pode ser
                seu
              </Text>
            </View>

            <View
              style={
                styles.percentage
              }
            >
              <Text
                style={
                  styles.percentageText
                }
              >
                %
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.matchDescription
            }
          >
            Quando o sistema identificar
            características compatíveis,
            você será notificado aqui.
          </Text>
        </TouchableOpacity>

        <View style={styles.security}>
          <Text
            style={
              styles.securityTitle
            }
          >
            Retirada segura
          </Text>

          <Text
            style={
              styles.securityText
            }
          >
            A devolução passa por
            validação de propriedade,
            autorização do funcionário,
            autenticação em dois fatores
            e assinatura.
          </Text>
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
      padding: 20,
      paddingBottom: 40,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 25,
    },

    small: {
      color: "#64748B",
      fontSize: 12,
    },

    name: {
      color: "#061A40",
      fontWeight: "900",
      fontSize: 24,
      marginTop: 3,
    },

    notification: {
      backgroundColor: "#EAF3FF",
      paddingVertical: 11,
      paddingHorizontal: 15,
      borderRadius: 14,
    },

    notificationText: {
      color: "#1468D8",
      fontWeight: "800",
    },

    hero: {
      backgroundColor: "#061A40",
      borderRadius: 27,
      padding: 25,
      marginBottom: 30,
    },

    heroBadge: {
      color: "#67A9FF",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.3,
    },

    heroTitle: {
      color: "#FFFFFF",
      fontSize: 29,
      fontWeight: "900",
      marginTop: 15,
    },

    heroDescription: {
      color: "#C4D5EA",
      lineHeight: 21,
      marginTop: 10,
    },

    heroButton: {
      backgroundColor: "#1976E9",
      minHeight: 54,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 23,
    },

    heroButtonText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },

    sectionTitle: {
      color: "#061A40",
      fontWeight: "900",
      fontSize: 20,
      marginBottom: 15,
    },

    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: 22,
      padding: 21,
      borderWidth: 1,
      borderColor: "#E7EDF5",
      marginBottom: 15,
    },

    cardLabel: {
      color: "#1468D8",
      fontSize: 10,
      fontWeight: "900",
    },

    cardTitle: {
      color: "#061A40",
      fontWeight: "900",
      fontSize: 19,
      marginTop: 8,
    },

    cardDescription: {
      color: "#64748B",
      lineHeight: 20,
      marginTop: 7,
    },

    matchCard: {
      backgroundColor: "#EAF3FF",
      borderRadius: 22,
      padding: 21,
      borderWidth: 1,
      borderColor: "#CCE2FC",
      marginBottom: 15,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
    },

    flex: {
      flex: 1,
    },

    matchLabel: {
      color: "#1468D8",
      fontSize: 10,
      fontWeight: "900",
    },

    matchTitle: {
      color: "#061A40",
      fontSize: 19,
      fontWeight: "900",
      marginTop: 7,
    },

    matchDescription: {
      color: "#52657E",
      marginTop: 13,
      lineHeight: 20,
    },

    percentage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "#1468D8",
      alignItems: "center",
      justifyContent: "center",
    },

    percentageText: {
      color: "#FFFFFF",
      fontWeight: "900",
    },

    security: {
      backgroundColor: "#FFFFFF",
      borderRadius: 22,
      padding: 20,
      marginTop: 3,
    },

    securityTitle: {
      color: "#061A40",
      fontWeight: "900",
      fontSize: 17,
    },

    securityText: {
      color: "#64748B",
      marginTop: 8,
      lineHeight: 20,
    },
  });