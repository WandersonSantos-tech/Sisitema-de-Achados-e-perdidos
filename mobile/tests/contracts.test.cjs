const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { load } = require("./helpers.cjs"),
  contract = require("./fixtures/api-contract.json");
test("cada rota usada no aplicativo existe no Swagger Azure capturado", async () => {
  const calls = [];
  const api = {
    apiRequest: async (p, o = {}) => {
      calls.push([p, o.method || "GET"]);
      return p === "/auth/login"
        ? { access_token: "jwt" }
        : { role: "USER", is_active: true };
    },
    storage: { setToken: async () => {}, clear: async () => {} },
  };
  const { authService: a } = load("src/services/authService.js", {
      "./api": api,
    }),
    d = load("src/services/dataService.js", { "./api": api });
  await a.login("u@example.com", "12345678");
  await a.register({});
  await a.forgotPassword("u@example.com");
  await a.resetPassword("token", "12345678");
  await d.categories();
  await d.itemService.list();
  await d.itemService.get("id");
  await d.itemService.matches("id");
  await d.itemService.create({});
  await d.itemService.update("id", {});
  await d.itemService.remove("id");
  await d.itemService.upload("id", []);
  await d.claimService.list();
  await d.claimService.create("id", "proof");
  await d.claimService.contact("id");
  await d.messageService.conversation("id", "staff");
  await d.messageService.send("id", "staff", "Hello");
  await d.notificationService.list();
  await d.notificationService.read("id");
  await d.reviewService.list("id");
  await d.reviewService.create("id", {});
  await d.reviewService.user("id");
  for (const [p, method] of calls) {
    const pathname = "/api/v1" + p.split("?")[0];
    const match = Object.entries(contract.paths).find(
      ([route, methods]) =>
        new RegExp("^" + route.replace(/\{[^}]+\}/g, "[^/]+") + "$").test(
          pathname,
        ) && methods.includes(method.toLowerCase()),
    );
    assert.ok(match, `${method} ${pathname} ausente no contrato`);
  }
});
test("CPF e limites dos formulários correspondem aos schemas publicados", () => {
  assert.ok(contract.schemas.UserCreate.required.includes("cpf"));
  assert.equal(contract.schemas.UserCreate.properties.password.minLength, 8);
  assert.equal(contract.schemas.ItemCreate.properties.title.minLength, 3);
  assert.equal(
    contract.schemas.ItemCreate.properties.description.minLength,
    10,
  );
  assert.equal(
    contract.schemas.MessageCreate.properties.content.maxLength,
    5000,
  );
  assert.equal(contract.schemas.ReviewCreate.properties.rating.maximum, 5);
});
