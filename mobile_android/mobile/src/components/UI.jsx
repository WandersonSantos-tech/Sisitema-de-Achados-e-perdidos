import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { imageURL } from "../services/api";
export const theme = {
  navy: "#061A40",
  blue: "#1468D8",
  muted: "#64748B",
  bg: "#F4F7FB",
  line: "#DCE6F2",
};
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  content: {
    padding: 22,
    paddingBottom: 44,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: "900", color: theme.navy },
  h2: { fontSize: 19, fontWeight: "800", color: theme.navy },
  text: { color: "#334155", lineHeight: 22 },
  muted: { color: theme.muted, lineHeight: 21 },
  card: {
    padding: 21,
    borderWidth: 1,
    borderColor: "#E1EAF5",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    padding: 15,
    backgroundColor: "#F8FBFF",
    color: theme.navy,
  },
  label: { fontWeight: "700", color: "#334155", marginBottom: 8 },
  button: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#0B5CC6",
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontWeight: "800", color: "#FFFFFF", textAlign: "center" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF3FF",
    borderRadius: 12,
    padding: 8,
    color: theme.blue,
    fontSize: 12,
    fontWeight: "800",
  },
  error: { color: "#B42318", lineHeight: 22 },
});
export function Button({
  title,
  onPress,
  disabled = false,
  busy = false,
  secondary = false,
  danger = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.button,
        secondary && { backgroundColor: "#EAF3FF" },
        danger && { backgroundColor: "#B42318" },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? theme.blue : "#FFFFFF"} />
      ) : (
        <Text style={[s.buttonText, secondary && { color: theme.blue }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Page({
  title,
  navigation,
  children,
  refreshing = false,
  onRefresh,
}) {
  return (
    <SafeAreaView
      style={s.page}
      edges={
        navigation
          ? ["bottom", "left", "right"]
          : ["top", "bottom", "left", "right"]
      }
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          <Text style={{ fontSize: 20, fontWeight: "900", color: theme.navy }}>
            Onde<Text style={{ color: theme.blue }}>Tá</Text>
          </Text>
          <Text style={s.title}>{title}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Field({ label, multiline, ...props }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#94A3B8"
        style={[
          s.input,
          multiline && { minHeight: 110, textAlignVertical: "top" },
        ]}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}
export function Feedback({ loading, error, onRetry, empty }) {
  return (
    <View style={{ gap: 10 }}>
      {loading && <ActivityIndicator size="large" color={theme.blue} />}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      {!!error && onRetry && (
        <Button title="Tentar novamente" secondary onPress={onRetry} />
      )}
      {!loading && !error && empty && <Text style={s.muted}>{empty}</Text>}
    </View>
  );
}
export function Pager({ page, total, size = 20, onPage, loading }) {
  return (
    <View style={s.row}>
      <Button
        title="Anterior"
        secondary
        disabled={loading || page <= 1}
        onPress={() => onPage(page - 1)}
      />
      <Text style={s.muted}>Página {page}</Text>
      <Button
        title="Próxima"
        secondary
        disabled={loading || page * size >= total}
        onPress={() => onPage(page + 1)}
      />
    </View>
  );
}
export function Photo({ uri, title, large = false }) {
  const [failed, setFailed] = useState(false);
  return failed || !uri ? (
    <View
      style={{
        height: large ? 200 : 110,
        backgroundColor: "#EAF3FF",
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={s.muted}>
        {uri ? "Imagem indisponível" : "Sem imagem cadastrada"}
      </Text>
    </View>
  ) : (
    <Image
      source={{ uri: imageURL(uri) }}
      accessibilityLabel={title || "Foto do objeto"}
      resizeMode="contain"
      onError={() => setFailed(true)}
      style={{
        height: large ? 260 : 140,
        width: "100%",
        borderRadius: 14,
        backgroundColor: "#F4F7FB",
      }}
    />
  );
}
export function Photos({ images = [], title }) {
  const [zoom, setZoom] = useState(null);
  return (
    <View style={{ gap: 10 }}>
      {images.length ? (
        images.map((img, i) => (
          <Pressable
            key={img.id || img.uri || i}
            accessibilityRole="button"
            accessibilityLabel={`Ampliar imagem ${i + 1}`}
            onPress={() => setZoom(img.image_url || img.uri)}
          >
            <Photo uri={img.image_url || img.uri} title={title} />
          </Pressable>
        ))
      ) : (
        <Photo />
      )}
      <Modal
        visible={!!zoom}
        animationType="fade"
        onRequestClose={() => setZoom(null)}
      >
        <SafeAreaView
          style={[s.page, { justifyContent: "center", padding: 22 }]}
        >
          <Photo key={zoom} uri={zoom} title={title} large />
          <Button title="Fechar imagem" onPress={() => setZoom(null)} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
export const statusLabel = (v) =>
  ({
    PERDIDO: "Perdido",
    ENCONTRADO: "Encontrado",
    EM_NEGOCIACAO: "Em negociação",
    DEVOLVIDO: "Devolvido",
    CANCELADO: "Cancelado",
    CORRESPONDENCIA: "Correspondência enviada — aguardando verificação",
    PENDENTE: "Aguardando análise",
    APROVADA: "Aprovada — aguardando retirada",
    REJEITADA: "Rejeitada",
  })[v] || v;
export const dateLabel = (v) =>
  v ? new Date(v).toLocaleString("pt-BR") : "Não informado";
