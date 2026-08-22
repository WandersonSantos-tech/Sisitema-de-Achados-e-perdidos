# OndeTá

> Sistema de Achados e Perdidos — Web, Mobile e API

O **OndeTá** é uma plataforma de gerenciamento de objetos perdidos e encontrados, desenvolvida com o objetivo de facilitar o registro, a localização, a identificação e a devolução de objetos.

O sistema possui interfaces **Web e Mobile**, conectadas à mesma API, permitindo que usuários registrem objetos perdidos, pesquisem itens encontrados, acompanhem solicitações e recebam notificações.

Funcionários possuem uma área administrativa para gerenciamento dos objetos encontrados e dos processos de devolução.

---

## Sobre o projeto

O OndeTá está sendo desenvolvido como projeto acadêmico, utilizando uma arquitetura separada em:

- Frontend Web
- Aplicação Mobile
- Backend / API REST
- Banco de Dados PostgreSQL
- Ambiente Docker

A comunicação entre os clientes Web e Mobile é realizada através da mesma API desenvolvida em FastAPI.

---

# Tecnologias

## Frontend Web

- React
- Vite
- JavaScript
- React Router DOM
- Fetch API
- CSS

## Mobile

- React Native
- Expo
- JavaScript
- AsyncStorage

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT
- PyJWT
- Passlib / Bcrypt
- Uvicorn
- Alembic
- AsyncPG

## Banco de Dados

- PostgreSQL

## Infraestrutura

- Docker
- Docker Compose
- Mailpit

## 🔧 Versionamento

- Git
- GitHub

---

# Arquitetura

O projeto segue uma arquitetura onde os dois clientes consomem a mesma API.

```text
                    ┌──────────────────┐
                    │     OndeTá       │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐           ┌─────────────────┐
     │    React Web    │           │  React Native   │
     │      Vite       │           │      Expo       │
     └────────┬────────┘           └────────┬────────┘
              │                             │
              └──────────────┬──────────────┘
                             │
                             │ HTTP / JSON
                             ▼
                    ┌─────────────────┐
                    │     FastAPI     │
                    │    REST API     │
                    └────────┬────────┘
                             │
                       SQLAlchemy
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
```

---

# Perfis do sistema

O OndeTá possui dois perfis principais.

## Usuário

O usuário poderá utilizar a versão Web ou Mobile para:

- Criar uma conta
- Fazer login
- Recuperar senha
- Registrar objetos perdidos
- Pesquisar objetos encontrados
- Utilizar filtros de pesquisa
- Visualizar detalhes dos objetos
- Receber possíveis correspondências
- Receber notificações
- Solicitar devolução
- Comprovar propriedade de um objeto
- Acompanhar o andamento da solicitação
- Gerenciar sua conta

## Funcionário

O funcionário utilizará principalmente a versão Web para:

- Fazer login administrativo
- Acessar o painel de gerenciamento
- Cadastrar objetos encontrados
- Gerenciar objetos
- Gerenciar categorias
- Analisar solicitações de devolução
- Validar propriedade
- Alterar status dos objetos
- Registrar devoluções
- Acompanhar informações administrativas

---

# Autenticação

A autenticação utiliza **JWT (JSON Web Token)**.

Fluxo:

```text
Usuário
   │
   ▼
React / React Native
   │
   │ e-mail + senha
   ▼
FastAPI
   │
   ▼
Validação das credenciais
   │
   ▼
JWT Access Token
   │
   ▼
Frontend
   │
   ▼
Requisições autenticadas
Authorization: Bearer TOKEN
```

Atualmente existem dois níveis de acesso:

```text
USER
ADMIN
```

---

#  Rotas de autenticação

A API utiliza como prefixo:

```text
/api/v1
```

### Cadastro

```http
POST /api/v1/auth/register
```

### Login

```http
POST /api/v1/auth/login
```

### Usuário autenticado

```http
GET /api/v1/auth/me
```

Requer:

```http
Authorization: Bearer <token>
```

### Recuperação de senha

```http
POST /api/v1/auth/forgot-password
```

### Redefinição de senha

```http
POST /api/v1/auth/reset-password
```

---

# Principais entidades

O banco de dados foi estruturado utilizando SQLAlchemy.

Entre as entidades existentes estão:

### User

Representa os usuários do sistema.

Principais informações:

- ID
- Nome
- E-mail
- Telefone
- Senha criptografada
- Perfil
- Status da conta

---

### Category

Representa as categorias dos objetos.

Exemplos:

- Eletrônicos
- Documentos
- Roupas
- Acessórios
- Chaves
- Outros

---

### Item

Representa um objeto perdido ou encontrado.

Principais informações:

- Usuário
- Categoria
- Tipo
- Título
- Descrição
- Características específicas
- Local
- Latitude
- Longitude
- Data
- Status

Tipos:

```text
PERDIDO
ENCONTRADO
```

Status disponíveis atualmente:

```text
PERDIDO
ENCONTRADO
EM_NEGOCIACAO
DEVOLVIDO
CANCELADO
```

