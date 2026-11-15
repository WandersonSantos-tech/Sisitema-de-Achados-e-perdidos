const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers.cjs");

test("mobile: desafio 2FA permanece fora do armazenamento de sessão", async () => {
  const calls = [],
    tokens = [];
  const service = load("src/services/authService.js", {
    "./api": {
      storage: { setToken: async (t) => tokens.push(t), clear: async () => {} },
      apiRequest: async (path, options) => {
        calls.push({ path, options });
        if (path === "/auth/login")
          return { requires_2fa: true, challenge_token: "challenge" };
        if (path === "/auth/2fa/verify") return { access_token: "full-token" };
        return { role: "USER", is_active: true };
      },
    },
  }).authService;
  const pending = await service.login("user@test.com", "password123");
  assert.equal(pending.challenge_token, "challenge");
  assert.equal(tokens.length, 0);
  await service.login(
    "user@test.com",
    "password123",
    pending.challenge_token,
    "123456",
  );
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    challenge_token: "challenge",
    code: "123456",
  });
  assert.equal(calls[1].options.public, true);
  assert.deepEqual(tokens, ["full-token"]);
});

test("web: desafio 2FA não é salvo como token JWT de acesso", async () => {
  const saved = {},
    calls = [];
  const service = load(
    "../frontend/src/services/authService.js",
    {
      "./api": {
        apiRequest: async (path, options) => {
          calls.push({ path, options });
          if (path === "/auth/login")
            return { requires_2fa: true, challenge_token: "challenge" };
          if (path === "/auth/2fa/verify")
            return { access_token: "full-token" };
          return { role: "ADMIN", is_active: true };
        },
      },
    },
    {
      localStorage: {
        setItem: (k, v) => (saved[k] = v),
        getItem: (k) => saved[k],
        removeItem: (k) => delete saved[k],
      },
    },
  ).authService;
  await service.login("admin@test.com", "password123");
  assert.equal(saved.access_token, undefined);
  const result = await service.login(
    "admin@test.com",
    "password123",
    "challenge",
    "123456",
  );
  assert.equal(result.usuario.role, "ADMIN");
  assert.equal(saved.access_token, "full-token");
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    challenge_token: "challenge",
    code: "123456",
  });
});
