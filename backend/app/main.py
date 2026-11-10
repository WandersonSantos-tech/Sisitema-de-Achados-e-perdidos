from app.api.v1.endpoints.reviews import router as reviews_router, user_reviews_router
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response as FileResponse
from azure.core.exceptions import ResourceNotFoundError, AzureError
import asyncio

from app.core.config import settings
from app.services.azure_blob_service import AzureBlobService
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.items import router as items_router
from app.api.v1.endpoints.notifications import router as notifications_router
from app.api.v1.endpoints.categories import router as categories_router
from app.api.v1.endpoints.claims import router as claims_router
from app.api.v1.endpoints.messages import router as messages_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.integrations import router as integrations_router
from app.api.v1.endpoints.security import router as security_router


UPLOAD_PATH = Path(settings.UPLOAD_DIR).expanduser().resolve()
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/uploads/{blob_path:path}", include_in_schema=False)
async def get_uploaded_image(blob_path: str):
    if not blob_path.startswith("items/") or ".." in blob_path.split("/"):
        raise HTTPException(status_code=404, detail="Imagem não encontrada.")

    try:
        service = AzureBlobService()

        content = await asyncio.to_thread(service.download, blob_path)

        extension = Path(blob_path).suffix.lower()
        content_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }

        return FileResponse(
            content=content,
            media_type=content_types.get(
                extension, "application/octet-stream"),
            headers={"Cache-Control": "public, max-age=3600"},
        )

    except ResourceNotFoundError:
        raise HTTPException(status_code=404, detail="Imagem não encontrada.")
    except AzureError:
        raise HTTPException(
            status_code=503, detail="Armazenamento indisponível.")


# Registrar routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(items_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(categories_router, prefix=settings.API_V1_STR)
app.include_router(claims_router, prefix=settings.API_V1_STR)
app.include_router(messages_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(integrations_router, prefix=settings.API_V1_STR)
app.include_router(security_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
    }


# Rotas adicionais importadas do backend remoto.
app.include_router(reviews_router, prefix=settings.API_V1_STR)
app.include_router(user_reviews_router, prefix=settings.API_V1_STR)
