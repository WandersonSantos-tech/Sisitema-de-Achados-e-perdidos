# Prompt 6 - API Usage Examples

## Claims Endpoints

### 1. Create Claim (POST /api/v1/items/{item_id}/claims)
**Descrição:** Criar uma reivindicação para um item encontrado

**Request:**
```json
{
  "proof_description": "O item é meu porque tem um adesivo azul no verso com meu nome 'João' escritos"
}
```

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "item_id": "660e8400-e29b-41d4-a716-446655440001",
  "requester_id": "770e8400-e29b-41d4-a716-446655440002",
  "proof_description": "O item é meu porque tem um adesivo azul...",
  "status": "PENDENTE",
  "created_at": "2026-09-13T15:30:45.123456"
}
```

**Error Responses:**
- `400 Bad Request` - Usuário é dono do item, item está DEVOLVIDO/CANCELADO, ou já existe reivindicação PENDENTE
- `404 Not Found` - Item não encontrado
- `401 Unauthorized` - Usuário não autenticado

**Notificação Disparada:** `CLAIM_RECEIVED` para o proprietário do item

---

### 2. List Item Claims (GET /api/v1/items/{item_id}/claims)
**Descrição:** Listar todas as reivindicações de um item

**Query Parameters:**
```
page=1&page_size=20
```

**Success Response (200):**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "item_id": "660e8400-e29b-41d4-a716-446655440001",
      "requester_id": "770e8400-e29b-41d4-a716-446655440002",
      "proof_description": "O item é meu porque...",
      "status": "PENDENTE",
      "created_at": "2026-09-13T15:30:45.123456",
      "requester": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "João Silva",
        "email": "joao@example.com",
        "phone": "11999999999"
      },
      "item": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Carteira Preta",
        "location_name": "Parque Central"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

**Error Responses:**
- `403 Forbidden` - Usuário não é dono do item nem administrador
- `404 Not Found` - Item não encontrado

**Acesso:** Apenas proprietário do item ou administradores

---

### 3. Update Claim Status (PATCH /api/v1/claims/{claim_id}/status)
**Descrição:** Aprovar ou rejeitar uma reivindicação

**Request:**
```json
{
  "status": "APROVADA",
  "notes": null
}
```

ou para rejeitar:

```json
{
  "status": "REJEITADA",
  "notes": "A descrição não corresponde ao item"
}
```

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "item_id": "660e8400-e29b-41d4-a716-446655440001",
  "requester_id": "770e8400-e29b-41d4-a716-446655440002",
  "proof_description": "O item é meu porque...",
  "status": "APROVADA",
  "created_at": "2026-09-13T15:30:45.123456",
  "requester": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999"
  },
  "item": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Carteira Preta",
    "location_name": "Parque Central"
  }
}
```

**Efeitos da Aprovação:**
- Item transiciona para `EM_NEGOCIACAO`
- `StatusHistory` é registrado com `changed_by = current_user.id`
- Notificação `CLAIM_UPDATED` é disparada para o solicitante

**Error Responses:**
- `403 Forbidden` - Usuário não é dono do item nem administrador
- `404 Not Found` - Reivindicação não encontrada

---

### 4. List My Claims (GET /api/v1/claims/my-claims)
**Descrição:** Listar todas as reivindicações abertas pelo usuário logado

**Query Parameters:**
```
page=1&page_size=20
```

