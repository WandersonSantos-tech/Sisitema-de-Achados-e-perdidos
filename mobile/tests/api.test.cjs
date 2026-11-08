const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { load } = require("./helpers.cjs");
function client(fetch) {
  let token = "jwt",
    expired = 0;
  const secure = {
    getItemAsync: async () => token,
    setItemAsync: async (_, v) => {
      token = v;
    },
    deleteItemAsync: async () => {
      token = null;
    },
  };
  const api = load(
    "src/services/api.js",
    { "expo-secure-store": secure },
    { fetch },
  );
  api.setSessionExpiredHandler(() => expired++);
  return { api, token: () => token, expired: () => expired };
}
const res = (status, data) => ({
  ok: status < 400,
  status,
  text: async () => (data === undefined ? "" : JSON.stringify(data)),
});
test("JWT em chamadas privadas, nunca em login público", async () => {
  const calls = [];
  const { api } = client(async (u, o) => {
    calls.push({ u, o });
    return res(200, { ok: true });
  });
  await api.apiRequest("/items");
  await api.apiRequest("/auth/login", { public: true });
  assert.equal(calls[0].o.headers.Authorization, "Bearer jwt");
  assert.equal(calls[1].o.headers.Authorization, undefined);
  assert.ok(calls[0].u.startsWith("https://"));
});
test("401 invalida sessão privada e informa o contexto", async () => {
  const c = client(async () => res(401, { detail: "Sessão inválida" }));
  await assert.rejects(c.api.apiRequest("/items"), /Sessão inválida/);
  assert.equal(c.token(), null);
  assert.equal(c.expired(), 1);
});
test("login inválido não dispara expiração da sessão", async () => {
  const c = client(async () => res(401, { detail: "Credenciais inválidas" }));
  await assert.rejects(
    c.api.apiRequest("/auth/login", { public: true }),
    /Credenciais inválidas/,
  );
  assert.equal(c.expired(), 0);
});
test("FormData preserva boundary gerado pelo fetch; DELETE aceita 204", async () => {
  let headers;
  const { api } = client(async (_, o) => {
    headers = o.headers;
    return res(204);
  });
  assert.equal(await api.apiRequest("/items/1", { method: "DELETE" }), null);
  await api.apiRequest("/items/1/images", {
    method: "POST",
    body: new FormData(),
  });
  assert.equal(headers["Content-Type"], undefined);
});
test("erros 422, CPF duplicado e servidor não JSON são legíveis", async () => {
  let response = res(422, {
    detail: [{ loc: ["body", "cpf"], msg: "CPF inválido" }],
  });
  const { api } = client(async () => response);
  await assert.rejects(
    api.apiRequest("/auth/register", { public: true }),
    /cpf: CPF inválido/,
  );
  response = res(409, { detail: "CPF já cadastrado" });
  await assert.rejects(
    api.apiRequest("/auth/register", { public: true }),
    /CPF já cadastrado/,
  );
  response = {
    ok: false,
    status: 503,
    text: async () => "<html>bad gateway</html>",
  };
  await assert.rejects(api.apiRequest("/items"), /HTTP 503/);
});
test("falhas de rede e timeout preservam mensagem útil", async () => {
  let kind = "network";
  const { api } = client(async () => {
    if (kind === "network") throw new Error("fetch failed");
    const e = new Error();
    e.name = "AbortError";
    throw e;
  });
  await assert.rejects(api.apiRequest("/items"), /conectar/);
  kind = "timeout";
  await assert.rejects(api.apiRequest("/items"), /demorou/);
});
test("URLs de imagens: Azure, relativa e URI local", () => {
  const { api } = client(() => {});
  assert.equal(
    api.imageURL("https://blob.example/a.jpg"),
    "https://blob.example/a.jpg",
  );
  assert.equal(api.imageURL("file:///photo.jpg"), "file:///photo.jpg");
  assert.ok(api.imageURL("/uploads/a.jpg").endsWith(".io/uploads/a.jpg"));
  assert.equal(api.imageURL(null), null);
});
