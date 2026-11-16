# Onde Tá — entrega das integrações locais

Data: 14/11/2026. As alterações estão no projeto original. Nenhum commit, push, exclusão de dados ou migration no PostgreSQL foi executado.

## Resultado e limites

O código de recuperação de senha e 2FA foi integrado aos fluxos web/mobile existentes. A etapa de assinatura simulada foi substituída por chamadas ao adaptador Dsgner existente, com confirmação externa obrigatória antes da devolução.

**A validação real do Dsgner permanece pendente.** Não há URL/chave configuradas e não foi possível identificar documentação oficial para o nome informado. O adaptador conserva o contrato existente no repositório; seus campos, autenticação, conteúdo de documento e estados precisam ser conferidos com o fornecedor. Não é correto considerar essa integração homologada. Os testes de Dsgner e SMTP utilizaram mocks; nenhum documento real foi enviado e nenhum e-mail real foi entregue.

O Docker não estava ativo. O `.env` local aponta para `db:5432` e `mailpit:1025`, nomes internos do Compose. Não foi possível validar persistência no PostgreSQL, entrega Mailpit/Brevo, nem aplicar migrations com segurança. Os testes de persistência utilizaram SQLite temporário. A nova migration tem um único head e foi testada em SQLite, incluindo cifragem de segredos existentes; isso não substitui sua execução no PostgreSQL.

O build web e a exportação Android passaram. Não houve teste visual em navegador, emulador ou aparelho; responsividade, console do navegador e interação em dispositivo ainda precisam de validação manual. As suítes completas ainda têm falhas em testes antigos, detalhadas abaixo. O projeto não está declarado integralmente homologado.

## O que mudou

### Recuperação de senha

- Reutilizados `forgot-password`, `reset-password`, serviço Brevo/SMTP e telas existentes.
- Token aleatório de 256 bits; só o SHA-256 e a expiração são persistidos. Validade de 15 minutos, uso único, bloqueio transacional na redefinição e substituição de solicitações anteriores.
- Resposta igual para contas existentes, inexistentes e inativas. Limites por origem e endereço solicitado, inclusive para endereços inexistentes.
- Senha continua armazenada pelo hash bcrypt existente. A confirmação é exibida pela tela; não foi adicionado outro tipo de e-mail.
- Link configurável em `PASSWORD_RESET_URL`; falha de entrega não revela a existência da conta. Falhas são registradas sem token ou conteúdo do e-mail.
- O envio genérico de e-mails foi desativado. O único consumidor de envio no aplicativo é a recuperação de senha.
- SMTP local permite TLS explicitamente desligado; autenticação SMTP deixou de ser executada duas vezes.

### 2FA

- Configuração gera segredo e QR Code, cifra o segredo com Fernet e só ativa após confirmação TOTP. Configuração pendente expira em dez minutos.
- Login com senha correta em conta com 2FA retorna desafio de cinco minutos, não JWT de acesso. `/auth/2fa/verify` conclui o login.
- Desafios são vinculados à conta/senha atual, persistidos por digest, consumidos uma vez e rejeitados pelas dependências de autenticação normais. Nova senha invalida desafios anteriores por vínculo ao hash da senha.
- Códigos já consumidos não podem ser reutilizados. Há limitação de tentativas por conta no login 2FA e no gerenciamento.
- Desativação exige senha atual e TOTP válido. Recuperar a senha não remove o segundo fator. Não existe bypass por e-mail ou remoção administrativa automática do 2FA.
- Web: campo adicional no login existente; configuração em `/seguranca`, acessível no perfil e no painel operacional. Rotas de usuário e configuração verificam a sessão completa.
- Mobile: desafio mantido em memória, login só grava JWT completo, configuração no perfil e QR Code SVG. Permanece exclusivo para `USER` ativo.
- Chave Fernet gerada no `.env` local ignorado pelo Git. Preserve-a em backup seguro: trocá-la sem migrar os segredos impede sua leitura.
- A migration cifra segredos legados e une as duas revisões finais existentes. Ela não foi aplicada ao banco configurado.

### Assinatura na devolução

