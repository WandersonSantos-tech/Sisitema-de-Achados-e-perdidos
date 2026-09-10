from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.database import AsyncSessionLocal
from app.models.enums import NotificationType
from app.models.item import Item
from app.models.user import User
from app.schemas.item import ItemCreate, ItemListResponse, ItemResponse, ItemUpdate
from app.schemas.match import MatchListResponse, MatchResultResponse
from app.services.matching_service import matching_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/items", tags=["items"])


async def run_item_matching_background(
    item_id: UUID,
    db_session_factory=AsyncSessionLocal,
) -> None:
    """
    Task executada em background para encontrar correspondências de um item.
    Garante que cada correspondência gera apenas uma notificação.
    """
    async with db_session_factory() as session:
        try:
            # Recupera o item
            result = await session.execute(select(Item).where(Item.id == item_id))
            item = result.scalar_one_or_none()

            if not item:
                return

            # Executa o matching
            matches = await matching_service.find_matches_for_item(session, item_id)

            # Cria notificações para cada correspondência encontrada
            for match in matches:
                # Verifica se já existe notificação (idempotência)
                existing = await notification_service.check_existing_match_notification(
                    session,
                    item.user_id,
                    item_id,
                    match["matched_item_id"],
                )

                if not existing:
                    # Cria mensagem descritiva
                    message = (
                        f"Encontramos um possível objeto correspondente ao seu item: "
                        f"{match['matched_item_title']} com {match['similarity_score']:.1f}% "
                        f"de similaridade."
                    )

                    await notification_service.create_notification(
                        session,
                        user_id=item.user_id,
                        item_id=item_id,
                        title="Correspondência Encontrada!",
                        message=message,
                        notification_type=NotificationType.MATCH_FOUND,
                    )

            # Commit de todas as notificações
            await session.commit()

        except Exception as e:
            # Log do erro (pode ser integrado com um sistema de logging)
            print(f"Erro ao executar matching para item {item_id}: {str(e)}")
            await session.rollback()


@router.post("/lost", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_lost_item(
    item_in: ItemCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Cria um novo item perdido.
    Agenda automaticamente a busca de correspondências em background.
    """
    from app.models.enums import ItemType

    if item_in.type != ItemType.PERDIDO.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este endpoint é apenas para itens PERDIDO",
        )

    # Cria o item
    new_item = Item(
        user_id=current_user.id,
        category_id=item_in.category_id,
        type=ItemType.PERDIDO,
        title=item_in.title,
        description=item_in.description,
        secret_details=item_in.secret_details,
        location_name=item_in.location_name,
        latitude=item_in.latitude,
        longitude=item_in.longitude,
        event_date=item_in.event_date,
    )

    db.add(new_item)
    await db.flush()  # Garante que o item tenha um ID
    await db.commit()

    # Agenda o matching em background (não bloqueia a API)
    background_tasks.add_task(
        run_item_matching_background, new_item.id, AsyncSessionLocal
    )

    return ItemResponse.model_validate(new_item)


@router.post("/found", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_found_item(
    item_in: ItemCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Cria um novo item encontrado.
    Agenda automaticamente a busca de correspondências em background.
    """
    from app.models.enums import ItemType

    if item_in.type != ItemType.ENCONTRADO.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este endpoint é apenas para itens ENCONTRADO",
        )

    # Cria o item
    new_item = Item(
        user_id=current_user.id,
        category_id=item_in.category_id,
        type=ItemType.ENCONTRADO,
        title=item_in.title,
        description=item_in.description,
        secret_details=item_in.secret_details,
        location_name=item_in.location_name,
        latitude=item_in.latitude,
        longitude=item_in.longitude,
        event_date=item_in.event_date,
    )

    db.add(new_item)
    await db.flush()  # Garante que o item tenha um ID
    await db.commit()

    # Agenda o matching em background (não bloqueia a API)
    background_tasks.add_task(
        run_item_matching_background, new_item.id, AsyncSessionLocal
    )

    return ItemResponse.model_validate(new_item)


@router.get("", response_model=ItemListResponse)
async def list_items(
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: int = Query(20, ge=1, le=100, description="Itens por página"),
    item_type: str | None = Query(
        None, description="Filtrar por tipo: PERDIDO ou ENCONTRADO"
    ),
    category_id: int | None = Query(None, description="Filtrar por categoria"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Lista os itens do usuário atual com paginação.
    """
    from sqlalchemy import func
    from app.models.enums import ItemType

    query = select(Item).where(Item.user_id == current_user.id)

    if item_type:
        query = query.where(Item.type == getattr(ItemType, item_type))

    if category_id:
        query = query.where(Item.category_id == category_id)

    count_query = (
        select(func.count())
        .select_from(Item)
        .where(Item.user_id == current_user.id)
    )

    if item_type:
        count_query = count_query.where(
            Item.type == getattr(ItemType, item_type)
        )

    if category_id:
        count_query = count_query.where(Item.category_id == category_id)

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    skip = (page - 1) * page_size
    result = await db.execute(
        query.order_by(Item.created_at.desc()).offset(skip).limit(page_size)
    )
    items = result.scalars().all()

    return ItemListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[ItemResponse.model_validate(item) for item in items],
    )


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Recupera os detalhes de um item específico.
    O usuário só pode acessar seus próprios itens.
    """
    result = await db.execute(
        select(Item).where(
            and_(Item.id == item_id, Item.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado",
        )

    return ItemResponse.model_validate(item)


@router.get("/{item_id}/matches", response_model=MatchListResponse)
async def get_item_matches(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Consulta as correspondências sugeridas para um item específico.
    Apenas o proprietário do item pode acessar.
    """
    result = await db.execute(
        select(Item).where(
            and_(Item.id == item_id, Item.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado ou acesso negado",
        )

    matches = await matching_service.find_matches_for_item(db, item_id)

    return MatchListResponse(
        total=len(matches),
        items=[MatchResultResponse(**match) for match in matches],
    )


@router.patch("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: UUID,
    item_in: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Atualiza um item existente.
    Apenas o proprietário pode atualizar.
    """
    result = await db.execute(
        select(Item).where(
            and_(Item.id == item_id, Item.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado ou acesso negado",
        )

    if item_in.category_id is not None:
        item.category_id = item_in.category_id
    if item_in.title is not None:
        item.title = item_in.title
    if item_in.description is not None:
        item.description = item_in.description
    if item_in.secret_details is not None:
        item.secret_details = item_in.secret_details
    if item_in.location_name is not None:
        item.location_name = item_in.location_name
    if item_in.latitude is not None:
        item.latitude = item_in.latitude
    if item_in.longitude is not None:
        item.longitude = item_in.longitude
    if item_in.event_date is not None:
        item.event_date = item_in.event_date

    await db.commit()

    return ItemResponse.model_validate(item)


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Deleta um item.
    Apenas o proprietário pode deletar.
    """
    result = await db.execute(
        select(Item).where(
            and_(Item.id == item_id, Item.user_id == current_user.id)
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado ou acesso negado",
        )

    await db.delete(item)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)