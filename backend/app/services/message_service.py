from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.claim import Claim
from app.models.enums import UserRole
from app.models.item import Item
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate

if TYPE_CHECKING:
    pass


class MessageService:
    """Serviço de negócio para operações de mensagens com validação de acesso"""

    @staticmethod
    async def validate_participants(db, item, first_id, second_id):
        from app.models.enums import ClaimStatus
        from app.models.status_history import StatusHistory
        if first_id == second_id:
            raise PermissionError("Selecione outra pessoa para conversar")
        people = (await db.scalars(select(User).where(User.id.in_((first_id, second_id))))).all()
        if len(people) != 2 or any(not person.is_active for person in people):
            raise PermissionError("Participante indisponível")
        claims = (await db.scalars(select(Claim).where(
            Claim.item_id == item.id,
            Claim.requester_id.in_((first_id, second_id)),
            Claim.status.in_((ClaimStatus.CORRESPONDENCIA, ClaimStatus.PENDENTE, ClaimStatus.APROVADA))
        ))).all()
        staff_roles = (UserRole.ADMIN, UserRole.COLABORADOR)
        for claim in claims:
            other_id = second_id if claim.requester_id == first_id else first_id
            other = next(person for person in people if person.id == other_id)
            if other_id == item.user_id or claim.responsible_id == other_id:
                return
            if other.role in staff_roles:
                historical = await db.scalar(select(StatusHistory.changed_by).where(
                    StatusHistory.item_id == item.id,
                    StatusHistory.note == f"Reivindicação #{claim.id} aprovada"
                ).order_by(StatusHistory.created_at.desc()).limit(1))
                if historical == other_id or (claim.responsible_id is None and historical is None):
                    return
        raise PermissionError("Os participantes não possuem uma solicitação ativa em comum")

    @staticmethod
    async def send_message(
        db: AsyncSession,
        item_id: uuid.UUID,
        sender: User,
        msg_in: MessageCreate,
    ) -> Message:
        """
        Envia mensagem vinculada a um item para outro usuário.

        Regra de Acesso (RNF04, RNF18):
        - Validar se remetente é dono do item OU possui reivindicação/interesse registrado
        - O destinatário pode ser qualquer usuário envolvido com o item

        Dispara:
        - Notificação NEW_MESSAGE para o destinatário
        """
        from app.services.notification_service import NotificationService
        from app.models.enums import NotificationType

        # Buscar item com proprietário
        result = await db.execute(
            select(Item)
            .where(Item.id == item_id)
            .options(selectinload(Item.user))
        )
        item = result.scalar_one_or_none()

        if not item:
            raise ValueError(f"Item {item_id} não encontrado")

        await MessageService.validate_participants(db, item, sender.id, msg_in.receiver_id)

        # Criar mensagem
        message = Message(
            item_id=item_id,
            sender_id=sender.id,
            receiver_id=msg_in.receiver_id,
            content=msg_in.content,
        )

        db.add(message)
        await db.flush()

        # Disparar notificação para destinatário
        await NotificationService.create_notification(
            db,
            user_id=msg_in.receiver_id,
            item_id=item_id,
            title="Nova Mensagem",
            message=f"{sender.name} enviou uma mensagem sobre o item '{item.title}'",
            notification_type=NotificationType.NEW_MESSAGE,
        )

        return message

    @staticmethod
    async def get_item_conversation(
        db: AsyncSession,
        item_id: uuid.UUID,
        current_user: User,
        other_user_id: uuid.UUID,
    ) -> list[Message]:
        """
        Recupera histórico de mensagens entre dois usuários para um item específico.

        Validações:
        - Usuário logado deve estar envolvido com o item (dono ou claimant)
        - Outro usuário também deve estar envolvido com o item
        - Mensagens ordenadas por created_at ASC (cronologicamente)
        """
        # Validar que current_user está envolvido com item
        item_result = await db.execute(select(Item).where(Item.id == item_id))
        item = item_result.scalar_one_or_none()

        if not item:
            raise ValueError(f"Item {item_id} não encontrado")

        await MessageService.validate_participants(db, item, current_user.id, other_user_id)

        # Recuperar histórico ordenado cronologicamente
        result = await db.execute(
            select(Message)
            .where(
                and_(
                    Message.item_id == item_id,
                    or_(
                        and_(
                            Message.sender_id == current_user.id,
                            Message.receiver_id == other_user_id,
                        ),
                        and_(
                            Message.sender_id == other_user_id,
                            Message.receiver_id == current_user.id,
                        ),
                    ),
                )
            )
            .options(
                selectinload(Message.sender),
                selectinload(Message.receiver),
            )
            .order_by(Message.created_at.asc())
        )
        messages = result.scalars().all()

        return messages

    @staticmethod
    async def get_conversation_with_user(
        db: AsyncSession,
        item_id: uuid.UUID,
        current_user: User,
        other_user_id: uuid.UUID,
    ) -> tuple[Optional[User], list[Message]]:
        """
        Recupera informações do outro usuário e histórico de conversa.
        """
        messages = await MessageService.get_item_conversation(
            db, item_id, current_user, other_user_id
        )

        # Buscar other_user
        other_result = await db.execute(select(User).where(User.id == other_user_id))
        other_user = other_result.scalar_one_or_none()

        return other_user, messages
