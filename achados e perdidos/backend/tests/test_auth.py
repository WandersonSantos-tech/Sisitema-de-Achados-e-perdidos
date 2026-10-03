"""Testes de autenticação (RF01, RF02, RF03)."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio


class TestAuthRegister:
    """Testes para registro de usuário (RF01)."""

    async def test_register_success(self, async_client: AsyncClient):
        """Teste de registro bem-sucedido com dados válidos."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "name": "Novo Usuário",
                "email": "novo@test.com",
                "phone": "11999999999",
                "password": "senhaForte123!",
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Novo Usuário"
        assert data["email"] == "novo@test.com"
        assert "password" not in data

    async def test_register_duplicate_email(
        self,
        async_client: AsyncClient,
        test_user,
    ):
        """Teste de bloqueio de e-mails duplicados."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "name": "Outro Nome",
                "email": test_user.email,  # Email já existente
                "phone": "11888888888",
                "password": "senhaForte123!",
            }
        )

        assert response.status_code == 409
        assert "já cadastrado" in response.json()["detail"].lower()

    async def test_register_invalid_email(self, async_client: AsyncClient):
        """Teste com e-mail inválido."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "name": "Test",
                "email": "email_invalido",  # Email sem @
                "phone": "11999999999",
                "password": "senhaForte123!",
            }
        )

        assert response.status_code == 422  # Validation error

    async def test_register_missing_fields(self, async_client: AsyncClient):
        """Teste com campos obrigatórios ausentes."""
        response = await async_client.post(
            "/api/v1/auth/register",
            json={
                "name": "Test",
                # email faltando
                "password": "senhaForte123!",
            }
        )

        assert response.status_code == 422


class TestAuthLogin:
    """Testes para login (RF02)."""

    async def test_login_success(
        self,
        async_client: AsyncClient,
        test_user,
    ):
        """Teste de login bem-sucedido com credenciais corretas."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "senha123",  # Senha padrão do fixture
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_invalid_email(self, async_client: AsyncClient):
        """Teste de login com e-mail inexistente."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": "naoexiste@test.com",
                "password": "qualquersenha",
            }
        )

        assert response.status_code == 401
        assert "Credenciais inválidas" in response.json()["detail"]

    async def test_login_invalid_password(
        self,
        async_client: AsyncClient,
        test_user,
    ):
        """Teste de login com senha incorreta."""
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "senhaErrada",
            }
        )

        assert response.status_code == 401
        assert "Credenciais inválidas" in response.json()["detail"]


class TestAuthMe:
    """Testes para endpoint /auth/me."""

    async def test_get_current_user_authenticated(
        self,
        async_client: AsyncClient,
        user_token_headers,
        test_user,
    ):
        """Teste de consulta de usuário autenticado."""
        response = await async_client.get(
            "/api/v1/auth/me",
            headers=user_token_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name

    async def test_get_current_user_not_authenticated(
        self,
        async_client: AsyncClient,
    ):
        """Teste de acesso sem autenticação."""
        response = await async_client.get("/api/v1/auth/me")

        assert response.status_code == 401

    async def test_get_current_user_invalid_token(
        self,
        async_client: AsyncClient,
    ):
        """Teste com token inválido."""
        response = await async_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer token_invalido"},
        )

        assert response.status_code == 401


class TestPasswordReset:
    """Testes para recuperação de senha (RF03)."""

    async def test_forgot_password_request(
        self,
        async_client: AsyncClient,
        test_user,
    ):
        """Teste de solicitação de recuperação de senha."""
        response = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_user.email}
        )

        # Deve retornar sucesso mesmo se e-mail não existir (segurança)
        assert response.status_code == 200

    async def test_reset_password_with_invalid_token(
        self,
        async_client: AsyncClient,
    ):
        """Teste de reset com token inválido."""
        response = await async_client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "token_invalido",
                "new_password": "novaSenha123!",
            }
        )

        assert response.status_code in [400, 401]
