import React, { useCallback, useRef, useState } from "react";
import { Alert, Modal, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  allLostItems,
  itemService,
  claimService,
} from "../../services/dataService";
import {
  Button,
  Feedback,
  Field,
  Page,
  Photo,
  s,
  dateLabel,
} from "../../components/UI";
export default function CorrespondenciasScreen({ navigation, route }) {
  const [items, setItems] = useState([]),
    [chosen, setChosen] = useState(route.params?.itemId || null),
    [matches, setMatches] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [proof, setProof] = useState(""),
    [busy, setBusy] = useState(false),
    [modalError, setModalError] = useState("");
  const chosenRef = useRef(chosen);
  const request = useRef(0),
    sending = useRef(false);
  async function select(id) {
    chosenRef.current = id;
    setChosen(id);
    setLoading(true);
    setError("");
    setMatches([]);
    const seq = ++request.current;
    try {
      const res = await itemService.matches(id);
      if (seq === request.current)
        setMatches(
          [...res.items].sort(
            (a, b) => b.similarity_score - a.similarity_score,
          ),
        );
    } catch (e) {
      if (seq === request.current) setError(e.message);
    } finally {
      if (seq === request.current) setLoading(false);
    }
  }
  const load = useCallback(async (requestedId) => {
    setLoading(true);
    setError("");
    try {
      const list = await allLostItems();
      setItems(list);
      const preferred =
        typeof requestedId === "string" ? requestedId : chosenRef.current;
      const id = list.some((i) => i.id === preferred) ? preferred : list[0]?.id;
      if (id) await select(id);
      else {
        setMatches([]);
        setLoading(false);
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load(route.params?.itemId);
    }, [load, route.params?.itemId]),
  );
  async function claim() {
    if (sending.current) return;
    if (!proof.trim()) {
      setModalError("Descreva por que o objeto é seu.");
      return;
    }
    sending.current = true;
    setBusy(true);
    setModalError("");
    try {
      await claimService.create(selected.matched_item_id, proof.trim());
      setSelected(null);
      Alert.alert(
        "Solicitação enviada",
        "Acompanhe a análise e converse com a equipe em Minhas solicitações.",
        [
          {
            text: "Ver solicitações",
            onPress: () => navigation.navigate("Solicitacoes"),
          },
        ],
      );
    } catch (e) {
      setModalError(e.message);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  return (
    <Page
      title="Correspondências"
      navigation={navigation}
      refreshing={loading}
      onRefresh={load}
    >
      <Text style={s.muted}>
        Possíveis correspondências encaminhadas pela equipe para seus objetos
        perdidos.
      </Text>
      <View style={s.row}>
        {items.map((i) => (
          <Button
            key={i.id}
            title={i.title}
            secondary={chosen !== i.id}
            onPress={() => select(i.id)}
          />
        ))}
      </View>
      <Feedback
        loading={loading}
        error={error}
        onRetry={load}
        empty={
          !matches.length
            ? "Nenhuma correspondência disponível para este objeto."
            : null
        }
      />
      {matches.map((m) => (
        <View style={s.card} key={m.matched_item_id}>
          <Photo uri={m.matched_item_image_url} title={m.matched_item_title} />
          <Text style={s.badge}>
            {m.is_manual
              ? "Correspondência manual"
              : `${Math.round(m.similarity_score)}% de compatibilidade`}
          </Text>
          <Text style={s.h2}>{m.matched_item_title}</Text>
          <Text style={s.text}>{m.matched_item_description}</Text>
          <Text style={s.muted}>
            {m.matched_item_location_name} ·{" "}
            {dateLabel(m.matched_item_event_date)}
          </Text>
          <Button
            title="Ver detalhes / Esse objeto é meu"
            onPress={() => {
              setSelected(m);
              setProof("");
              setModalError("");
            }}
          />
        </View>
      ))}
      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setSelected(null);
        }}
      >
        <Page title="Confirmar correspondência">
          <Photo
            uri={selected?.matched_item_image_url}
            title={selected?.matched_item_title}
          />
          <Text style={s.h2}>{selected?.matched_item_title}</Text>
          <Text style={s.text}>{selected?.matched_item_description}</Text>
          <Text style={s.muted}>
            {selected?.matched_item_location_name} ·{" "}
            {dateLabel(selected?.matched_item_event_date)}
          </Text>
          {selected &&
            !selected.is_manual &&
            Object.entries(selected.score_details || {}).map(([key, value]) => (
              <Text key={key} style={s.muted}>
                {{
                  category_score: "Categoria",
                  textual_similarity_score: "Semelhança textual",
                  temporal_proximity_score: "Proximidade de data",
                  geographical_proximity_score: "Proximidade de local",
                }[key] || key}
                : {Number(value).toFixed(1)}%
              </Text>
            ))}
          <Field
            label="Informações que comprovam que o objeto é seu"
            value={proof}
            onChangeText={setProof}
            multiline
          />
          <Feedback error={modalError} />
          <Button title="Enviar solicitação" busy={busy} onPress={claim} />
          <Button
            title="Fechar"
            secondary
            disabled={busy}
            onPress={() => setSelected(null)}
          />
        </Page>
      </Modal>
    </Page>
  );
}
