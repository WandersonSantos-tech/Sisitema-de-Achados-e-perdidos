# Validação — 07/11/2026 — atualização SDK 58

Os testes locais e os bundles abaixo foram repetidos após migrar para SDK 58. As consultas de leitura à Azure são evidências da entrega anterior; não houve nova chamada autenticada ou escrita na atualização.

## Resultado observado

| Verificação | Resultado |
| --- | --- |
| npm ci, sem legacy-peer-deps | Passou, instalação limpa de 561 pacotes para SDK 58 |
| npm test | 22 testes passaram, 0 falhas |
| npm run check | 26 arquivos de aplicação com sintaxe e imports resolvidos |
| EXPO_OFFLINE=1 npx expo install --check | Dependencies are up to date; verificação local pelo mapa de versões do SDK, sem consulta remota |
| Expo export Android e iOS | Passou no SDK 58; bundles Hermes para as duas plataformas |
| npx expo-doctor@latest | 20/20 verificações passaram, sem problemas detectados |
| Metro SDK 58 | Inicializou durante a exportação Android/iOS; abertura no iPhone ainda depende de teste manual |
| GET /health na Azure | HTTP 200, serviço saudável |
| GET /openapi.json na Azure | HTTP 200, contrato de rotas/schemas lido |
| GET /api/v1/items sem token | HTTP 401 |
| GET /api/v1/auth/me sem token | HTTP 401 |
| GET /api/v1/categories sem token | HTTP 401 |
| Comparação SHA-256 fora de mobile | 11.178 arquivos conferidos, zero arquivos alterados/adicionados/removidos |

Dependências atualizadas de SDK 57 para SDK 58 para corresponder ao Expo Go informado no iPhone: Expo 58.0.23, React 19.3.0, React Native 0.88.1, ImagePicker ~58.0.10, ImageManipulator ~58.0.16, SecureStore ~58.0.2, StatusBar ~58.0.4, safe-area-context ~5.11.1 e screens ~4.30.1. O renderer dos testes também foi alinhado a React 19.3.0. O package-lock.json foi regenerado. A estrutura e os fluxos da aplicação foram preservados.

## O que os testes cobrem

CPF, máscara e dígitos verificadores; datas inválidas e conversão local/UTC; medidas e campos obrigatórios; JWT público/privado; tratamento de 401, 422, 409, 503 e falha de conexão/tempo limite; resposta 204; multipart sem Content-Type fixo; imagens absolutas/relativas/locais; rejeição a papéis de funcionário e usuário inativo; limpeza de token após erro de perfil; preenchimento do cadastro e registro de objeto; separação de rotas; restauração/logout; envio e atualização do chat e limpeza do polling. Rotas e limites dos schemas são comparados com uma captura do Swagger em tests/fixtures/api-contract.json.

As renderizações de tela usam React em Node com componentes nativos e serviços substituídos por mocks. Não testam aparência, SecureStore nativo, câmera/galeria, toque real, teclado ou conectividade do telefone. Não há mocks nos fluxos da aplicação.

## Roteiro de aceitação no celular

Use sua conta USER e registros adequados para homologação. A criação de contas, itens, fotos, mensagens e avaliações produz dados reais na API configurada; estas operações não foram executadas nesta entrega.

1. Abra no Expo Go e compare login, cadastro e início com a web na mesma largura. Confira notch, rolagem, fontes maiores e teclado em Android/iOS.
2. No cadastro, confira máscara de CPF, CPF inválido, senha curta e confirmação divergente. Use CPF/e-mail de homologação para testar criação; confira resposta de CPF duplicado.
3. Entre com sua conta USER. Feche e reabra o app para conferir a sessão. Teste erro de senha e recusa de conta de funcionário. Depois confira logout e impossibilidade de voltar às telas privadas.
4. Desative a conexão e tente atualizar listagens. Confira mensagem e nova tentativa. Confira também expiração de JWT em ambiente apropriado.
5. Registre um objeto perdido, escolhendo categoria real e informando todos os campos. Teste data inválida, medidas vazias/negativas e descrição curta.
6. Escolha até três fotos, remova uma antes do envio, salve e abra o registro. Confira conversão de imagens do iPhone, permissão negada e limite de 5 MB. Simule falha de upload em homologação e confira o item salvo antes de reenviar fotos faltantes.
7. Use pesquisa, filtros e atualização da lista; confira detalhes e ampliação das imagens. Edite um item sem correspondência. Teste excluir um registro de homologação, cancelando e depois confirmando a exclusão.
8. Com a equipe web, encaminhe correspondências automática e manual. Confira seleção do item e rótulos, proteção dos detalhes e bloqueio de edição/exclusão. Não utilize conta de funcionário no mobile.
9. Confira as solicitações criadas pelo encaminhamento; se precisar enviar comprovação, use a ação da correspondência. Uma solicitação já existente pode ser recusada pela API; o erro deve ser mostrado.
10. Abra a conversa. Confira histórico, envio, atualização entre web e celular e mudança de status na API. Tire o app de foco e retorne; confira atualização e ausência de polling após sair da conversa.
11. Pela equipe web, agende a retirada e conclua a devolução de homologação. No app, atualize solicitações e confira datas e status. Agendamento, assinatura e conclusão não são ações do USER.
12. Após returned_at, envie nota/comentário e consulte avaliações. Confira a regra de uma avaliação por usuário/item e a média em Minha conta.
13. Confira notificações em mais de uma página, abertura e persistência de leitura. Confira atualização do contador ao voltar ao início.
14. Teste recuperação por e-mail e redefinição com o token do link, sem divulgar esse código. O link recebido continua sendo web.
15. Confira Central de ajuda, todos os atalhos e navegação de retorno. Repita em tela pequena, tela maior e orientação horizontal.

## Pendências reais

- Validação manual em aparelhos Android/iOS, incluindo Expo Go, aparência em relação à web, permissões de fotos e comportamento de teclado.
- Testes autenticados de ponta a ponta com dados de homologação e participação da equipe no fluxo de correspondência/devolução.
- Entrega de e-mail e disponibilidade/persistência das imagens dependem dos serviços externos já configurados. Não foram alterados nesta tarefa.
- Link universal de recuperação e confirmação 2FA do usuário não possuem suporte configurado no backend/domínio fornecido. A recuperação existente continua disponível por token e pela web; não há simulação de 2FA.

Não houve deploy, alteração de infraestrutura, chamadas administrativas ou escrita em produção. O ZIP contém exclusivamente a pasta mobile, sem node_modules, caches, bundles temporários, credenciais ou arquivos das outras pastas.