- Mantidos reivindicação, participantes, funcionário responsável, agendamento, etapas, histórico e transição final para `DEVOLVIDO`.
- Removido o canvas de demonstração dessa etapa; o funcionário solicita assinatura, abre o link, consulta o estado e confirma a devolução após `signed`.
- Documento preparado no servidor com dados reais da reivindicação, objeto, solicitante, CPF, funcionário e retirada. O conteúdo textual JSON é o formato previsto pelo adaptador já existente; sua aceitação real precisa de confirmação do fornecedor.
- Estado e documento ficam em `claims.signature`, coluna existente, sem nova tabela ou fluxo paralelo. São registrados ID, hash, vínculo à reivindicação e horários.
- Reserva persistida antes da chamada externa e chave de idempotência evitam reenvio automático. Timeout deixa `reconciliation_required`; o funcionário pode informar o ID conferido no provedor, e o backend valida vínculo/hash antes de associá-lo.
- Documento emitido bloqueia alteração do agendamento. Estado pendente, expirado, cancelado, falho, desconhecido ou documento divergente não conclui a devolução. Não foi inventado um endpoint externo de cancelamento; cancelamento/expiração são consultados no provedor.
- Usuários web/mobile podem consultar e abrir a assinatura de suas próprias solicitações. Início e conclusão da devolução continuam restritos à equipe autorizada.
- Consultar o provedor exige correspondência de `id`, `external_id` e `metadata.document_hash`. Respostas fora desse contrato falham de forma segura. O cliente não pode apresentar desenho ou status como prova de assinatura.
- Os endpoints genéricos Dsgner foram desativados para impedir documentos arbitrários e consulta de IDs fora de uma devolução autorizada.

## Endpoints

Todos têm prefixo `/api/v1`.

| Método | Caminho | Uso |
|---|---|---|
| POST | `/auth/forgot-password` | Solicitar recuperação |
| POST | `/auth/reset-password` | Consumir token e alterar senha |
| POST | `/auth/login` | Login normal ou emissão de desafio 2FA |
| POST | `/auth/2fa/verify` | Consumir desafio e emitir JWT completo |
| GET | `/auth/me` | Sessão/perfil e estado de ativação 2FA |
| POST | `/security/2fa/setup` | Configuração pendente e QR Code |
| POST | `/security/2fa/verify` | Confirmar ativação |
| POST | `/security/2fa/disable` | Desativar com senha + TOTP |
| PATCH | `/claims/claims/{id}/pickup` | Agendamento existente |
| POST | `/claims/claims/{id}/signature` | Solicitar assinatura da devolução |
| GET | `/claims/claims/{id}/signature` | Consultar assinatura autorizada |
| POST | `/claims/claims/{id}/signature/reconcile` | Conciliar ID após envio incerto |
| POST | `/claims/claims/{id}/return` | Concluir após confirmação do provedor |

`/integrations/email/send`, `/integrations/dsgner/send-signature` e `/integrations/dsgner/status/{id}` retornam 410 para sessões autenticadas, orientando o uso dos fluxos específicos. `/security/2fa/health` e `/health` foram preservados.

## Testes executados

| Verificação | Resultado |
|---|---|
| Instalação do backend em `.venv` e `pip check` | Dependências instaladas; nenhuma incompatibilidade apontada |
| Importação FastAPI, rotas e compilação Python | Passaram via coleta/execução ASGI e `compileall` |
| Novos testes de segurança | 10 passaram |
| Regressão administrativa atualizada | Passou; fluxo de funcionário, objetos, correspondência manual, solicitações, chat, permissões, devolução e avaliações; Dsgner simulado |
| Suíte completa backend | 24 passaram, 20 falharam; detalhes em `backend/test-results-local.txt`; testes antigos de autenticação/objetos/permissões ainda falham por contratos desatualizados |
| `alembic heads` | `c20261114_auth` como único head |
| Teste da nova migration | Passou em SQLite temporário; segredos existentes cifrados e colunas adicionadas |
| `npm run build` web | Passou |
| `npm run lint` web | Passou com 9 avisos em código existente, sem erro |
| Testes Node mobile, incluindo serviço web 2FA | 20 passaram, 4 falharam |
| `npm run check` mobile | 29 arquivos com sintaxe/imports resolvidos |
| `npx expo config --type public` | Passou |
| Exportação Android/Metro/Hermes | Passou; 1.043 módulos, artefato em `mobile/dist-local` ignorado pelo Git |
| PostgreSQL / Mailpit / Brevo reais / Dsgner real | Não validados |

