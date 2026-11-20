import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { claimService, messageService } from "../../services/dataService";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Feedback, Field, s, dateLabel } from "../../components/UI";
export default function ChatScreen({ route }) {
  const { claim } = route.params,
    { user } = useAuth();
  const [contact, setContact] = useState(null),
    [messages, setMessages] = useState([]),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false);
  const list = useRef(null),
    sendingRef = useRef(false),
    refreshRef = useRef(null);
  useFocusEffect(
    useCallback(() => {
      let active = true,
        fetching = false,
        person = null;
      async function refresh() {
        if (fetching || !active || AppState.currentState !== "active") return;
        fetching = true;
        try {
          if (!person) person = await claimService.contact(claim.id);
          if (!active) return;
          setContact(person);
          const data = await messageService.conversation(
            claim.item_id,
            person.id,
          );
          if (active) {
            setMessages(data.messages || []);
            setError("");
          }
        } catch (e) {
          if (active) setError(e.message);
        } finally {
          fetching = false;
          if (active) setLoading(false);
        }
      }
      refreshRef.current = refresh;
      refresh();
      const timer = setInterval(refresh, 3000);
      const listener = AppState.addEventListener("change", (v) => {
        if (v === "active") refresh();
      });
      return () => {
        active = false;
        clearInterval(timer);
        listener.remove();
        refreshRef.current = null;
      };
    }, [claim.id, claim.item_id]),
  );
  async function send() {
    if (sendingRef.current || !text.trim() || !contact) return;
    sendingRef.current = true;
    setSending(true);
    setError("");
    try {
      const message = await messageService.send(
        claim.item_id,
        contact.id,
        text.trim(),
      );
      setText("");
      setMessages((old) =>
        old.some((m) => m.id === message.id) ? old : [...old, message],
      );
      await refreshRef.current?.();
    } catch (e) {
      setError(e.message);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }
  return (
    <SafeAreaView style={s.page} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1, padding: 16, gap: 10 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <Text style={s.h2}>{contact?.name || "Conversa com funcionário"}</Text>
        <Text style={s.muted}>{claim.item?.title}</Text>
        <Button
          title="Atualizar mensagens"
          secondary
          onPress={() => refreshRef.current?.()}
        />
        {loading && <ActivityIndicator />}
        <Feedback error={error} />
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ gap: 12, paddingVertical: 14, flexGrow: 1 }}
          onContentSizeChange={() =>
            list.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={s.muted}>
                Inicie a conversa. Envie uma mensagem para começar.
              </Text>
            ) : null
          }
          renderItem={({ item: m }) => (
            <View
              style={{
                alignSelf: m.sender_id === user.id ? "flex-end" : "flex-start",
                maxWidth: "88%",
                borderRadius: 18,
                padding: 14,
                backgroundColor:
                  m.sender_id === user.id ? "#DCEBFF" : "#FFFFFF",
              }}
            >
              <Text style={s.text}>{m.content}</Text>
              <Text style={[s.muted, { fontSize: 11, marginTop: 6 }]}>
                {dateLabel(m.created_at)}
              </Text>
            </View>
          )}
        />
        <Field
          label="Mensagem"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={5000}
        />
        <Button
          title="Enviar mensagem"
          busy={sending}
          disabled={!text.trim() || !contact}
          onPress={send}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
