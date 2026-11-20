import React, { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { apiRequest } from "../../services/api";
import { Button, s } from "../../components/UI";

export default function TwoFactorScreen() {
  const [setup, setSetup] = useState(null),
    [code, setCode] = useState(""),
    [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function run(path) {
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest("/security/2fa/" + path, {
        method: "POST",
        body: JSON.stringify({ code, password }),
      });
      if (path === "setup") setSetup(result);
      else {
        setSetup(null);
        setCode("");
        setPassword("");
        setMessage(result.message);
      }
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.title}>Autenticação 2FA</Text>
      <Text style={s.text}>
        Use um aplicativo autenticador. Redefinir a senha não desativa o 2FA.
        Preserve acesso ao autenticador.
      </Text>
      {!!message && <Text accessibilityRole="alert">{message}</Text>}
      <Button title="Configurar 2FA" busy={busy} onPress={() => run("setup")} />
      {setup && (
        <View>
          <SvgXml xml={setup.qr_svg} width={250} height={250} />
          <Text selectable>Chave manual: {setup.secret}</Text>
        </View>
      )}
      <Text style={s.label}>Código de seis dígitos</Text>
      <TextInput
        style={s.input}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      {!setup && (
        <>
          <Text style={s.label}>Senha atual para desativar</Text>
          <TextInput
            style={s.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}
      <Button
        title={setup ? "Confirmar ativação" : "Desativar 2FA"}
        busy={busy}
        onPress={() => run(setup ? "verify" : "disable")}
      />
      <Button
        title="Cancelar"
        secondary
        onPress={() => {
          setSetup(null);
          setCode("");
        }}
      />
    </ScrollView>
  );
}
