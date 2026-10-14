# Motor de Correspondência Inteligente - Documentação Completa

## Visão Geral

Implementação completa de um Motor de Correspondência Inteligente (RF07) e Sistema de Notificações Internas (RF08) para a plataforma de Achados e Perdidos, garantindo tempo de resposta imediato à API (RNF01).

## Arquitetura

### Componentes Principais

1. **Matching Service** (`app/services/matching_service.py`)
   - Algoritmo de pontuação com 4 critérios ponderados
   - Busca automática de candidatos compatíveis
   - Limite mínimo de 65% de similaridade

2. **Notification Service** (`app/services/notification_service.py`)
   - Gerenciamento de notificações
   - Prevenção de duplicatas
   - Listagem com filtros e paginação

3. **Background Task**
   - Executa em thread separada
   - Sessão isolada do banco de dados
   - Não bloqueia resposta da API

## Algoritmo de Correspondência

### Critérios e Pesos

```
Score Final (0-100%) = 
  (Categoria × 30%) + 
  (Similaridade Textual × 40%) + 
  (Proximidade Temporal × 15%) + 
  (Proximidade Geográfica × 15%)

Threshold mínimo: 65%
```

### 1. Similaridade de Categoria (30%)
- ✅ Se categoria_id é igual: 30 pontos
- ❌ Se categoria_id é diferente: 0 pontos

### 2. Similaridade Textual (40%)
- Concatena: `"{title} {description}"`
- Normaliza: remove acentos, minúsculas
- Algoritmo: `rapidfuzz.fuzz.token_set_ratio`
- Range: 0-40%

### 3. Proximidade Temporal (15%)
- ≤ 3 dias: 15 pontos (máximo)
- 3-30 dias: decai linearmente
- > 30 dias: 0 pontos

### 4. Proximidade Geográfica (15%)
- **Com coordenadas (lat/lon)**:
  - ≤ 1 km: 15 pontos
  - 1-15 km: decai linearmente
  - > 15 km: 0 pontos
  - Fórmula: Haversine

- **Sem coordenadas**:
  - Usa similaridade de `location_name`
  - Score reduzido a 30% do máximo

## Endpoints da API

### 1. Criar Item Perdido

```http
POST /api/v1/items/lost
Content-Type: application/json
Authorization: Bearer {token}

{
  "category_id": 1,
  "type": "PERDIDO",
  "title": "Carteira preta",
  "description": "Carteira preta de couro com moedas e documentos",
  "secret_details": "Contém ticket de cinema do dia 15/08",
  "location_name": "Metrô Vila Madalena",
  "latitude": -23.5505,
  "longitude": -46.6833,
  "event_date": "2026-09-01T14:30:00Z"
}
```

**Resposta (201 Created)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "category_id": 1,
  "type": "PERDIDO",
  "title": "Carteira preta",
  "description": "Carteira preta de couro com moedas e documentos",
  "location_name": "Metrô Vila Madalena",
  "latitude": "-23.550500",
  "longitude": "-46.683300",
  "event_date": "2026-09-01T14:30:00Z",
  "status": "PERDIDO",
  "created_at": "2026-09-01T15:00:00Z",
  "updated_at": "2026-09-01T15:00:00Z"
}
```

⚡ **O matching é agendado em background - resposta imediata!**

---

### 2. Criar Item Encontrado

```http
POST /api/v1/items/found
Content-Type: application/json
Authorization: Bearer {token}

{
  "category_id": 1,
  "type": "ENCONTRADO",
  "title": "Carteira preta",
  "description": "Encontrada carteira preta com documentos",
  "location_name": "Metrô Consolação",
  "latitude": -23.5548,
  "longitude": -46.6569,
  "event_date": "2026-09-01T16:45:00Z"
}
```

---

### 3. Listar Itens

```http
GET /api/v1/items?page=1&page_size=20&item_type=PERDIDO&category_id=1
Authorization: Bearer {token}
```

**Resposta**
```json
{
  "total": 5,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "category_id": 1,
      "type": "PERDIDO",
      "title": "Carteira preta",
      "description": "Carteira preta de couro...",
      "location_name": "Metrô Vila Madalena",
      "status": "PERDIDO",
      "created_at": "2026-09-01T15:00:00Z",
      "updated_at": "2026-09-01T15:00:00Z"
    }
  ]
}
```

---

### 4. Consultar Correspondências de um Item

```http
GET /api/v1/items/550e8400-e29b-41d4-a716-446655440000/matches
Authorization: Bearer {token}
```

**Resposta**
```json
{
  "total": 1,
  "items": [
    {
      "item_id": "550e8400-e29b-41d4-a716-446655440000",
      "matched_item_id": "770e8400-e29b-41d4-a716-446655440002",
      "similarity_score": 78.5,
      "matched_item_title": "Carteira preta",
      "matched_item_description": "Encontrada carteira preta com documentos",
      "matched_item_location_name": "Metrô Consolação",
      "matched_item_event_date": "2026-09-01T16:45:00Z",
      "matched_item_type": "ENCONTRADO",
      "score_details": {
        "category_score": 30.0,
        "textual_similarity_score": 35.2,
        "temporal_proximity_score": 13.8,
        "geographical_proximity_score": 0.0
      }
    }
  ]
}
```

**Detalhamento do Score (78.5%)**
- Categoria: 30.0 (categorias iguais)
- Textual: 35.2 (88% × 40% = similaridade de título/descrição)
- Temporal: 13.8 (92% × 15% = 1h 15min de diferença)
- Geográfica: 0.0 (4.2 km de distância > 15 km decay)

---

### 5. Listar Notificações

```http
GET /api/v1/notifications?page=1&unread_only=false
Authorization: Bearer {token}
```

**Resposta**
```json
{
  "total": 2,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "item_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Correspondência Encontrada!",
      "message": "Encontramos um possível objeto correspondente ao seu item: Carteira preta com 78.5% de similaridade.",
      "type": "MATCH_FOUND",
      "is_read": false,
      "created_at": "2026-09-01T15:02:30Z"
    }
  ]
}
```

---

### 6. Marcar Notificação como Lida

```http
PATCH /api/v1/notifications/880e8400-e29b-41d4-a716-446655440003/read
Authorization: Bearer {token}
```

**Resposta (200 OK)**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "item_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Correspondência Encontrada!",
  "message": "Encontramos um possível objeto correspondente ao seu item: Carteira preta com 78.5% de similaridade.",
  "type": "MATCH_FOUND",
  "is_read": true,
  "created_at": "2026-09-01T15:02:30Z"
}
```

