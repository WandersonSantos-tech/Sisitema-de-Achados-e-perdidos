const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  React = require("react"),
  Renderer = require("react-test-renderer"),
  { load } = require("./helpers.cjs");
global.IS_REACT_ACT_ENVIRONMENT = true;
const native = {
  ActivityIndicator: "ActivityIndicator",
  Alert: { alert: () => {} },
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Platform: { OS: "ios" },
  ScrollView: "ScrollView",
  StyleSheet: { create: (v) => v },
  Text: "Text",
  TextInput: "TextInput",
  TouchableOpacity: "TouchableOpacity",
  View: "View",
};
const safe = {
  "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
};
const ui = {
  Page: "Page",
  Field: "Field",
  Feedback: "Feedback",
  Button: "Button",
  Photo: "Photo",
  s: {},
};
async function render(Component, props = {}) {
  let tree;
  await Renderer.act(async () => {
    tree = Renderer.create(React.createElement(Component, props));
  });
  return tree;
}
async function change(tree, type, index, value) {
  await Renderer.act(async () =>
    tree.root.findAllByType(type)[index].props.onChangeText(value),
  );
}
const unmount = async (t) => Renderer.act(async () => t.unmount());
test("tela de cadastro envia CPF sem máscara, telefone opcional e confirmação", async () => {
  let payload;
  const C = load("src/screens/auth/CadastroScreen.jsx", {
    "react-native": native,
    ...safe,
    "../../services/authService": {
      authService: {
        register: async (p) => {
          payload = p;
        },
      },
    },
    "../../utils/validation": load("src/utils/validation.js"),
  }).default;
  const tree = await render(C, { navigation: { goBack() {}, navigate() {} } });
  for (const [i, v] of [
    "Nome Teste",
    "529.982.247-25",
    "nome@example.com",
    "",
    "12345678",
    "12345678",
  ].entries())
    await change(tree, "TextInput", i, v);
  await Renderer.act(async () =>
    tree.root.findAllByType("TouchableOpacity").at(-1).props.onPress(),
  );
  assert.equal(payload.cpf, "52998224725");
  assert.equal(payload.phone, null);
  assert.equal(payload.name, "Nome Teste");
  await unmount(tree);
});
test("login usa contexto da sessão sem navegação manual para área protegida", async () => {
  let args;
  const C = load("src/screens/auth/LoginScreen.jsx", {
    "react-native": native,
    ...safe,
    "../../contexts/AuthContext": {
      useAuth: () => ({
        login: async (...v) => {
          args = v;
        },
        error: "",
      }),
    },
  }).default;
  const tree = await render(C, { navigation: { navigate() {} } });
  await change(tree, "TextInput", 0, "user@example.com");
  await change(tree, "TextInput", 1, "12345678");
  await Renderer.act(async () =>
    tree.root
      .findAllByType("TouchableOpacity")
      .find((b) => b.props.accessibilityLabel === "Entrar")
      .props.onPress(),
  );
  assert.deepEqual(args, ["user@example.com", "12345678"]);
  await unmount(tree);
});
test("registro de objeto integra categorias reais e salva dados válidos", async () => {
  let payload;
  const C = load("src/screens/usuario/RegistrarItemScreen.jsx", {
    "react-native": native,
    "expo-image-picker": {},
    "expo-image-manipulator": {},
    "../../services/dataService": {
      categories: async () => [{ id: 2, name: "Mochilas" }],
      itemService: {
        create: async (p) => {
          payload = p;
          return { id: "saved" };
        },
      },
    },
    "../../components/UI": ui,
    "../../utils/validation": load("src/utils/validation.js"),
  }).default;
  const tree = await render(C, { navigation: { replace() {} }, route: {} });
  const values = [
    "Mochila",
    "Mochila preta de tecido",
    "Bloco C",
    "07/11/2026 14:30",
    "30",
    "20",
    "Bolso vermelho",
  ];
  for (const [i, v] of values.entries()) await change(tree, "Field", i, v);
  await Renderer.act(async () =>
    tree.root
      .findAllByType("Button")
      .find((b) => b.props.title === "Mochilas")
      .props.onPress(),
  );
  await Renderer.act(async () =>
    tree.root
      .findAllByType("Button")
      .find((b) => b.props.title === "Registrar objeto")
      .props.onPress(),
  );
  assert.equal(payload.category_id, 2);
  assert.equal(payload.height_cm, 30);
  assert.equal(payload.secret_details, "Bolso vermelho");
  assert.ok(
    tree.root
      .findAllByType("Button")
      .some((b) => b.props.title === "Abrir objeto salvo"),
  );
  await unmount(tree);
});
test("navegação separa telas públicas e autenticadas e mostra bootstrap", async () => {
  const fs = require("node:fs"),
    parser = require("@babel/parser");
  const ast = parser.parse(
    fs.readFileSync("src/navigation/AppNavigator.jsx", "utf8"),
    { sourceType: "module", plugins: ["jsx"] },
  );
  const mocks = {};
  for (const node of ast.program.body)
    if (
      node.type === "ImportDeclaration" &&
      node.source.value.startsWith("../screens")
    )
      mocks[node.source.value] = { default: () => null, __esModule: true };
  let user = null,
    loading = false;
  Object.assign(mocks, {
    "react-native": native,
    "@react-navigation/native": { NavigationContainer: "NavigationContainer" },
    "@react-navigation/native-stack": {
      createNativeStackNavigator: () => ({
        Navigator: "Navigator",
        Group: "Group",
        Screen: "Screen",
      }),
    },
    "../contexts/AuthContext": { useAuth: () => ({ user, loading }) },
  });
  const C = load("src/navigation/AppNavigator.jsx", mocks).default;
  let tree = await render(C);
  let names = tree.root.findAllByType("Screen").map((n) => n.props.name);
  assert.ok(names.includes("Login"));
  assert.ok(!names.includes("UsuarioHome"));
  await unmount(tree);
  user = { id: "u" };
  tree = await render(C);
  names = tree.root.findAllByType("Screen").map((n) => n.props.name);
  for (const name of [
    "UsuarioHome",
    "RegistrarItem",
    "MeusItens",
    "ItemDetalhe",
    "Correspondencias",
    "Solicitacoes",
    "Chat",
    "Notificacoes",
    "Perfil",
    "Ajuda",
  ])
    assert.ok(names.includes(name));
  assert.ok(!names.includes("Login"));
  await unmount(tree);
  loading = true;
  tree = await render(C);
  assert.equal(tree.root.findAllByType("Screen").length, 0);
  assert.equal(tree.root.findAllByType("ActivityIndicator").length, 1);
  await unmount(tree);
});
test("chat carrega contato, envia mensagem real ao serviço e limpa polling ao sair", async () => {
  let sent,
    interval,
    cleared = false,
    removed = false,
    messages = [];
  const C = load(
    "src/screens/usuario/ChatScreen.jsx",
    {
      "react-native": {
        ...native,
        FlatList: "FlatList",
        AppState: {
          currentState: "active",
          addEventListener: () => ({
            remove() {
              removed = true;
            },
          }),
        },
      },
      ...safe,
      "@react-navigation/native": {
        useFocusEffect: (fn) => React.useEffect(fn, [fn]),
      },
      "../../services/dataService": {
        claimService: {
          contact: async () => ({ id: "staff", name: "Equipe" }),
        },
        messageService: {
          conversation: async () => ({ messages }),
          send: async (item, user, content) => {
            sent = { item, user, content };
            const m = {
              id: "m1",
              sender_id: "u",
              content,
              created_at: "2026-11-07T12:00:00Z",
            };
            messages = [m];
            return m;
          },
        },
      },
      "../../contexts/AuthContext": { useAuth: () => ({ user: { id: "u" } }) },
      "../../components/UI": { ...ui, dateLabel: (v) => v },
    },
    {
      setInterval: (fn) => {
        interval = fn;
        return 5;
      },
      clearInterval: (id) => {
        assert.equal(id, 5);
        cleared = true;
      },
    },
  ).default;
  const tree = await render(C, {
    route: {
      params: {
        claim: { id: "claim", item_id: "found", item: { title: "Mochila" } },
      },
    },
  });
  assert.equal(typeof interval, "function");
  await change(tree, "Field", 0, "Olá, este objeto é meu.");
  await Renderer.act(async () =>
    tree.root
      .findAllByType("Button")
      .find((b) => b.props.title === "Enviar mensagem")
      .props.onPress(),
  );
  assert.deepEqual(sent, {
    item: "found",
    user: "staff",
    content: "Olá, este objeto é meu.",
  });
  assert.equal(tree.root.findByType("FlatList").props.data.length, 1);
  await unmount(tree);
  assert.ok(cleared && removed);
});
test("sessão persistida é recuperada e logout remove acesso", async () => {
  let current,
    deleted = false;
  const auth = load("src/contexts/AuthContext.jsx", {
    "../services/api": {
      storage: { getToken: async () => "jwt", clear: async () => {} },
      setSessionExpiredHandler: () => {},
    },
    "../services/authService": {
      getMe: async () => ({ id: "u", role: "USER", is_active: true }),
      logout: async () => {
        deleted = true;
      },
    },
  });
  function Probe() {
    current = auth.useAuth();
    return null;
  }
  const tree = await render(auth.AuthProvider, {
    children: React.createElement(Probe),
  });
  assert.equal(current.loading, false);
  assert.equal(current.user.id, "u");
  await Renderer.act(async () => current.logout());
  assert.equal(current.user, null);
  assert.ok(deleted);
  await unmount(tree);
});
