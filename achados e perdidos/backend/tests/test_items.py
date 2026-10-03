"""Testes de gerenciamento de itens (RF04, RF05, RF06, RF12, RF13, RF14)."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio
pytest_plugins = ("pytest_asyncio",)


class TestItemCreation:
    """Testes para criação de itens (RF04, RF05)."""

    async def test_create_item_perdido_success(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_category,
    ):
        """Teste de criação bem-sucedida de item PERDIDO."""
        response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Celular Samsung Galaxy",
                "description": "Samsung Galaxy A12 preto",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "Av. Paulista, São Paulo",
                "location_lat": -23.5505,
                "location_lon": -46.6333,
                "event_date": "2024-01-15",
                "secret_details": "Código IMSI: 12345",
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Celular Samsung Galaxy"
        assert data["type"] == "PERDIDO"
        assert data["status"] == "PERDIDO"

    async def test_create_item_encontrado_success(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_category,
    ):
        """Teste de criação bem-sucedida de item ENCONTRADO."""
        response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Carteira marrom",
                "description": "Carteira de couro marrom com documentos",
                "type": "ENCONTRADO",
                "category_id": test_category.id,
                "location_name": "Central de São Paulo",
                "location_lat": -23.5505,
                "location_lon": -46.6333,
                "event_date": "2024-01-16",
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "ENCONTRADO"

    async def test_create_item_missing_fields(
        self,
        async_client: AsyncClient,
        user_token_headers,
    ):
        """Teste com campos obrigatórios ausentes."""
        response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Só título",
                # description, type, category_id faltando
            }
        )

        assert response.status_code == 422

    async def test_create_item_not_authenticated(
        self,
        async_client: AsyncClient,
        test_category,
    ):
        """Teste de criação sem autenticação."""
        response = await async_client.post(
            "/api/v1/items",
            json={
                "title": "Teste",
                "description": "Teste",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
            }
        )

        assert response.status_code == 401


class TestItemPrivacy:
    """Testes de privacidade - secret_details (RF12, RNF18)."""

    async def test_secret_details_visible_to_owner(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_user,
        test_category,
    ):
        """Teste: secret_details retornado apenas para o autor."""
        # Criar item com detalhes secretos
        create_response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Celular",
                "description": "Descrição",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
                "secret_details": "Código IMSI secreto",
            }
        )

        assert create_response.status_code == 201
        item_id = create_response.json()["id"]

        # Apelando item como proprietário
        detail_response = await async_client.get(
            f"/api/v1/items/{item_id}",
            headers=user_token_headers,
        )

        assert detail_response.status_code == 200
        data = detail_response.json()
        assert "secret_details" in data  # Deve ter o campo
        assert data["secret_details"] == "Código IMSI secreto"

    async def test_secret_details_hidden_from_others(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_user_2,
        test_category,
    ):
        """Teste: secret_details oculto para outros usuários."""
        # Criar item como test_user (via user_token_headers)
        create_response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Celular",
                "description": "Descrição",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
                "secret_details": "Código IMSI secreto",
            }
        )

        item_id = create_response.json()["id"]

       # Criar token para pelo menos outro usuário
        from app.core.security import create_access_token
        from app.models.enums import UserRole

        other_token = create_access_token(
            subject=test_user_2.id,
            role=UserRole.USER.value,
        )
        other_headers = {"Authorization": f"Bearer {other_token}"}

        # Tentar acessar item como outro usuário
        detail_response = await async_client.get(
            f"/api/v1/items/{item_id}",
            headers=other_headers,
        )

        assert detail_response.status_code == 200
        data = detail_response.json()
        # secret_details não deve estar presente ou deve ser None/vazio
        assert data.get("secret_details") is None or data.get(
            "secret_details") == ""

    async def test_secret_details_hidden_in_list(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_category,
    ):
        """Teste: secret_details nunca retornado em listagens."""
        # Criar item
        create_response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Celular",
                "description": "Descrição",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
                "secret_details": "Código IMSI secreto",
            }
        )

        # Listar itens
        list_response = await async_client.get("/api/v1/items")

        assert list_response.status_code == 200
        data = list_response.json()

        # Verificar que nenhum item tem secret_details na listagem
        if "items" in data:
            for item in data["items"]:
                assert "secret_details" not in item or (
                    "secret_details" in item and item["secret_details"] is None
                )


class TestItemSearch:
    """Testes de busca com filtros (RF06)."""

    async def test_search_by_title(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_category,
    ):
        """Teste de busca por título."""
        # Criar alguns itens
        await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Celular Samsung",
                "description": "Descrição",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
            }
        )

        # Buscar
        response = await async_client.get(
            "/api/v1/items?search=Samsung"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0
        assert any("Samsung" in item["title"] for item in data["items"])

    async def test_search_by_category(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_category,
    ):
        """Teste de filtro por categoria."""
        # Criar item
        await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Item",
                "description": "Descrição",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
            }
        )

        # Filtrar por categoria
        response = await async_client.get(
            f"/api/v1/items?category_id={test_category.id}"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0

    async def test_search_by_type(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_category,
    ):
        """Teste de filtro por tipo (PERDIDO/ENCONTRADO)."""
        # Criar item PERDIDO
        await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Item Perdido",
                "description": "Descrição",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
            }
        )

        # Filtrar por PERDIDO
        response = await async_client.get("/api/v1/items?type=PERDIDO")

        assert response.status_code == 200
        data = response.json()
        assert all(item["type"] == "PERDIDO" for item in data["items"])


class TestItemStatusHistory:
    """Testes de transição de status e histórico (RF13, RF14)."""

    async def test_item_status_transition(
        self,
        async_client: AsyncClient,
        admin_token_headers,
        test_category,
    ):
        """Teste de transição de status do item."""
        # Criar item
        create_response = await async_client.post(
            "/api/v1/items",
            headers=admin_token_headers,
            json={
                "title": "Item",
                "description": "Descrição",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
            }
        )

        item_id = create_response.json()["id"]

        # Alterar status via admin
        update_response = await async_client.patch(
            f"/api/v1/admin/items/{item_id}/status",
            headers=admin_token_headers,
            json={
                "status": "DEVOLVIDO",
                "note": "Item devolvido ao proprietário",
            }
        )

        assert update_response.status_code == 200
        data = update_response.json()
        assert data["status"] == "DEVOLVIDO"