---

### ItemImage

Armazena as imagens associadas aos objetos.

---

### Claim

Representa uma solicitação de propriedade/devolução de um objeto.

Status:

```text
PENDENTE
APROVADA
REJEITADA
```

---

### Notification

Responsável pelas notificações dos usuários.

Tipos previstos:

```text
MATCH_FOUND
CLAIM_RECEIVED
CLAIM_UPDATED
NEW_MESSAGE
```

---

### Message

Permite armazenar mensagens relacionadas aos objetos e usuários.

---

### StatusHistory

Mantém o histórico das alterações de status de um objeto.

---

### Review

Permite registrar avaliações relacionadas às devoluções/interações.

---

### Report

Permite registrar denúncias ou ocorrências relacionadas a usuários ou objetos.

---

# Estrutura do projeto

A estrutura geral segue o padrão:

```text
OndeTa/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── usuario/
│   │   │   └── funcionario/
│   │   │
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.js
│
├── mobile/
│   │
│   ├── src/
│   ├── App.js
│   └── package.json
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   │
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── alembic.ini
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

> A estrutura poderá sofrer alterações durante o desenvolvimento.

---

# Executando o projeto

## 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
```

Entre na pasta do projeto:

```bash
cd <PASTA_DO_REPOSITORIO>
```

---

#  Executando o Backend

Entre na pasta:

```bash
cd backend
```

Crie o arquivo `.env` utilizando o exemplo:

### Windows CMD

```bash
copy .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

---

## Executar com Docker

Com o Docker Desktop aberto:

```bash
docker compose up --build -d
```

Verifique os containers:

```bash
docker compose ps
```

Os serviços esperados são:

```text
achados-api
achados-db
achados-mailpit
```

---

## Executar as migrations

Depois que os containers estiverem funcionando:

```bash
docker compose exec api alembic upgrade head
```

---

## Logs da API

Para acompanhar os logs:

```bash
docker compose logs -f api
```

Para sair dos logs:

```text
CTRL + C
```

Isso não encerra os containers.

---

# API

Com o backend executando, a API estará disponível localmente na porta:

```text
8000
```

## Swagger

A documentação interativa está disponível em:

```text
http://localhost:8000/docs
```

## ReDoc

```text
http://localhost:8000/redoc
```

## Health Check

```text
http://localhost:8000/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "Achados e Perdidos API"
}
```

---

# Mailpit

Durante o desenvolvimento, o projeto utiliza **Mailpit** para testar o envio de e-mails.

Interface:

```text
http://localhost:8025
```

Isso é especialmente útil para testar:

```text
Esqueci minha senha
        ↓
FastAPI
        ↓
Mailpit
        ↓
E-mail de recuperação
```

Assim não é necessário enviar e-mails reais durante o desenvolvimento local.

---

# Executando o Frontend Web

Abra outro terminal e entre na pasta:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute:

```bash
npm run dev
```

O Vite mostrará o endereço da aplicação, normalmente:

```text
http://localhost:5173
```

---

# Configuração da API no Frontend

O frontend utiliza uma variável de ambiente para definir a URL do backend.

Exemplo:

```env
VITE_API_URL=http://localhost:8000
```

Caso ela não esteja definida, durante o desenvolvimento o sistema poderá utilizar:

```text
http://localhost:8000
```

O frontend envia automaticamente o JWT nas rotas autenticadas:

```http
Authorization: Bearer <access_token>
```

---

# Executando o Mobile

Entre na pasta da aplicação Mobile:

```bash
cd mobile
```

Instale as dependências:

```bash
npm install
```

Execute o Expo:

```bash
npx expo start
```

Para limpar o cache:

```bash
npx expo start -c
```

A aplicação poderá ser executada através do:

- Expo Go
- Emulador Android
- Dispositivo Android físico

> Ao testar o Mobile em um dispositivo físico, `localhost` representa o próprio celular. Portanto, a URL da API deverá utilizar um endereço acessível pelo dispositivo, como o IP local da máquina ou um backend publicado.

---

# Identidade visual

A interface do **OndeTá** utiliza principalmente:

- Azul-marinho
- Azul
- Branco
- Tons claros para fundos e elementos secundários

A identidade visual busca transmitir:

- Segurança
- Organização
- Confiança
- Simplicidade
- Facilidade de utilização

---

# Telas Web

## Autenticação

Atualmente estão previstas/desenvolvidas:

- Login do usuário
- Login do funcionário
- Cadastro
- Recuperação de senha
- Redefinição de senha

## Usuário

Entre as telas previstas:

- Home
- Cadastrar objeto perdido
- Pesquisar objetos encontrados
- Detalhes do objeto
- Notificações
- Solicitação de devolução
- Validação de propriedade
- Perfil

## Funcionário

Entre as telas previstas:

- Dashboard
- Categorias
- Cadastro de objeto encontrado
- Lista de objetos
- Detalhes do objeto
- Solicitações de devolução
- Validação de propriedade
- Gerenciamento de status
- Relatórios

---

# Fluxo principal

```text
                    ONDETÁ
                       │
              ┌────────┴────────┐
              │                 │
           USUÁRIO          FUNCIONÁRIO
              │                 │
            Login             Login
              │                 │
              ▼                 ▼
             Home            Dashboard
              │                 │
      ┌───────┼───────┐         │
      │       │       │         │
   Registrar Pesquisar Notif.   │
    perdido encontrados         │
      │       │                 │
      │       ▼                 │
      │    Detalhes             │
      │       │                 │
      │       ▼                 │
      │   Solicitar ────────────┤
      │   devolução             │
      │                         ▼
      │                    Validação
      │                         │
      │                         ▼
      └────────────────────► Devolução