**Success Response (200):**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "item_id": "660e8400-e29b-41d4-a716-446655440001",
      "requester_id": "770e8400-e29b-41d4-a716-446655440002",
      "proof_description": "O item é meu porque...",
      "status": "PENDENTE",
      "created_at": "2026-09-13T15:30:45.123456",
      "requester": { ... },
      "item": { ... }
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 20
}
```

---

## Messages Endpoints

### 1. Send Message (POST /api/v1/items/{item_id}/messages)
**Descrição:** Enviar mensagem vinculada a um item para outro usuário

**Request:**
```json
{
  "content": "Olá! Gostaria de discutir sobre a possível devolução do item.",
  "receiver_id": "880e8400-e29b-41d4-a716-446655440003"
}
```

**Success Response (201):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "item_id": "660e8400-e29b-41d4-a716-446655440001",
  "sender_id": "770e8400-e29b-41d4-a716-446655440002",
  "receiver_id": "880e8400-e29b-41d4-a716-446655440003",
  "content": "Olá! Gostaria de discutir sobre...",
  "created_at": "2026-09-13T15:35:30.123456",
  "sender": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "receiver": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Maria Santos",
    "email": "maria@example.com"
  }
}
```

**Validações de Acesso:**
- Remetente deve ser dono do item OU ter reivindicação ativa
- Destinatário também deve estar envolvido (dono ou claimant)

**Error Responses:**
- `400 Bad Request` - Remetente não está envolvido com o item, ou destinatário não está envolvido
- `404 Not Found` - Item ou usuário destinatário não encontrado
- `401 Unauthorized` - Usuário não autenticado

**Notificação Disparada:** `NEW_MESSAGE` para o destinatário

---

### 2. Get Conversation (GET /api/v1/items/{item_id}/messages)
**Descrição:** Recuperar histórico de mensagens entre dois usuários para um item

**Query Parameters:**
```
interlocutor_id=880e8400-e29b-41d4-a716-446655440003
```

**Success Response (200):**
```json
{
  "item_id": "660e8400-e29b-41d4-a716-446655440001",
  "other_user": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Maria Santos",
    "email": "maria@example.com"
  },
  "messages": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "item_id": "660e8400-e29b-41d4-a716-446655440001",
      "sender_id": "770e8400-e29b-41d4-a716-446655440002",
      "receiver_id": "880e8400-e29b-41d4-a716-446655440003",
      "content": "Olá! Gostaria de discutir...",
      "created_at": "2026-09-13T15:35:30.123456",
      "sender": { ... },
      "receiver": { ... }
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "item_id": "660e8400-e29b-41d4-a716-446655440001",
      "sender_id": "880e8400-e29b-41d4-a716-446655440003",
      "receiver_id": "770e8400-e29b-41d4-a716-446655440002",
      "content": "Claro! Combinamos amanhã?",
      "created_at": "2026-09-13T15:36:15.123456",
      "sender": { ... },
      "receiver": { ... }
    }
  ]
}
```

**Características:**
- Mensagens ordenadas cronologicamente (ASC - mais antigas primeiro)
- Filtra automaticamente apenas mensagens entre os dois usuários para aquele item
- Validação de que ambos estão envolvidos com o item

**Error Responses:**
- `400 Bad Request` - Usuário logado não está envolvido com o item, ou outro usuário não está envolvido
- `404 Not Found` - Item ou outro usuário não encontrado
- `401 Unauthorized` - Usuário não autenticado

---

## Security & Permission Model

### RF11/RF12 - Claim Validation Rules
1. **Ownership Check** - Usuário não pode reivindicar item dele mesmo
2. **Status Check** - Item não pode estar DEVOLVIDO ou CANCELADO
3. **Duplicate Check** - Mesmo usuário não pode ter múltiplas reivindicações PENDENTES

### RNF04 - Permission Model
- **Create Claim:** Qualquer usuário autenticado (exceto owner)
- **List Claims:** Apenas dono do item ou ADMIN
- **Update Claim:** Apenas dono do item ou ADMIN
- **Send Message:** Dono do item OU usuário com reivindicação
- **Get Conversation:** Ambos usuários envolvidos com item

### RNF11 - Transactional Integrity
- Todas as operações têm rollback automático em caso de erro
- StatusHistory registrado com `changed_by` user ID
- Notificações disparadas após commit bem-sucedido

### RNF18 - Data Privacy
- Conversas visíveis apenas entre usuários envolvidos
- Reivindicações visíveis apenas ao dono ou admin
- Proof descriptions nunca expostos publicamente
