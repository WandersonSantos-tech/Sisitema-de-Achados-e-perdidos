"""Middleware para logging estruturado de requisições HTTP."""
from __future__ import annotations

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que registra todas as requisições HTTP com:
    - ID único da requisição (header X-Request-ID)
    - Método HTTP, rota e código de status
    - IP do cliente
    - Tempo de processamanto em milissegundos
    - Stack trace de exceções não tratadas
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Middleware que intercepta requisição e resposta.
        """
        # Gerar ID único para a requisição
        request_id = str(uuid.uuid4())

        # Extrair informações da requisição
        method = request.method
        path = request.url.path
        query_string = request.url.query or ""
        client_ip = (
            request.client.host
            if request.client
            else "unknown"
        )

        # Iniciar cronômetro
        start_time = time.time()

        # Headers sensíveis a não logar
        sensitive_headers = {"authorization", "x-api-key", "password"}

        # Log da requisição recebida
        context = {
            "event": "HTTP_REQUEST_STARTED",
            "request_id": request_id,
            "method": method,
            "path": path,
            "query_string": query_string,
            "client_ip": client_ip,
        }

        logger.info(
            f"Requisição recebida: {method} {path}",
            extra={"context": context}
        )

        try:
            # Processar requisição
            response = await call_next(request)

        except Exception as e:
            # Capturar exceções não tratadas
            process_time_ms = (time.time() - start_time) * 1000

            import traceback
            stack_trace = traceback.format_exc()

            context_error = {
                "event": "HTTP_ERROR_UNHANDLED",
                "request_id": request_id,
                "method": method,
                "path": path,
                "client_ip": client_ip,
                "process_time_ms": round(process_time_ms, 2),
                "status_code": 500,
                "error_type": type(e).__name__,
                "error_message": str(e),
                "stack_trace": stack_trace,
            }

            logger.error(
                f"Erro não tratado em {method} {path}",
                extra={"context": context_error}
            )

            # Re-lançar exceção para FastAPI tratar com sua própria exception handler
            raise

        # Calcular tempo de processamento
        process_time_ms = (time.time() - start_time) * 1000

        # Log da resposta
        status_code = response.status_code
        context_response = {
            "event": "HTTP_REQUEST_COMPLETED",
            "request_id": request_id,
            "method": method,
            "path": path,
            "query_string": query_string,
            "client_ip": client_ip,
            "status_code": status_code,
            "process_time_ms": round(process_time_ms, 2),
        }

        # Log com nível apropriado conforme status code
        if status_code >= 500:
            log_level = logging.ERROR
            msg = f"Erro 5xx: {method} {path} - Status {status_code}"
        elif status_code >= 400:
            log_level = logging.WARNING
            msg = f"Erro 4xx: {method} {path} - Status {status_code}"
        else:
            log_level = logging.INFO
            msg = f"Sucesso: {method} {path} - Status {status_code} ({process_time_ms:.2f}ms)"

        logger.log(log_level, msg, extra={"context": context_response})

        # Adicionar header de request ID na resposta
        response.headers["X-Request-ID"] = request_id

        return response
