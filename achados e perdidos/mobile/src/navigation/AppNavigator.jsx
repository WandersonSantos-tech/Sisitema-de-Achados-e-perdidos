import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/auth/LoginScreen";
import CadastroScreen from "../screens/auth/CadastroScreen";
import RecuperarSenhaScreen from "../screens/auth/RecuperarSenhaScreen";
import RedefinirSenhaScreen from "../screens/auth/RedefinirSenhaScreen";
import UsuarioHomeScreen from "../screens/usuario/UsuarioHomeScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Cadastro"
          component={CadastroScreen}
        />

        <Stack.Screen
          name="RecuperarSenha"
          component={RecuperarSenhaScreen}
        />

        <Stack.Screen
          name="RedefinirSenha"
          component={RedefinirSenhaScreen}
        />

        <Stack.Screen
          name="UsuarioHome"
          component={UsuarioHomeScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}