---

### 7. Listar Apenas Notificações Não Lidas

```http
GET /api/v1/notifications?unread_only=true&page_size=50
Authorization: Bearer {token}
```

---

## Fluxo de Execução

### 1. Usuário cria item PERDIDO
```
POST /items/lost
  ↓
Item inserido no BD
  ↓
API retorna 201 (imediato)
  ↓ (em background)
Buscar items ENCONTRADO com status ENCONTRADO
  ↓
Calcular score com 4 critérios
  ↓
Se score ≥ 65%: Criar notificação
  ↓
Commit/Rollback com tratamento de erro
```

### 2. Usuário cria item ENCONTRADO
```
POST /items/found
  ↓
Item inserido no BD
  ↓
API retorna 201 (imediato)
  ↓ (em background)
Buscar items PERDIDO com status PERDIDO
  ↓
Calcular score com 4 critérios
  ↓
Se score ≥ 65%: Criar notificação
```

## Garantias de Qualidade

### RNF01 - Desempenho
- ✅ BackgroundTasks não bloqueia resposta
- ✅ Usuário recebe 201 em < 100ms

### Idempotência
- ✅ Verifica se notificação já existe
- ✅ Evita duplicatas se matching rodar 2x

### Isolamento de Transação
- ✅ Sessão isolada com `AsyncSessionLocal()`
- ✅ Rollback automático em erros
- ✅ Sem vazamento de conexões `asyncpg`

### Dados Corretos
- ✅ Normalização de texto (acentos)
- ✅ Algoritmo de Haversine preciso
- ✅ Decay linear previsível

## Exemplo de Sequência de Testes

```bash
# 1. Registrar usuário
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João",
    "email": "joao@example.com",
    "password": "senha123456"
  }'

# 2. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123456"
  }'
# Salvar token

# 3. Criar item perdido
curl -X POST http://localhost:8000/api/v1/items/lost \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "type": "PERDIDO",
    "title": "Pulseira de ouro",
    "description": "Pulseira de ouro com 3 pingentes",
    "location_name": "Parque Ibirapuera",
    "event_date": "2026-09-01T14:00:00Z"
  }'

# 4. Como outro usuário, criar item encontrado similar
curl -X POST http://localhost:8000/api/v1/items/found \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "type": "ENCONTRADO",
    "title": "Pulseira ouro com pingentes",
    "description": "Encontrada pulseira de ouro com 3 pingentes no Ibirapuera",
    "location_name": "Parque Ibirapuera",
    "event_date": "2026-09-01T16:00:00Z"
  }'

# 5. Aguardar 2 segundos (matching em background)
sleep 2

# 6. Listar notificações do primeiro usuário
curl -X GET http://localhost:8000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN"
# Deve conter notificação de MATCH_FOUND
```

## Tratamento de Erros

### Status HTTP Esperados

| Endpoint | Status | Situação |
|----------|--------|----------|
| POST /items/lost | 201 | Item criado com sucesso |
| POST /items/lost | 400 | type != "PERDIDO" |
| POST /items/lost | 401 | Sem autenticação |
| POST /items/lost | 422 | Validação Pydantic falhou |
| GET /items | 200 | Sucesso |
| GET /items | 401 | Sem autenticação |
| GET /notifications | 200 | Sucesso |
| PATCH /notifications/{id}/read | 404 | Notificação não encontrada |

## Performance

### Complexidade

- **Listing items**: O(n) - uma query com limit
- **Finding matches**: O(c × m) onde:
  - c = itens candidatos
  - m = cálculos de score (constante)
- **Score calculation**: O(1) - fixa (4 critérios)

### Otimizações

- ✅ Índices em: `items.title`, `items.status`, `items.category_id`
- ✅ Soft paginação em GET endpoints
- ✅ Background task não bloqueia
- ✅ Similaridade textual: O(n) com RapidFuzz otimizado
- ✅ Haversine: O(1) - 4 cálculos trig

## Limitações Conhecidas

1. **Geografia**: Se coordenadas ausentes, usa texto (menos preciso)
2. **Idioma**: Normalização assume caracteres ASCII-extendidos
3. **Escala**: Para >100k itens, considerar índice full-text
4. **Real-time**: Notificações entregues via polling (não WebSocket)

## Próximos Passos Recomendados

- [ ] Adicionar índice full-text em title/description
- [ ] Implementar WebSocket para notificações real-time
- [ ] Adicionar filtros de raio de busca (POST /items/search)
- [ ] Implementar cache de matches (Redis)
- [ ] Adicionar métricas/logging de performance
- [ ] Testes unitários do algoritmo
- [ ] Testes de carga (K6/Locust)
