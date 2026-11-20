import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { reviewService } from "../services/dataService";
import { Button, Feedback, Field, s } from "./UI";
export default function ReviewForm({ itemId }) {
  const [rating, setRating] = useState(5),
    [comment, setComment] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [reviews, setReviews] = useState(null);
  const running = useRef(false);
  async function send() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await reviewService.create(itemId, {
        rating,
        comment: comment.trim() || null,
      });
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }
  async function list() {
    setError("");
    try {
      setReviews(await reviewService.list(itemId));
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.h2}>Avaliar devolução</Text>
      <View style={s.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            title={`${n} ★`}
            secondary={rating !== n}
            disabled={sent || busy}
            onPress={() => setRating(n)}
          />
        ))}
      </View>
      <Field
        label="Comentário (opcional)"
        value={comment}
        onChangeText={setComment}
        maxLength={1000}
        multiline
        editable={!sent && !busy}
      />
      <Feedback error={error} />
      {sent && (
        <Text accessibilityRole="text" style={s.text}>
          Avaliação enviada.
        </Text>
      )}
      <Button
        title="Enviar avaliação"
        busy={busy}
        disabled={sent}
        onPress={send}
      />
      <Button title="Ver avaliações" secondary onPress={list} />
      {reviews &&
        (!reviews.length ? (
          <Text style={s.muted}>Nenhuma avaliação cadastrada.</Text>
        ) : (
          reviews.map((r) => (
            <Text key={r.id} style={s.text}>
              {r.rating}/5 · {r.comment || "Sem comentário"}
            </Text>
          ))
        ))}
    </View>
  );
}
