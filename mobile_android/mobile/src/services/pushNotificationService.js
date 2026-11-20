
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registrarNotificacoesAndroid() {
  if (Platform.OS !== "android") {
    return null;
  }

  if (!Device.isDevice) {
    console.warn(
      "[OndeTá Push] Use um Android físico para testar."
    );
    return null;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Notificações OndeTá",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2563EB",
    sound: "default",
  });

  let permissao = await Notifications.getPermissionsAsync();

  if (permissao.status !== "granted") {
    permissao = await Notifications.requestPermissionsAsync();
  }

  if (permissao.status !== "granted") {
    console.warn(
      "[OndeTá Push] Permissão de notificações negada."
    );
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    console.warn(
      "[OndeTá Push] Project ID do Expo não encontrado."
    );
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  console.log("[OndeTá Push] Token gerado com sucesso.");

  return token.data;
}