```

---

# Segurança

O projeto utiliza ou prevê:

- Autenticação JWT
- Senhas armazenadas através de hash
- Separação entre USER e ADMIN
- Rotas autenticadas
- Validação de usuário ativo
- Expiração de token
- Variáveis sensíveis através de `.env`
- Validação dos dados utilizando Pydantic

---

# Arquivos que não devem ser enviados ao Git

Nunca faça commit de:

```text
.env
venv/
.venv/
__pycache__/
*.pyc
node_modules/
```

Exemplo para o backend:

```gitignore
.env
venv/
.venv/
__pycache__/
*.pyc
```

Cada desenvolvedor deverá criar seu próprio ambiente virtual e instalar as dependências através do:

```bash
pip install -r requirements.txt
```

Nunca compartilhe a pasta `venv`.

---

# Organização das Branches

Exemplo de organização:

```text
main
│
├── feature/backend-setup
│
├── feature/frontend-auth
│
├── feature/mobile
│
└── outras features...
```

Antes de começar uma alteração:

```bash
git branch
```

Para criar uma nova branch:

```bash
git switch -c feature/nome-da-feature
```

Adicionar alterações:

```bash
git add .
```

Criar commit:

```bash
git commit -m "feat: descricao da alteracao"
```

Enviar a branch:

```bash
git push -u origin feature/nome-da-feature
```

---

# Padrão de commits

O projeto pode utilizar Conventional Commits.

### Nova funcionalidade

```text
feat: adiciona tela de cadastro
```

### Correção

```text
fix: corrige redirecionamento do login
```

### Documentação

```text
docs: atualiza README
```

### Refatoração

```text
refactor: reorganiza servico de autenticacao
```

### Estilo

```text
style: atualiza layout da tela de login
```

---

# Status atual

### Backend

- [x] Estrutura FastAPI
- [x] PostgreSQL
- [x] Docker
- [x] Docker Compose
- [x] Alembic
- [x] Models iniciais
- [x] Autenticação JWT
- [x] Cadastro
- [x] Login
- [x] Recuperação de senha
- [x] Rota de usuário autenticado
- [ ] Demais endpoints do sistema

### Frontend Web

- [x] Estrutura React + Vite
- [x] React Router
- [x] Integração inicial com API
- [x] Login
- [x] Separação USER / ADMIN
- [x] Cadastro
- [x] Recuperação de senha
- [x] Redefinição de senha
- [x] Home inicial do usuário
- [x] Interface inicial de categorias
- [ ] Dashboard completo do usuário
- [ ] Dashboard completo do funcionário
- [ ] Cadastro de objetos
- [ ] Pesquisa de objetos
- [ ] Notificações
- [ ] Solicitações de devolução

### Mobile

- [x] Estrutura React Native + Expo
- [ ] Integração completa com API
- [ ] Autenticação
- [ ] Home
- [ ] Cadastro de objeto perdido
- [ ] Pesquisa
- [ ] Notificações

---

# Próximas etapas

Entre as próximas funcionalidades previstas estão:

1. Finalizar dashboards de usuário e funcionário
2. Desenvolver endpoints de categorias
3. Desenvolver cadastro de objetos perdidos
4. Desenvolver cadastro de objetos encontrados
5. Implementar upload de imagens
6. Criar pesquisa e filtros
7. Desenvolver sistema de correspondência
8. Implementar notificações
9. Desenvolver solicitações de devolução
10. Implementar validação de propriedade
11. Finalizar integração Mobile
12. Preparar ambiente de produção
13. Publicar aplicação em nuvem

---

# Desenvolvimento

Projeto desenvolvido em equipe como parte de um projeto acadêmico de Sistemas de Informação.

O desenvolvimento é dividido entre:

```text
Frontend Web
React
       │
       │
Frontend Mobile
React Native
       │
       │
       ├──────────► REST API
       │
Backend
Python + FastAPI
       │
       ▼
PostgreSQL
```

---

# Licença

Projeto desenvolvido para fins acadêmicos e educacionais.

---

<p align="center">
  <strong>OndeTá</strong>
  <br>
  Achados & Perdidos
</p>

<p align="center">
  Encontre. Recupere. Devolva.
</p>
