"""Bounded per-process abuse guard. Use one worker locally; shared limiter in production."""
from collections import OrderedDict
from time import monotonic
from fastapi import HTTPException

_attempts = OrderedDict()


def check_limit(key: str, limit: int = 5, seconds: int = 300):
    now = monotonic()
    start, count = _attempts.get(key, (now, 0))
    if now - start >= seconds:
        start, count = now, 0
    _attempts[key] = (start, count + 1)
    _attempts.move_to_end(key)
    if len(_attempts) > 10000:
        _attempts.popitem(last=False)
    if count >= limit:
        raise HTTPException(429, "Muitas tentativas. Aguarde alguns minutos.")
