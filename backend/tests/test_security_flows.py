import hashlib
import json
import time
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import jwt
import pyotp
import pytest
from cryptography.fernet import Fernet

from app.core.auth_limits import _attempts
from app.core.config import settings
from app.models.claim import Claim
from app.models.enums import ClaimStatus, ItemStatus, ItemType
from app.models.item import Item
from app.services import email_service
from app.services.dsgner_service import dsgner_service


@pytest.fixture(autouse=True)
def isolated_security(monkeypatch):
    _attempts.clear()
    monkeypatch.setattr(settings, "TWO_FACTOR_ENCRYPTION_KEY", Fernet.generate_key().decode())


async def test_reset_single_use_and_enumeration(async_client, test_user, test_db_session, monkeypatch):
    send = AsyncMock()
    monkeypatch.setattr(email_service, "send_password_reset_email", send)
    known = await async_client.post("/api/v1/auth/forgot-password", json={"email": test_user.email})
    unknown = await async_client.post("/api/v1/auth/forgot-password", json={"email": "absent@test.com"})
    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()
    token = send.call_args.args[1]
    assert test_user.password_reset_digest == hashlib.sha256(token.encode()).hexdigest()
    body = {"token": token, "new_password": "replacement123"}
    assert (await async_client.post("/api/v1/auth/reset-password", json=body)).status_code == 200
    assert (await async_client.post("/api/v1/auth/reset-password", json=body)).status_code == 400
    assert (await async_client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "replacement123"})).status_code == 200
    assert (await async_client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "password123"})).status_code == 401


async def test_expired_reset(async_client, test_user, test_db_session):
    test_user.password_reset_digest = hashlib.sha256(b"expired").hexdigest()
    test_user.password_reset_expires = time.time() - 1
    await test_db_session.commit()
    assert (await async_client.post("/api/v1/auth/reset-password", json={"token": "expired", "new_password": "replacement123"})).status_code == 400


async def test_reset_abuse_and_disabled_email(async_client, user_token_headers):
    for _ in range(3):
        assert (await async_client.post("/api/v1/auth/forgot-password", json={"email": "absent@test.com"})).status_code == 200
    assert (await async_client.post("/api/v1/auth/forgot-password", json={"email": "absent@test.com"})).status_code == 429
    assert (await async_client.post("/api/v1/integrations/email/send", headers=user_token_headers, json={})).status_code == 410


