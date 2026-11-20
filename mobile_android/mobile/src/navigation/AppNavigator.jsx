
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../contexts/AuthContext";

import Login from "../screens/auth/LoginScreen";
import Cadastro from "../screens/auth/CadastroScreen";
import RecuperarSenha from "../screens/auth/RecuperarSenhaScreen";
import RedefinirSenha from "../screens/auth/RedefinirSenhaScreen";

import VerificacaoEmail from "../screens/auth/VerificacaoEmailScreen";

import Home from "../screens/usuario/UsuarioHomeScreen";
import Registrar from "../screens/usuario/RegistrarItemScreen";
import Itens from "../screens/usuario/MeusItensScreen";
import Detalhe from "../screens/usuario/ItemDetalheScreen";
import Matches from "../screens/usuario/CorrespondenciasScreen";
import Claims from "../screens/usuario/SolicitacoesScreen";
import Chat from "../screens/usuario/ChatScreen";
import Notifications from "../screens/usuario/NotificacoesScreen";
import TwoFactor from "../screens/usuario/TwoFactorScreen";
import Perfil from "../screens/usuario/PerfilScreen";
import Ajuda from "../screens/usuario/AjudaScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading, logout } = useAuth();

  const iniciou = useRef(false);
  const [preparando, setPreparando] = useState(true);
  const [erroInicial, setErroInicial] = useState("");

  useEffect(() => {
    if (loading || iniciou.current) return;

    iniciou.current = true;

    async function iniciar() {
      try {
        await logout();
      } catch (error) {
        setErroInicial(
          error?.message || "Erro ao preparar o login."
        );
      } finally {
        setPreparando(false);
      }
    }

    iniciar();
  }, [loading, logout]);

  if (loading || preparando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#1468D8"
        />
      </View>
    );
  }

  const autenticado = Boolean(user);

  return (
    <NavigationContainer
      linking={{
        prefixes: ["ondeta://"],
        config: {
          screens: {
            RedefinirSenha: "redefinir-senha",
          },
        },
      }}
    >
      <Stack.Navigator
        key={autenticado ? "usuario" : "visitante"}
        initialRouteName={
          autenticado ? "UsuarioHome" : "Login"
        }
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
        {autenticado ? (
          <Stack.Group navigationKey="user">
            <Stack.Screen
              name="UsuarioHome"
              component={Home}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="TwoFactor"
              component={TwoFactor}
              options={{ title: "Segurança" }}
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
              name="VerificacaoEmail"
              component={VerificacaoEmail}
              options={{ headerShown: false }}
            />


            <Stack.Screen
              name="Cadastro"
              component={Cadastro}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="RecuperarSenha"
              component={RecuperarSenha}
              options={{ headerShown: false }}
            />
          </Stack.Group>
        )}

        <Stack.Screen
          name="RedefinirSenha"
          component={RedefinirSenha}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FB",
  },
});
