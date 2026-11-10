const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { load } = require("./helpers.cjs");
const v = load("src/utils/validation.js");
test("CPF: máscara, dígitos verificadores, repetidos e tamanho", () => {
  assert.equal(v.maskCPF("52998224725"), "529.982.247-25");
  assert.equal(v.digits("529.982.247-25"), "52998224725");
  assert.ok(v.validCPF("529.982.247-25"));
  for (const bad of ["11111111111", "52998224724", "123", ""])
    assert.equal(v.validCPF(bad), false);
});
test("datas locais não aceitam overflow nem hora inválida", () => {
  for (const d of ["31/02/2026 14:00", "01/01/2026 25:00", "2026-01-01"])
    assert.throws(() => v.parseLocalDate(d));
  assert.equal(
    v.localDate(v.parseLocalDate("07/11/2026 14:30")),
    "07/11/2026 14:30",
  );
});
const form = {
  title: "Mochila",
  description: "Mochila preta de tecido",
  category_id: 2,
  location_name: "Bloco C",
  secret_details: "Bolso vermelho",
  event_date: "07/11/2026 14:30",
  height_cm: "30,5",
  width_cm: "",
};
test("payload do objeto converte medidas e campos opcionais", () => {
  const data = v.itemPayload(form);
  assert.equal(data.height_cm, 30.5);
  assert.equal(data.width_cm, null);
  assert.equal(data.category_id, 2);
  assert.ok(data.event_date.endsWith("Z"));
});
test("validação impede submissões incompletas", () => {
  for (const bad of [
    { title: "ab" },
    { description: "curta" },
    { category_id: null },
    { location_name: "" },
    { height_cm: "abc" },
    { height_cm: "-1" },
    { width_cm: "0" },
  ])
    assert.throws(() => v.itemPayload({ ...form, ...bad }));
});
