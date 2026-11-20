const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { load } = require("./helpers.cjs");
test("login exige USER ativo e limpa token após falha de perfil ou papel", async () => {
  for (const profile of [
    { role: "ADMIN", is_active: true },
    { role: "COLABORADOR", is_active: true },
    { role: "USER", is_active: false },
    null,
  ]) {
    let token = null;
    const api = {
      storage: {
        setToken: async (v) => {
          token = v;
        },
        clear: async () => {
          token = null;
        },
      },
      apiRequest: async (endpoint) => {
        if (endpoint === "/auth/login") return { access_token: "abc" };
        if (profile === null) throw new Error("Sem conexão");
        return profile;
      },
    };
    const { authService } = load("src/services/authService.js", {
      "./api": api,
    });
    await assert.rejects(authService.login("user@example.com", "senha"));
    assert.equal(token, null);
  }
});
test("login e registro usam contrato JSON real", async () => {
  const calls = [];
  const { authService } = load("src/services/authService.js", {
    "./api": {
      storage: { setToken: async () => {}, clear: async () => {} },
      apiRequest: async (p, o) => {
        calls.push([p, o]);
        return p === "/auth/login"
          ? { access_token: "jwt" }
          : { role: "USER", is_active: true };
      },
    },
  });
  await authService.login(" user@example.com ", "12345678");
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    email: "user@example.com",
    password: "12345678",
  });
  assert.equal(calls[1][0], "/auth/me");
  await authService.register({ cpf: "52998224725" });
  assert.equal(JSON.parse(calls[2][1].body).cpf, "52998224725");
});
test("serviços usam rotas do Swagger publicado e paginação completa", async () => {
  const calls = [];
  const {
    itemService,
    claimService,
    messageService,
    reviewService,
    notificationService,
    allLostItems,
  } = load("src/services/dataService.js", {
    "./api": {
      apiRequest: async (p, o) => {
        calls.push([p, o]);
        if (p.startsWith("/items?page=1"))
          return { items: [{ id: "a" }], total: 2 };
        if (p.startsWith("/items?page=2"))
          return { items: [{ id: "b" }], total: 2 };
        return {};
      },
    },
  });
  const items = await allLostItems();
  assert.equal(items.length, 2);
  await itemService.create({ title: "x" });
  assert.equal(JSON.parse(calls.at(-1)[1].body).type, "PERDIDO");
  await claimService.create("found", "Detalhes");
  assert.equal(calls.at(-1)[0], "/claims/items/found/claims");
  await claimService.contact("c");
  assert.equal(calls.at(-1)[0], "/messages/claims/c/contact");
  await messageService.send("i", "staff", "Olá");
  assert.deepEqual(JSON.parse(calls.at(-1)[1].body), {
    receiver_id: "staff",
    content: "Olá",
  });
  await reviewService.create("i", { rating: 5 });
  assert.equal(calls.at(-1)[0], "/items/i/reviews");
  await notificationService.read("n");
  assert.equal(calls.at(-1)[1].method, "PATCH");
});
