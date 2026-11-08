# OndeTá — mobile do usuário (SDK 58)

Atualização: esta versão corrige o erro de incompatibilidade com Expo Go SDK 58 no iPhone. Renomeie a pasta mobile anterior para mobile-antigo e coloque a nova mobile no lugar, sem copiar node_modules ou .expo antigos. No terminal da nova pasta, execute npm ci e npx expo start --clear.

Aplicativo nativo React Native/Expo, sem WebView. Esta entrega altera somente `mobile/`. O login, o cadastro e a página inicial existentes foram aproveitados; as outras telas foram integradas e completadas. A interface conserva a paleta azul/marinho, cartões, botões e espaçamentos do projeto. A equivalência visual exata ainda precisa ser conferida em aparelhos.

## Abrir no Windows e no Expo Go

1. Extraia o ZIP. Ele contém uma pasta `mobile/` completa. No projeto original, substitua a pasta `mobile/` pela entregue. Não copie `node_modules` de uma instalação antiga.
2. Abra a pasta do projeto no VS Code. Use Node.js 22.13+ ou 24.3+ (Node 24.22.1 foi usado aqui).
3. No terminal do VS Code, a partir da pasta que contém `mobile`, execute:

```powershell
cd mobile
npm install
npx expo start
```

O terminal mostra o endereço e o QR Code. Se você abriu diretamente a pasta `mobile` no VS Code, comece por `npm install`.

4. Use uma versão do Expo Go compatível com SDK 58. Se o Expo solicitar identificação, execute `npx expo login` no computador e entre com a mesma conta Expo no Expo Go. Essa conta Expo é diferente da sua conta OndeTá.
5. Conecte computador e celular à mesma rede Wi-Fi. No Android, abra o leitor de QR Code do Expo Go; no iPhone, leia o QR Code com a Câmera e abra no Expo Go.
6. Entre com e-mail e senha de uma conta **USER** existente no OndeTá. Não há conta ou senha de teste embutida. Contas ADMIN e COLABORADOR recebem recusa de acesso.

Se a conexão local falhar, encerre o servidor com Ctrl+C e execute:

```powershell
npx expo start --tunnel
```

Aguarde o novo QR Code e leia-o novamente. O túnel exige acesso à internet no computador e no celular. O pacote do túnel está nas dependências. Para limpar o cache do Metro:

```powershell
npx expo start --clear
```

Referências: [atualização do SDK](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) e [incompatibilidade de versão do Expo Go](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/).

## API e segurança

A configuração padrão já aponta para a API real:

```text
https://api-ondeta-5170584.wonderfulstone-40977343.canadacentral.azurecontainerapps.io/api/v1
```

Não é necessário criar `.env`. Se precisar trocar de ambiente, copie `.env.example` para `.env`, ajuste `EXPO_PUBLIC_API_URL` e reinicie o Expo com `--clear`. A variável precisa incluir `/api/v1` e não pode conter segredos.

O JWT fica no `expo-secure-store`. A sessão é recuperada consultando `/auth/me`. Uma resposta 401 em chamada autenticada remove o token e volta para o login. Falhas de rede e de tempo limite mostram uma mensagem e permitem nova tentativa. Não há senha armazenada, logs de tokens, mocks ou dados fictícios na aplicação.

## Recursos implementados

- Login exclusivo para USER ativo, mostrar/ocultar senha, cadastro com nome, CPF validado e mascarado, e-mail, telefone opcional, senha mínima e confirmação. Erros de CPF/e-mail duplicados vêm da API.
- Recuperação e redefinição de senha. Em “Esqueci minha senha”, solicite o e-mail; depois use “Já tenho o código de recuperação”. Copie o valor de `token` do link recebido para o campo de código. O link gerado pelo backend continua apontando para a versão web; não foram alterados domínio, backend ou e-mail para criar links universais do aplicativo.
- Recuperação de sessão, bloqueio da navegação privada e logout.
- Início com atividade real, contador de avisos e menu para todos os fluxos.
- Meus itens com consulta de todas as páginas, pesquisa local em título/descrição/local e filtros de categoria/status.
- Cadastro de objeto perdido com categoria da API, descrição, características protegidas, local, data/hora e medidas opcionais.
- Seleção de até três fotos, conversão para JPG, validação de 5 MB, prévia, remoção antes do cadastro e upload multipart. O salvamento do item e o upload são etapas separadas: se uma foto falhar, o item salvo é preservado e pode ser aberto para conferir as imagens e enviar as faltantes sem duplicar o registro.
- Detalhes, galeria ampliável, adição de fotos faltantes, edição e exclusão com confirmação. Correspondências visíveis bloqueiam edição/exclusão; o backend continua verificando outras solicitações vinculadas e devolvendo 409 quando necessário.
- Correspondências recebidas, manuais ou automáticas, seleção do registro, percentual e dados disponíveis no contrato, detalhes e envio de comprovação. Dados protegidos da resposta permanecem protegidos; não são buscados por rotas administrativas.
- Solicitações paginadas, descrição, fotos, comprovação, status, agendamento e data de devolução.
- Conversa vinculada à solicitação: contato resolvido pela API, histórico, envio e atualização a cada três segundos enquanto a tela está em foco e o app está ativo. O polling é encerrado ao sair da tela. A primeira mensagem segue a regra de negociação do servidor.
- Notificações paginadas, leitura persistida e navegação para solicitações ou item conforme o tipo.
- Avaliação após a devolução, notas de 1 a 5, comentário e consulta de avaliações; conta com dados reais, avaliações recebidas e central de ajuda.

## Limites do perfil e dependências externas

O cadastro de **objeto encontrado**, envio administrativo de correspondências, início administrativo de negociação, agendamento e registro/assinatura da retirada usam permissões de funcionário no backend. Não são controles do usuário comum. O usuário acompanha o agendamento e a devolução e conversa com a equipe. Essas ações administrativas não foram incluídas.

Não existe endpoint de confirmação em dois fatores do usuário no projeto fornecido. Não foi criada uma simulação de 2FA. As assinaturas do fluxo web são registradas pelo funcionário; o mobile não chama os endpoints restritos.

A disponibilidade das fotos depende do serviço de imagens configurado na Azure. Imagens indisponíveis recebem mensagem; nenhuma mudança de armazenamento ou infraestrutura foi feita.

## Verificações reproduzíveis

```powershell
npm ci
npm test
npm run check
npx expo install --check
npx expo export --platform android --platform ios --output-dir dist/native
```

A atualização para SDK 58 passou por instalação limpa, **22 testes automatizados**, **20/20 verificações do Expo Doctor**, verificação de sintaxe/imports, alinhamento de dependências e geração de bundles Android e iOS. Metro iniciou durante a geração dos bundles. Os testes usam mocks apenas no ambiente de testes; os testes de tela são renderizações em Node, sem componentes nativos reais. O aviso de depreciação do react-test-renderer não é uma falha dos testes.

Consulte [VALIDACAO.md](VALIDACAO.md) para evidências, limites e roteiro de teste, e [MATRIZ_WEB_MOBILE.md](MATRIZ_WEB_MOBILE.md) para a comparação funcional.

**Não houve execução em celular ou emulador. Não foram usados login real, upload, chat ou alterações no banco de produção como testes. Portanto, não está certificada a equivalência visual/funcional completa em dispositivo.**
