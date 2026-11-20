export const digits = (v) => String(v || "").replace(/\D/g, "");
export function maskCPF(v) {
  return digits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
export function validCPF(v) {
  const cpf = digits(v);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let size = 9; size <= 10; size++) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(cpf[i]) * (size + 1 - i);
    let n = (sum * 10) % 11;
    if ((n === 10 ? 0 : n) !== Number(cpf[size])) return false;
  }
  return true;
}
export function parseLocalDate(v) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(v);
  if (!m) throw new Error("Informe a data e hora: DD/MM/AAAA HH:MM.");
  const [, d, mo, y, h, mi] = m.map(Number),
    date = new Date(y, mo - 1, d, h, mi);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo - 1 ||
    date.getDate() !== d ||
    date.getHours() !== h ||
    date.getMinutes() !== mi
  )
    throw new Error("Data ou hora inválida.");
  return date.toISOString();
}
export function localDate(value = new Date()) {
  const d = new Date(value),
    p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function itemPayload(f) {
  if (f.title.trim().length < 3 || f.title.length > 150)
    throw new Error("Nome do objeto: entre 3 e 150 caracteres.");
  if (f.description.trim().length < 10)
    throw new Error("Descreva o objeto com pelo menos 10 caracteres.");
  if (!f.category_id) throw new Error("Selecione uma categoria.");
  if (!f.location_name.trim() || f.location_name.length > 255)
    throw new Error("Informe um local com até 255 caracteres.");
  const measure = (v) => {
    if (!String(v || "").trim()) return null;
    const n = Number(String(v).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0)
      throw new Error("As medidas devem ser números maiores que zero.");
    return n;
  };
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    category_id: Number(f.category_id),
    location_name: f.location_name.trim(),
    secret_details: f.secret_details.trim() || null,
    height_cm: measure(f.height_cm),
    width_cm: measure(f.width_cm),
    event_date: parseLocalDate(f.event_date),
  };
}