async def test_two_factor_lifecycle(async_client, test_user, user_token_headers, test_db_session):
    setup = await async_client.post("/api/v1/security/2fa/setup", headers=user_token_headers)
    assert setup.status_code == 200
    secret = setup.json()["secret"]
    assert setup.json()["qr_code"].startswith("data:image/svg+xml;base64,")
    assert test_user.two_factor_secret.startswith("enc:")
    assert not test_user.is_two_factor_enabled
    assert (await async_client.post("/api/v1/security/2fa/verify", headers=user_token_headers, json={"code": "000000"})).status_code == 400
    code = pyotp.TOTP(secret).now()
    assert (await async_client.post("/api/v1/security/2fa/verify", headers=user_token_headers, json={"code": code})).status_code == 200
    login = await async_client.post("/api/v1/auth/login", json={"email": test_user.email, "password": "password123"})
    assert "access_token" not in login.json()
    challenge = login.json()["challenge_token"]
    assert (await async_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer " + challenge})).status_code == 401
    verify = {"challenge_token": challenge, "code": code}
    # Initial setup code cannot be replayed as a login factor.
    assert (await async_client.post("/api/v1/auth/2fa/verify", json=verify)).status_code == 401
    test_user.two_factor_last_step = None
    await test_db_session.commit()
    complete = await async_client.post("/api/v1/auth/2fa/verify", json=verify)
    assert complete.status_code == 200
    assert (await async_client.get("/api/v1/auth/me", headers={"Authorization": "Bearer " + complete.json()["access_token"]})).status_code == 200
    assert (await async_client.post("/api/v1/auth/2fa/verify", json=verify)).status_code == 401
    test_user.two_factor_last_step = None
    await test_db_session.commit()
    assert (await async_client.post("/api/v1/security/2fa/disable", headers=user_token_headers, json={"code": code, "password": "wrong"})).status_code == 400
    assert (await async_client.post("/api/v1/security/2fa/disable", headers=user_token_headers, json={"code": code, "password": "password123"})).status_code == 200
    assert not test_user.is_two_factor_enabled


async def test_expired_challenge(async_client, test_user):
    token = jwt.encode({"sub": str(test_user.id), "scope": "2fa_login", "exp": datetime.now(timezone.utc) - timedelta(seconds=1)}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    assert (await async_client.post("/api/v1/auth/2fa/verify", json={"challenge_token": token, "code": "123456"})).status_code == 401


async def test_return_signature_provider_confirmation(async_client, test_user, test_admin, test_category, test_db_session, admin_token_headers, user_token_headers, monkeypatch):
    item = Item(title="Mochila", description="Mochila azul", type=ItemType.ENCONTRADO,
                status=ItemStatus.EM_NEGOCIACAO, user_id=test_admin.id, category_id=test_category.id,
                location_name="Recepção", event_date=datetime.now(timezone.utc))
    test_db_session.add(item)
    await test_db_session.flush()
    claim = Claim(item_id=item.id, requester_id=test_user.id, responsible_id=test_admin.id,
                  proof_description="Descrição", status=ClaimStatus.APROVADA,
                  pickup_at=datetime.now(timezone.utc) + timedelta(days=1))
    test_db_session.add(claim)
    await test_db_session.commit()
    prefix = f"/api/v1/claims/claims/{claim.id}"
    monkeypatch.setattr(dsgner_service, "_headers", lambda: {})
    create = AsyncMock(return_value={"id": "provider-id", "signing_url": "https://sign.example/document"})
    monkeypatch.setattr(dsgner_service, "create_signature_request", create)
    assert (await async_client.post(prefix + "/signature", headers=user_token_headers)).status_code == 403
    assert (await async_client.post(prefix + "/signature", headers=admin_token_headers)).status_code == 200
    assert (await async_client.post(prefix + "/signature", headers=admin_token_headers)).status_code == 200
    assert create.await_count == 1
    assert not claim.returned_at
    state = json.loads(claim.signature)
    result = {"id": "provider-id", "external_id": str(claim.id), "metadata": {"document_hash": state["document_hash"]}, "status": "pending"}
    monkeypatch.setattr(dsgner_service, "get_signature_status", AsyncMock(return_value=result))
    assert (await async_client.get(prefix + "/signature", headers=user_token_headers)).status_code == 200
    assert (await async_client.post(prefix + "/return", headers=admin_token_headers, json={})).status_code == 409
    for terminal in ("cancelled", "expired", "failed"):
        result["status"] = terminal
        assert (await async_client.post(prefix + "/return", headers=admin_token_headers, json={})).status_code == 409
        assert not claim.returned_at
    result["metadata"]["document_hash"] = "wrong-document"
    result["status"] = "signed"
    assert (await async_client.post(prefix + "/return", headers=admin_token_headers, json={})).status_code == 502
    assert not claim.returned_at
    result["metadata"]["document_hash"] = state["document_hash"]
    result["status"] = "signed"
    assert (await async_client.post(prefix + "/return", headers=admin_token_headers, json={})).status_code == 200
    assert claim.returned_at and item.status == ItemStatus.DEVOLVIDO


async def test_expired_setup_and_totp(async_client, test_user, user_token_headers, test_db_session):
    setup = (await async_client.post("/api/v1/security/2fa/setup", headers=user_token_headers)).json()
    expired_code = pyotp.TOTP(setup["secret"]).at(time.time() - 120)
    assert (await async_client.post("/api/v1/security/2fa/verify", headers=user_token_headers, json={"code": expired_code})).status_code == 400
    test_user.two_factor_setup_expires = time.time() - 1
    await test_db_session.commit()
    assert (await async_client.post("/api/v1/security/2fa/verify", headers=user_token_headers, json={"code": pyotp.TOTP(setup["secret"]).now()})).status_code == 400
    assert not test_user.is_two_factor_enabled


async def test_uncertain_signature_is_not_resent(test_user, test_admin, test_category, test_db_session, monkeypatch):
    from app.services.return_signature_service import create_signature
    from app.services.dsgner_service import DsgnerServiceError
    from fastapi import HTTPException
    item = Item(title="Objeto", description="Dados reais", type=ItemType.ENCONTRADO,
                status=ItemStatus.EM_NEGOCIACAO, user_id=test_admin.id, category_id=test_category.id,
                location_name="Recepção", event_date=datetime.now(timezone.utc))
    test_db_session.add(item)
    await test_db_session.flush()
    claim = Claim(item_id=item.id, requester_id=test_user.id, responsible_id=test_admin.id,
                  proof_description="Prova", pickup_at=datetime.now(timezone.utc))
    test_db_session.add(claim)
    await test_db_session.commit()
    monkeypatch.setattr(dsgner_service, "_headers", lambda: {})
    create = AsyncMock(side_effect=DsgnerServiceError("Timeout"))
    monkeypatch.setattr(dsgner_service, "create_signature_request", create)
    with pytest.raises(HTTPException) as exc:
        await create_signature(test_db_session, claim, item, test_admin)
    assert exc.value.status_code == 502
    state = await create_signature(test_db_session, claim, item, test_admin)
    assert state["status"] == "reconciliation_required"
    assert create.await_count == 1
    assert not claim.returned_at


async def test_smtp_transport(monkeypatch):
    smtp = AsyncMock()
    factory = __import__("unittest.mock", fromlist=["Mock"]).Mock(return_value=smtp)
    monkeypatch.setattr(email_service.aiosmtplib, "SMTP", factory)
    monkeypatch.setattr(settings, "SMTP_HOST", "localhost")
    monkeypatch.setattr(settings, "SMTP_USE_TLS", False)
    monkeypatch.setattr(settings, "SMTP_USERNAME", None)
    await email_service.BrevoEmailService().send_via_smtp(to_email="user@test.com", subject="Recuperação", text_body="Teste")
    smtp.connect.assert_awaited_once()
    smtp.send_message.assert_awaited_once()
    smtp.quit.assert_awaited_once()
    assert factory.call_args.kwargs["start_tls"] is False


def test_auth_migration_encrypts_existing_secrets(monkeypatch):
    import importlib.util
    from pathlib import Path
    import sqlalchemy as sa
    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    path = Path(__file__).parents[1] / "alembic/versions/c20261114_auth.py"
    spec = importlib.util.spec_from_file_location("auth_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = sa.create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.exec_driver_sql("CREATE TABLE users (id TEXT PRIMARY KEY, two_factor_secret VARCHAR(255))")
        secret = pyotp.random_base32()
        connection.execute(sa.text("INSERT INTO users VALUES (:id, :secret)"), {"id": "existing", "secret": secret})
        monkeypatch.setattr(migration, "op", Operations(MigrationContext.configure(connection)))
        migration.upgrade()
        encrypted = connection.execute(sa.text("SELECT two_factor_secret FROM users")).scalar_one()
        assert encrypted.startswith("enc:")
        assert Fernet(settings.TWO_FACTOR_ENCRYPTION_KEY.encode()).decrypt(encrypted[4:].encode()).decode() == secret
        columns = {c["name"] for c in sa.inspect(connection).get_columns("users")}
        assert {"password_reset_digest", "password_reset_expires", "two_factor_last_step", "two_factor_challenge", "two_factor_setup_expires"} <= columns
    engine.dispose()
