import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import { apiRequest } from "../services/api";
import { Button } from "./UI";
export default function ReturnSignatureStatus({ claimId }) {
  const [state, setState] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <View>
      <Button
        title="Consultar assinatura da devolução"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          setError("");
          try {
            setState(
              await apiRequest("/claims/claims/" + claimId + "/signature"),
            );
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      />
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
      {state && <Text>Situação: {state.status}</Text>}
      {state?.signing_url && (
        <Button
          title="Assinar no Dsgner"
          onPress={async () => {
            try {
              await Linking.openURL(state.signing_url);
            } catch (e) {
              setError(e.message);
            }
          }}
        />
      )}
    </View>
  );
}
