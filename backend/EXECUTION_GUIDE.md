# Guia de Execução - Prompts 7 e 8

## 1. Preparar o Ambiente

### 1.1 Instalar Dependências de Teste e Logging

No diretório do backend (`achados e perdidos/backend/`):

```bash
# Instalar todas as dependências incluindo teste e logging
pip install -r requirements.txt

# Ou instalar apenas as novas:
pip install pytest==7.4.4 pytest-asyncio==0.23.3 httpx==0.26.0 aiosqlite==0.19.0 pytest-cov==4.1.0 python-json-logger==2.0.7
```

## 2. Executar os Testes

### 2.1 Executar Todos os Testes

```bash
pytest -v
```

Saída esperada:
```
tests/test_auth.py::TestAuthRegister::test_register_success PASSED
tests/test_auth.py::TestAuthRegister::test_register_duplicate_email PASSED
...
tests/test_permissions.py::TestReportSubmissionPermissions::test_user_cannot_report_self PASSED

========================= XX passed in X.XXs =========================
```

### 2.2 Executar Suite por Suite

```bash
# Testes de autenticação (RF01, RF02, RF03)
pytest tests/test_auth.py -v

# Testes de itens (RF04, RF05, RF06, RF12, RF13, RF14)
pytest tests/test_items.py -v

# Testes de matching (RF07, RF08)
pytest tests/test_matching.py -v

# Testes de permissões (RNF04)
pytest tests/test_permissions.py -v
```

### 2.3 Executar Testes Específicos

```bash
# Apenas teste de privacidade
pytest tests/test_items.py::TestItemPrivacy -v

# Apenas teste de autorização admin
pytest tests/test_permissions.py::TestAdminAuthorization -v

# Com trace de saída
pytest tests/test_items.py::TestItemPrivacy::test_secret_details_visible_to_owner -v -s
```

### 2.4 Gerar Relatório de Cobertura

```bash
pytest --cov=app tests/ --cov-report=html
# Abrir htmlcov/index.html no navegador
```

## 3. Executar a Aplicação

### 3.1 Iniciar o Servidor FastAPI

```bash
# No diretório backend
uvicorn app.main:app --reload --port 8000
```

A aplicação estará disponível em: http://localhost:8000

- Documentação interativa: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health check: http://localhost:8000/health

### 3.2 Testar Endpoints via cURL

```bash
# Registrar novo usuário
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@test.com",
    "phone": "11999999999",
    "password": "SenhaForte123!"
  }'

# Fazer login
export TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@test.com",
    "password": "SenhaForte123!"
  }' | jq -r '.access_token')

# Consultar dados do usuário autenticado
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Criar denúncia
curl -X POST http://localhost:8000/api/v1/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Usuário suspeito de fraude no sistema",
    "reported_user_id": "00000000-0000-0000-0000-000000000001"
  }'

# Acessar painel admin sem permissão (deve retornar 403)
curl -X GET http://localhost:8000/api/v1/admin/stats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## 4. Verificar Logs Estruturados

### 4.1 Exemplos de Logs em JSON

Os logs serão exibidos em JSON estruturado. Exemplo:

```json
{
  "timestamp": "2024-01-30T10:30:45.123456",
  "level": "INFO",
  "logger_name": "middleware",
  "file_line": "logging_middleware.py:42",
  "message": "Requisição recebida: POST /api/v1/auth/register",
  "context": {
    "event": "HTTP_REQUEST_STARTED",
    "request_id": "123e4567-e89b-12d3-a456-426614174000",
    "method": "POST",
    "path": "/api/v1/auth/register",
    "client_ip": "127.0.0.1"
  }
}
```

```json
{
  "timestamp": "2024-01-30T10:30:45.234567",
  "level": "INFO",
  "logger_name": "app.services.auth_service",
  "file_line": "auth_service.py:28",
  "message": "Usuário registrado com sucesso",
  "context": {
    "event": "AUDIT_REGISTER",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao@test.com"
  }
}
```

### 4.2 Redirecionando Logs para Arquivo

```bash
# Iniciar aplicação com logs em arquivo
uvicorn app.main:app --reload --port 8000 > logs.jsonl 2>&1

# Visualizar logs
cat logs.jsonl | jq
```

## 5. Validação Manual de Requisitos

### 5.1 Validar RF15 (Avaliações)

```bash
# Criar item PERDIDO
ITEM_ID=$(curl -s -X POST http://localhost:8000/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Celular",
    "description": "Samsung Galaxy",
    "type": "PERDIDO",
    "category_id": 1,
    "location_name": "São Paulo",
    "location_lat": -23.5505,
    "location_lon": -46.6333,
    "event_date": "2024-01-15"
  }' | jq -r '.id')

