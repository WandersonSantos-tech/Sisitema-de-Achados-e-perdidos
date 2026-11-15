"""Regressão administrativa do fluxo atual, sem denúncias."""
import importlib.util
from pathlib import Path
import pytest

@pytest.mark.asyncio
async def test_current_admin_flow(monkeypatch):
    from app.services.dsgner_service import dsgner_service
    from unittest.mock import AsyncMock
    sent = {}
    async def create(**kwargs):
        sent.update(kwargs)
        return {"id": "regression-document", "signing_url": "https://sign.example/return"}
    async def status(signature_id):
        return {"id": signature_id, "status": "signed", "external_id": sent["external_id"], "metadata": sent["metadata"]}
    monkeypatch.setattr(dsgner_service, "_headers", lambda: {})
    monkeypatch.setattr(dsgner_service, "create_signature_request", AsyncMock(side_effect=create))
    monkeypatch.setattr(dsgner_service, "get_signature_status", AsyncMock(side_effect=status))
    spec = importlib.util.spec_from_file_location("current_flow", Path(__file__).parents[1] / "validation" / "test_flow.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    await module.main()
