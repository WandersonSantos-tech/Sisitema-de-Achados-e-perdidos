import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../contexts/AuthContext";

import Login from "../screens/auth/LoginScreen";
import Cadastro from "../screens/auth/CadastroScreen";
import RecuperarSenha from "../screens/auth/RecuperarSenhaScreen";
import RedefinirSenha from "../screens/auth/RedefinirSenhaScreen";

import Home from "../screens/usuario/UsuarioHomeScreen";
import Registrar from "../screens/usuario/RegistrarItemScreen";
import Itens from "../screens/usuario/MeusItensScreen";
import Detalhe from "../screens/usuario/ItemDetalheScreen";
import Matches from "../screens/usuario/CorrespondenciasScreen";
import Claims from "../screens/usuario/SolicitacoesScreen";
import Chat from "../screens/usuario/ChatScreen";
import Notifications from "../screens/usuario/NotificacoesScreen";
import Perfil from "../screens/usuario/PerfilScreen";
import Ajuda from "../screens/usuario/AjudaScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading, logout } = useAuth();

  const iniciou = useRef(false);

  const [pronto, setPronto] = useState(false);
  const [erroInicial, setErroInicial] = useState("");

  async function prepararLogin() {
    setErroInicial("");

    try {
      await logout();
      setPronto(true);
    } catch (error) {
      setErroInicial(
        error.message || "Não foi possível preparar o acesso."
      );
    }
  }

  useEffect(() => {
    // Aguarda a recuperação da sessão antes de encerrá-la.
    // Executa uma única vez, sem desconectar após um novo login.
    if (loading || iniciou.current) return;

    iniciou.current = true;
    prepararLogin();
  }, [loading, logout]);

  if (loading || !pronto) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: "#F4F7FB",
        }}
      >
        {erroInicial ? (
          <>
            <Text
              style={{
                color: "#B42318",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {erroInicial}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={prepararLogin}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 10,
                backgroundColor: "#1468D8",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                }}
              >
                Tentar novamente
              </Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator
            size="large"
            color="#1468D8"
          />
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? "usuario" : "visitante"}
        initialRouteName={user ? "UsuarioHome" : "Login"}
        screenOptions={{
          headerStyle: {
            backgroundColor: "#F4F7FB",
          },
          headerTintColor: "#061A40",
          headerShadowVisible: false,
          headerBackTitle: "Voltar",
          contentStyle: {
            backgroundColor: "#F4F7FB",
          },
        }}
      >
        {user ? (
          <Stack.Group navigationKey="user">
            <Stack.Screen
              name="UsuarioHome"
              component={Home}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="RegistrarItem"
              component={Registrar}
              options={{ title: "Registro do objeto" }}
            />

            <Stack.Screen
              name="MeusItens"
              component={Itens}
              options={{ title: "Meus itens" }}
            />

            <Stack.Screen
              name="ItemDetalhe"
              component={Detalhe}
              options={{ title: "Meu registro" }}
            />

            <Stack.Screen
              name="Correspondencias"
              component={Matches}
              options={{ title: "Correspondências" }}
            />

            <Stack.Screen
              name="Solicitacoes"
              component={Claims}
              options={{ title: "Solicitações" }}
            />

            <Stack.Screen
              name="Chat"
              component={Chat}
              options={{ title: "Conversa" }}
            />

            <Stack.Screen
              name="Notificacoes"
              component={Notifications}
              options={{ title: "Notificações" }}
            />

            <Stack.Screen
              name="Perfil"
              component={Perfil}
              options={{ title: "Minha conta" }}
            />

            <Stack.Screen
              name="Ajuda"
              component={Ajuda}
              options={{ title: "Ajuda" }}
            />
          </Stack.Group>
        ) : (
          <Stack.Group navigationKey="guest">
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Cadastro"
              component={Cadastro}
              options={{ headerShown: false }}
            />
          </Stack.Group>
        )}

        <Stack.Screen
          name="RecuperarSenha"
          component={RecuperarSenha}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="RedefinirSenha"
          component={RedefinirSenha}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}