# Alterar status para DEVOLVIDO (como admin)
curl -X PATCH http://localhost:8000/api/v1/admin/items/$ITEM_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DEVOLVIDO"
  }'

# Criar avaliação
curl -X POST http://localhost:8000/api/v1/items/$ITEM_ID/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excelente comunicação com o outro usuário"
  }'

# Consultar avaliações recebidas (usuário avaliado)
curl -X GET http://localhost:8000/api/v1/users/{user_id}/reviews \
  -H "Content-Type: application/json"
```

### 5.2 Validar RF16 (Denúncias)

```bash
# Criar denúncia
REPORT_ID=$(curl -s -X POST http://localhost:8000/api/v1/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Usuário publicando itens com descrições fraudulentas"
  }' | jq -r '.id')

# Admin listar denúncias
curl -X GET "http://localhost:8000/api/v1/admin/reports?page=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Admin resolver denúncia
curl -X PATCH http://localhost:8000/api/v1/admin/reports/$REPORT_ID/resolve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_resolved": true,
    "resolution_notes": "Usuário bloqueado pela fraude"
  }'
```

### 5.3 Validar RF19 (Painel Admin)

```bash
# Obter estatísticas do sistema
curl -X GET http://localhost:8000/api/v1/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Resposta esperada:
# {
#   "total_users": 42,
#   "total_active_items": 128,
#   "total_returned_items": 37,
#   "return_success_rate": 22.4,
#   "top_categories": [
#     {"category_name": "Eletrônicos", "count": 45},
#     ...
#   ],
#   "top_locations": [
#     {"location_name": "Av. Paulista", "count": 23},
#     ...
#   ],
#   "pending_reports": 5
# }

# Listar usuários
curl -X GET "http://localhost:8000/api/v1/admin/users?page=1&page_size=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Bloquear usuário
curl -X PATCH http://localhost:8000/api/v1/admin/users/{user_id} \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'

# Remover item irregular
curl -X DELETE http://localhost:8000/api/v1/admin/items/$ITEM_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 5.4 Validar RNF04 (Proteção Admin)

```bash
# Tenta acessar /admin/* sem ser admin
curl -i -X GET http://localhost:8000/api/v1/admin/stats \
  -H "Authorization: Bearer $USER_TOKEN"
# Esperado: HTTP 403 Forbidden

# Sem autenticação
curl -i -X GET http://localhost:8000/api/v1/admin/stats
# Esperado: HTTP 401 Unauthorized
```

### 5.5 Validar RNF15 (Testes Automatizados)

```bash
# Executar todos os testes
pytest -v --tb=short

# Ver que começam com:
tests/test_auth.py::TestAuthRegister::test_register_success PASSED
tests/test_auth.py::TestAuthRegister::test_register_duplicate_email PASSED
...

# Terminating com:
========================= XX passed in X.XXs =========================
```

## 6. Troubleshooting

### Problema: "ModuleNotFoundError: No module named 'pytest'"

**Solução:**
```bash
pip install pytest pytest-asyncio
```

### Problema: "Cannot open database file" ao rodar testes

**Solução:** Certifique-se que a pasta `tests/` existe e tem `__init__.py`
```bash
touch tests/__init__.py
```

### Problema: "FAILED - assert response.status_code == 403"

**Solução:** Verificar que o middleware de autenticação funciona:
```bash
# Test simples
curl http://localhost:8000/api/v1/admin/stats
# Deve retornar 401 ou 403
```

### Problema: Logs não aparecem em JSON

**Solução:** Verificar que `setup_logging()` foi chamado em `main.py`:
```python
from app.core.logging_config import setup_logging
setup_logging(log_level="INFO")
```

## 7. Documentação do Código

Todos os arquivos criados contêm:
- Docstrings descritivas
- Type hints completos
- Comentários explicativos
- Validações de entrada robustas

Para ler a documentação:

```bash
# No Python REPL
python
>>> from app.services.review_service import create_review
>>> help(create_review)

# Ou via terminal
python -m pydoc app.services.review_service
```

## 8. Próximas Melhorias (Opcional)

- [ ] Adicionar testes de stress/carga
- [ ] Implementar rate limiting para denúncias
- [ ] Dashboard de auditoria tempo-real
- [ ] Webhooks para eventos críticos
- [ ] Integração com sistemas de email/SMS para notificações
- [ ] Metricas de Prometheus para monitoramento

---

**Status:** ✅ Implementação Completa
**Data:** 30/09/2026