Os testes novos cobrem: resposta genérica de recuperação, hash persistido, token expirado/reutilizado, login com nova senha, limite de solicitações, envio genérico bloqueado, segredo cifrado, configuração pendente/expirada, QR Code, código inválido/expirado/reutilizado, desafio expirado, desafio sem acesso a `/auth/me`, emissão de JWT após segundo fator, desativação com senha/TOTP, migração de segredo legado, autorização de assinatura, bloqueio de duplicatas, reserva após timeout, estados cancelado/expirado/falho, documento divergente e conclusão somente após confirmação externa. SMTP foi validado com transporte simulado. Os serviços web/mobile têm testes que verificam ausência de sessão antes do segundo fator.

As falhas antigas do backend incluem cadastro sem CPF obrigatório, senha de login diferente da fixture, criação de objeto em `/items` em vez de `/items/lost` ou `/items/found`, listagens sem autenticação e expectativa antiga da mensagem de permissão. A infraestrutura de fixtures foi reparada sem enfraquecer a API. A regressão administrativa foi atualizada com CPF e assinatura confirmada por mock. Os demais testes antigos não foram adaptados neste escopo.

As quatro falhas mobile estão em testes antigos de cadastro, login, registro de objeto e bootstrap da navegação: mocks nativos incompletos e expectativas anteriores aos componentes/telas atuais. Os detalhes estão em `mobile/test-results-local.txt`. Foram corrigidos o carregamento de `expo/fetch`, o mock de `expo-file-system`, as verificações de `Headers` e a simulação de timeout; o código de produção desses serviços não foi reescrito.

Não houve validação manual integral de upload/visualização de imagens, correspondência automática, notificações, responsividade ou uso em dispositivo. Build e testes de módulos não comprovam esses fluxos ponta a ponta.

## Variáveis e execução

Use `backend/.env.example` como referência. Não sobrescreva um `.env` existente nem publique suas credenciais.

- Obrigatórias para banco/JWT: `SECRET_KEY`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.
- Recuperação: `PASSWORD_RESET_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM_EMAIL`, `SMTP_USE_TLS`; conforme servidor, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_TIMEOUT_SECONDS`.
- Brevo opcional: `BREVO_API_KEY`, `BREVO_API_URL`, `BREVO_SENDER_NAME`, `BREVO_SENDER_EMAIL`. Sem chave, o serviço usa SMTP.
- 2FA: `TWO_FACTOR_ENCRYPTION_KEY` obrigatória para cifrar/ler segredos; `TWO_FACTOR_ISSUER` e `TWO_FACTOR_WINDOW` controlam identificação e tolerância.
- Assinatura: `DSGNER_API_BASE_URL`, `DSGNER_API_KEY`, `DSGNER_SIGNATURE_PATH`, `DSGNER_STATUS_PATH`, `DSGNER_TIMEOUT_SECONDS`. Conferir contrato com o provedor antes da homologação.
- Web: `VITE_API_URL`, normalmente `http://localhost:8000/api/v1`.
- Mobile: `EXPO_PUBLIC_API_URL` deve apontar para o backend local; o fallback existente aponta ao ambiente remoto e não deve ser usado para testar estas alterações locais. Em aparelho físico, use o IP LAN do computador; no emulador Android, normalmente `http://10.0.2.2:8000/api/v1`.

