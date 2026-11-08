import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import authService from "../../services/authService";
import { reviewService } from "../../services/dataService";
import { useAuth } from "../../contexts/AuthContext";

export default function UsuarioSupportScreen({ navigation, route }) {
  const profile = route.name === "Perfil";
  const { width } = useWindowDimensions();
  const { logout } = useAuth();

  const [reviews, setReviews] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const smallScreen = width <= 600;

  useEffect(() => {
    let live = true;

    authService
      .getCurrentUser()
      .then((value) => {
        if (live) setUser(value);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });

    return () => {
      live = false;
    };
  }, []);

  async function carregarAvaliacoes() {
    try {
      setReviews(await reviewService.user(user.id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function entrarNovamente() {
    try {
      await logout();
    } catch (e) {
      setError(e.message);
    }
  }

  function inicio() {
    navigation.navigate("UsuarioHome");
  }

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right"]}
    >
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: Math.max(20, width * 0.06),
          },
        ]}
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="OndeTá — início"
          onPress={inicio}
        >
          <Text style={styles.brand}>
            Onde<Text style={styles.brandAccent}>Tá</Text>
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="link"
          onPress={inicio}
          style={styles.headerBack}
        >
          <Text style={styles.headerLink}>
            ← Voltar ao início
          </Text>
        </Pressable>
      </View>

      <SafeAreaView
        style={styles.body}
        edges={["bottom"]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.main}>
            <Text
              accessibilityRole="header"
              style={styles.title}
            >
              {profile ? "Minha conta" : "Central de ajuda"}
            </Text>

            {!!error && (
              <View
                accessibilityRole="alert"
                style={styles.errorContainer}
              >
                <Text style={styles.paragraph}>{error}</Text>

                <Pressable
                  accessibilityRole="link"
                  onPress={entrarNovamente}
                >
                  <Text style={styles.link}>
                    Entrar novamente
                  </Text>
                </Pressable>
              </View>
            )}

            {profile ? (
              <View style={styles.card}>
                {user ? (
                  <>
                    <Text
                      accessibilityRole="header"
                      style={styles.cardTitle}
                    >
                      {user.name}
                    </Text>

                    <Text style={styles.paragraph}>
                      E-mail: {user.email}
                    </Text>

                    <Text style={styles.paragraph}>
                      Telefone: {user.phone || "Não informado"}
                    </Text>

                    <Text style={styles.paragraph}>
                      Situação: {user.is_active ? "Ativo" : "Bloqueado"}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      onPress={carregarAvaliacoes}
                      style={({ pressed }) => [
                        styles.reviewButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.reviewButtonText}>
                        Minhas avaliações recebidas
                      </Text>
                    </Pressable>

                    {reviews && (
                      <Text style={styles.paragraph}>
                        {reviews.total_reviews} avaliações · Média:{" "}
                        {reviews.average_rating ?? "Sem notas"}
                      </Text>
                    )}

                    <Pressable
                      accessibilityRole="link"
                      onPress={() =>
                        navigation.navigate("RecuperarSenha")
                      }
                      style={styles.recoveryLink}
                    >
                      <Text style={styles.link}>
                        Recuperar senha
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  !error && (
                    <Text style={styles.paragraph}>
                      Carregando sua conta...
                    </Text>
                  )
                )}
              </View>
            ) : (
              <View style={styles.card}>
                <Text
                  accessibilityRole="header"
                  style={styles.cardTitle}
                >
                  Como usar o OndeTá
                </Text>

                <Text style={styles.paragraph}>
                  Registre o objeto perdido e acompanhe seus itens. A equipe
                  pode encaminhar correspondências; consulte as notificações
                  e solicitações para conversar sobre a devolução.
                </Text>

                <View
                  style={[
                    styles.helpActions,
                    smallScreen && styles.helpActionsSmall,
                  ]}
                >
                  <Pressable
                    accessibilityRole="link"
                    onPress={() =>
                      navigation.navigate("RegistrarItem")
                    }
                    style={({ pressed }) => [
                      styles.helpButton,
                      styles.primaryButton,
                      smallScreen && styles.fullWidth,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.helpButtonText,
                        styles.primaryButtonText,
                      ]}
                    >
                      Cadastrar item perdido
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="link"
                    onPress={() =>
                      navigation.navigate("Notificacoes")
                    }
                    style={({ pressed }) => [
                      styles.helpButton,
                      styles.secondaryButton,
                      smallScreen && styles.fullWidth,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.helpButtonText,
                        styles.secondaryButtonText,
                      ]}
                    >
                      Ver notificações
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="link"
                    onPress={() =>
                      navigation.navigate("Solicitacoes")
                    }
                    style={({ pressed }) => [
                      styles.helpButton,
                      styles.secondaryButton,
                      smallScreen && styles.fullWidth,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.helpButtonText,
                        styles.secondaryButtonText,
                      ]}
                    >
                      Acompanhar solicitações
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="link"
                onPress={inicio}
              >
                <Text style={styles.footerLink}>
                  Voltar ao início
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="link"
                onPress={() => navigation.navigate("MeusItens")}
              >
                <Text style={styles.footerLink}>
                  Meus itens
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#061A40",
  },

  body: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },

  header: {
    backgroundColor: "#061A40",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    gap: 20,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },

  brandAccent: {
    color: "#5EA2FF",
  },

  headerBack: {
    flexShrink: 1,
  },

  headerLink: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "right",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  main: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },

  title: {
    color: "#061A40",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 21,
    marginBottom: 21,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  cardTitle: {
    color: "#061A40",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 15,
  },

  paragraph: {
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 25.6,
    marginVertical: 16,
  },

  errorContainer: {
    marginBottom: 20,
  },

  link: {
    color: "#0D4FA8",
    fontSize: 16,
    lineHeight: 25.6,
    textDecorationLine: "underline",
  },

  reviewButton: {
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#0D4FA8",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  reviewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  recoveryLink: {
    alignSelf: "flex-start",
  },

  helpActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
  },

  helpActionsSmall: {
    flexDirection: "column",
    alignItems: "stretch",
    flexWrap: "nowrap",
  },

  helpButton: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  fullWidth: {
    width: "100%",
  },

  helpButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: "#1554B4",
    borderColor: "#1554B4",
  },

  primaryButtonText: {
    color: "#FFFFFF",
  },

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C9D9EE",
  },

  secondaryButtonText: {
    color: "#1554B4",
  },

  pressed: {
    opacity: 0.8,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    marginVertical: 30,
  },

  footerLink: {
    color: "#0D4FA8",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});