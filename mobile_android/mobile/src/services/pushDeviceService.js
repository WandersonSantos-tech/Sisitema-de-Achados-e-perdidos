
import { apiRequest } from "./api";

const ENDPOINT = "/push-devices";

export async function cadastrarDispositivoPush(expoPushToken) {
  if (!expoPushToken) {
    return null;
  }

  return apiRequest(ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      expo_push_token: expoPushToken,
      platform: "android",
    }),
  });
}

export async function removerDispositivoPush(expoPushToken) {
  if (!expoPushToken) {
    return null;
  }

  return apiRequest(ENDPOINT, {
    method: "DELETE",
    body: JSON.stringify({
      expo_push_token: expoPushToken,
      platform: "android",
    }),
  });
}