PowerShell, a partir da raiz:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
.\.venv\Scripts\python.exe backend/scripts/configure_local_security.py
```

O último comando preserva uma chave existente e nunca a imprime. Já foi executado nesta entrega.

Para Compose, com Docker Desktop ativo:

```powershell
cd backend
docker compose up -d db mailpit
docker compose ps
docker compose up -d --build api
docker compose exec db psql -U postgres -d achados_perdidos -c "select current_database(), inet_server_addr(), inet_server_port();"
docker compose exec api alembic current
```

Confira os valores reais configurados e a associação do container `achados-db` ao PostgreSQL local de desenvolvimento. **Somente após essa verificação**, aplique:

```powershell
docker compose exec api alembic upgrade head
```

Não execute isso contra banco de produção. Nenhuma dessas migrations foi aplicada nesta sessão. O Compose publica PostgreSQL em `localhost:5433`, API em `localhost:8000` e Mailpit em `localhost:8025`. As variáveis `db:5432` e `mailpit:1025` são para uso dentro dos containers.

Backend diretamente no Windows, após configurar no `.env` os hosts/portas locais (`127.0.0.1:5433` para o banco do Compose e `127.0.0.1:1025` para SMTP, `SMTP_USE_TLS=false`):

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend, em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Mobile, em outro terminal, com URL local configurada:

```powershell
cd mobile
$env:EXPO_PUBLIC_API_URL="http://IP-DO-COMPUTADOR:8000/api/v1"
npm install
npm start
```

Não use nem altere `mobile/mobile/`: a pasta duplicada já estava não rastreada antes do trabalho e foi preservada.

## Roteiros manuais

1. Recuperação: abra `/login`, use “Esqueceu sua senha?”, informe conta de teste e abra o link no Mailpit (`localhost:8025`). Cadastre/ confirme nova senha e faça login. Reabra o link usado: deve falhar. Repita com endereço inexistente: a resposta deve ser a mesma. Aguarde 15 minutos para testar expiração real. Contas de funcionários usam os mesmos endpoints.
2. Mobile: as telas de recuperação/redefinição existentes permanecem integradas. O token pode ser informado na tela. Foi adicionado o scheme `ondeta`; em build que o registre, `ondeta://redefinir-senha?token=...` abre a redefinição. `PASSWORD_RESET_URL=ondeta://redefinir-senha` atende esse destino; o padrão HTTP continua atendendo o navegador. Universal links entre site/aparelho dependem de domínio e associação de plataforma, não configurados nesta entrega.
3. 2FA: entre sem 2FA, abra perfil → configuração 2FA (ou Segurança/2FA no painel), escaneie o QR Code e confirme o código. Antes da confirmação, 2FA continua inativo. Saia, faça login, confira o pedido de código e o redirecionamento correspondente ao perfil somente após validá-lo. Aguarde o próximo código depois de ativar: o código usado na ativação não pode ser reutilizado no login. Teste código antigo/incorreto e cancelamento. Para desativar, use senha e código atual. Preserve o autenticador; recuperação de senha não o substitui.
4. Assinatura real: primeiro confirme contrato e credenciais Dsgner. No fluxo existente, abra a solicitação autorizada, mantenha o funcionário responsável e agende a retirada. Continue para assinatura, abra o link, assine no provedor e consulte o status. Só `signed` validado no backend habilita/conclui a devolução. O solicitante também pode abrir sua assinatura pela tela de solicitações web/mobile. Confira pendência, cancelamento e expiração no provedor. Em timeout, não reenvie: confira o documento no painel do provedor e concilie seu ID na mesma tela; IDs com vínculo/hash diferente são rejeitados.

## Reprodução dos testes e arquivos

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest tests/test_security_flows.py tests/test_admin_flows.py -q
..\.venv\Scripts\python.exe -m pytest -q
cd ../frontend
npm run build
npm run lint
cd ../mobile
npm test
npm run check
npx expo export --platform android --output-dir dist-local
```

Os limites de abuso são em memória e por processo, adequados ao uso local com um worker. Em implantação distribuída devem usar armazenamento compartilhado. TOTP usa horário do servidor; mantenha o relógio sincronizado. Não foram alteradas configurações externas.

As listas completas de arquivos criados/alterados estão em `ARQUIVOS_INTEGRACOES.txt`; o diff dos arquivos rastreados está em `ENTREGA_DIFF.patch` e o estado final em `ENTREGA_GIT_STATUS.txt`. Arquivos novos são entregues diretamente no diretório e não aparecem no diff simples do Git. O `.env` local é ignorado e sua chave não faz parte desses artefatos.
