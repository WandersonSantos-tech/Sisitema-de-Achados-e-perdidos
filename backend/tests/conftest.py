"""Configuração e fixtures para testes automatizados."""
from __future__ import annotations

import asyncio
import os
import shutil
import tempfile
from uuid import UUID

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.core.database import Base
from app.core.security import create_access_token
from app.main import app
from app.models.enums import UserRole
from app.models.user import User
from app.models.category import Category
from app.services.auth_service import hash_password


# ============================================================================
# Configuração do Event Loop Assíncrono
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Configura event loop para toda sessão de testes."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()

    yield loop
    loop.close()


# ============================================================================
# Configuração do Banco de Dados de Teste
# ============================================================================

@pytest_asyncio.fixture(scope="function")
async def test_db_engine():
    """
    Cria um engine SQLAlchemy assíncrono para testes usando SQLite em arquivo.

    Escopo: function (criar novo engine para cada teste)
    """
    # Criar diretório temporário único para cada teste
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "test.db")

    engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_path}",
        connect_args={"check_same_thread": False, "timeout": 30},
        poolclass=StaticPool,
        echo=False,
    )

    # Criar todas as tabelas
    async with engine.begin() as conn:
        # Remover índices duplicados se existirem
        await conn.run_sync(lambda c: c.execute("PRAGMA foreign_keys=OFF"))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(lambda c: c.execute("PRAGMA foreign_keys=ON"))
    async_session = async_sessionmaker(
        test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        # Override da dependência get_db para usar sessão de teste
        async def override_get_db():
            yield session

        app.dependency_overrides[get_db] = override_get_db

        yield session

        # Limpar overrides
        app.dependency_overrides.clear()


# ============================================================================
# Cliente HTTP Assíncrono
# ============================================================================

@pytest_asyncio.fixture(scope="function")
async def async_client(test_db_session):
    """Cliente HTTP assíncrono para testar endpoints."""
    async with AsyncClient(
        app=app,
        base_url="http://test",
    ) as client:
        yield client


# ============================================================================
# Fixtures de Dados de Teste
# ============================================================================

@pytest_asyncio.fixture(scope="function")
async def test_category(test_db_session):
    """Cria uma categoria de teste."""
    category = Category(name="Eletrônicos", description="Itens eletrônicos")
    test_db_session.add(category)
    await test_db_session.commit()
    await test_db_session.refresh(category)
    return category


@pytest_asyncio.fixture(scope="function")
async def test_user(test_db_session):
    """Cria um usuário comum de teste."""
    user = User(
        name="Test User",
        email="testuser@test.com",
        phone="11999999999",
        password_hash=hash_password("password123"),
        role=UserRole.USER,
        is_active=True,
    )
    test_db_session.add(user)
    await test_db_session.commit()
    await test_db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def test_user_2(test_db_session):
    """Cria um segundo usuário de teste."""
    user = User(
        name="Test User 2",
        email="testuser2@test.com",
        phone="11988888888",
        password_hash=hash_password("password123"),
        role=UserRole.USER,
        is_active=True,
    )
    test_db_session.add(user)
    await test_db_session.commit()
    await test_db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def test_admin(test_db_session):
    """Cria um usuário admin de teste."""
    admin = User(
        name="Test Admin",
        email="admin@test.com",
        phone="11987654321",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    test_db_session.add(admin)
    await test_db_session.commit()
    await test_db_session.refresh(admin)
    return admin


# ============================================================================
# Fixtures de Tokens e Headers
# ============================================================================

@pytest_asyncio.fixture(scope="function")
async def user_token(test_user):
    """Gera JWT token para test_user."""
    return create_access_token(
        subject=str(test_user.id),
        role=UserRole.USER.value,
    )


@pytest_asyncio.fixture(scope="function")
async def user_token_headers(user_token):
    """Headers de autenticação para test_user."""
    return {"Authorization": f"Bearer {user_token}"}


@pytest_asyncio.fixture(scope="function")
async def admin_token(test_admin):
    """Gera JWT token para test_admin."""
    return create_access_token(
        subject=str(test_admin.id),
        role=UserRole.ADMIN.value,
    )


@pytest_asyncio.fixture(scope="function")
async def admin_token_headers(admin_token):
    """Headers de autenticação para test_admin."""
    return {"Authorization": f"Bearer {admin_token}"}


# ============================================================================
# Fixtures Utilitárias
# ============================================================================

@pytest_asyncio.fixture(scope="function")
def assert_dict_contains_subset():
    """Utilitário para verificar subset de dicts."""
    def _assert(subset: dict, full: dict):
        for key, value in subset.items():
            assert key in full, f"Key '{key}' not found in {full}"
            assert full[key] == value, f"{key}: expected {value}, got {full[key]}"
    return _assert


# ============================================================================
# Configuração do Pytest
# ============================================================================

def pytest_configure(config):
    """Configuração do pytest."""
    config.addinivalue_line("markers", "unit: marca um teste como unitário")
    config.addinivalue_line(
        "markers", "integration: marca um teste como integração")
