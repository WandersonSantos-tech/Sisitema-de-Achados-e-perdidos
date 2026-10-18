"""Regressão administrativa do fluxo atual, sem denúncias."""
import importlib.util
from pathlib import Path
import pytest

@pytest.mark.asyncio
async def test_current_admin_flow():
    spec = importlib.util.spec_from_file_location("current_flow", Path(__file__).parents[1] / "validation" / "test_flow.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    await module.main()
