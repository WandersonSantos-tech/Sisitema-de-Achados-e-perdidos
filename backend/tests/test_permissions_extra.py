"""Testes de permissões e autorização (RNF04)."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio
pytest_plugins = ("pytest_asyncio",)


class TestAdminAuthorization:
    """Testes de autorização para rotas administrativas (RNF04)."""

    async def test_common_user_forbidden_admin_endpoints(
        self,
        async_client: AsyncClient,
        user_token_headers,
    ):
        """
        Teste: Requisições de usuários comuns para /admin/* retornam HTTP 403 Forbidden.

        Implementa RNF04 - Proteção de rotas administrativas.
        """
        # Testar alguns endpoints administrativos
        admin_endpoints = [
            "/api/v1/admin/stats",
            "/api/v1/admin/users",
            "/api/v1/admin/reports",
            "/api/v1/admin/categories",
        ]

        for endpoint in admin_endpoints:
            response = await async_client.get(
                endpoint,
                headers=user_token_headers,
            )

            assert response.status_code == 403, (
                f"Endpoint {endpoint} deve retornar 403 para usuário comum, "
                f"mas retornou {response.status_code}"
            )
            assert "Permissão de administrador necessária" in response.json()[
                "detail"]

    async def test_unauthenticated_user_unauthorized_admin(
        self,
        async_client: AsyncClient,
    ):
        """Teste: Requisições sem autenticação para /admin/* retornam HTTP 401."""
        response = await async_client.get("/api/v1/admin/stats")

        assert response.status_code == 401

    async def test_admin_user_can_access_admin_endpoints(
        self,
        async_client: AsyncClient,
        admin_token_headers,
    ):
        """Teste: Usuário administrador pode acessar endpoints /admin/*."""
        response = await async_client.get(
            "/api/v1/admin/stats",
            headers=admin_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_active_items" in data


class TestItemOwnershipPermissions:
    """Testes de permissões sobre propriedade de itens."""

    async def test_user_cannot_delete_others_item(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_user_2,
        test_category,
    ):
        """Teste: Usuário não pode deletar ou alterar itens de terceiros."""
        # Criar item como test_user (via user_token_headers)
        create_response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Item do User 1",
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

        # Tentar deletar como test_user_2
        from app.core.security import create_access_token
        from app.models.enums import UserRole

        other_token = create_access_token(
            subject=test_user_2.id,
            role=UserRole.USER.value,
        )
        other_headers = {"Authorization": f"Bearer {other_token}"}

        delete_response = await async_client.delete(
            f"/api/v1/items/{item_id}",
            headers=other_headers,
        )

        # Deve retornar 403 Forbidden ou 404 Not Found
        assert delete_response.status_code in [403, 404]

    async def test_user_cannot_update_others_item(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_user_2,
        test_category,
    ):
        """Teste: Usuário não pode atualizar itens de terceiros."""
        # Criar item
        create_response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Item Original",
                "description": "Descrição original",
                "type": "PERDIDO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
            }
        )

        item_id = create_response.json()["id"]

        # Tentar atualizar como outro usuário
        from app.core.security import create_access_token
        from app.models.enums import UserRole

        other_token = create_access_token(
            subject=test_user_2.id,
            role=UserRole.USER.value,
        )
        other_headers = {"Authorization": f"Bearer {other_token}"}

        update_response = await async_client.put(
            f"/api/v1/items/{item_id}",
            headers=other_headers,
            json={
                "title": "Título Modificado",
                "description": "Descrição modificada",
                "type": "ENCONTRADO",
                "category_id": test_category.id,
                "location_name": "São Paulo",
                "location_lat": 0.0,
                "location_lon": 0.0,
                "event_date": "2024-01-15",
            }
        )

        # Deve retornar erro de permissão
        assert update_response.status_code in [403, 404]


class TestAdminCRUDPermissions:
    """Testes de permissões CRUD para operações administrativas."""

    async def test_admin_can_delete_item(
        self,
        async_client: AsyncClient,
        user_token_headers,
        admin_token_headers,
        test_category,
    ):
        """Teste: Admin pode deletar qualquer item."""
        # Criar item como usuário comum
        create_response = await async_client.post(
            "/api/v1/items",
            headers=user_token_headers,
            json={
                "title": "Item a ser deletado",
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

        # Admin deletar o item
        delete_response = await async_client.delete(
            f"/api/v1/admin/items/{item_id}",
            headers=admin_token_headers,
        )

        assert delete_response.status_code in [200, 204]

    async def test_admin_can_change_user_status(
        self,
        async_client: AsyncClient,
        admin_token_headers,
        test_user,
    ):
        """Teste: Admin pode ativar/desativar usuários."""
        # Desativar usuário
        deactivate_response = await async_client.patch(
            f"/api/v1/admin/users/{test_user.id}",
            headers=admin_token_headers,
            json={"is_active": False}
        )

        assert deactivate_response.status_code == 200
        data = deactivate_response.json()
        assert data["is_active"] == False

        # Reativar
        activate_response = await async_client.patch(
            f"/api/v1/admin/users/{test_user.id}",
            headers=admin_token_headers,
            json={"is_active": True}
        )

        assert activate_response.status_code == 200
        assert activate_response.json()["is_active"] == True

    async def test_admin_cannot_deactivate_self(
        self,
        async_client: AsyncClient,
        admin_token_headers,
        test_admin,
    ):
        """Teste: Admin não pode desativar sua própria conta."""
        response = await async_client.patch(
            f"/api/v1/admin/users/{test_admin.id}",
            headers=admin_token_headers,
            json={"is_active": False}
        )

        # Deve retornar erro
        assert response.status_code in [400, 403]


class TestReportSubmissionPermissions:
    """Testes de permissões para submissão de denúncias."""

    async def test_user_cannot_report_self(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_user,
    ):
        """Teste: Usuário não pode denunciar a si próprio."""
        response = await async_client.post(
            "/api/v1/reports",
            headers=user_token_headers,
            json={
                "reason": "Denúncia contra meu usuário",
                "reported_user_id": str(test_user.id),
            }
        )

        assert response.status_code == 400
        assert "não pode denunciar a si" in response.json()["detail"].lower()
