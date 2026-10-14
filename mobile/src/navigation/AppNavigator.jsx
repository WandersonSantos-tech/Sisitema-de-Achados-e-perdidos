import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/auth/LoginScreen";
import CadastroScreen from "../screens/auth/CadastroScreen";
import RecuperarSenhaScreen from "../screens/auth/RecuperarSenhaScreen";
import RedefinirSenhaScreen from "../screens/auth/RedefinirSenhaScreen";
import UsuarioHomeScreen from "../screens/usuario/UsuarioHomeScreen";

// 1. Importe a tela de registrar item (ajuste a pasta se necessário, ex: ../screens/itens/RegistrarItemScreen)
import RegistrarItemScreen from "../screens/usuario/RegistrarItemScreen"; 
import PerfilScreen from "../screens/usuario/PerfilScreen"; 

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

        {/* 2. Adicione a tela com o nome exato "RegistrarItem" */}
        <Stack.Screen
          name="RegistrarItem"
          component={RegistrarItemScreen}
        />

        {/* Adicione também a tela de perfil para evitar erros ao navegar até ela */}
        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}