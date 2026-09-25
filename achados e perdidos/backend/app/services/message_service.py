from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.claim import Claim
from app.models.item import Item
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate

if TYPE_CHECKING:
    pass


class MessageService:
    """Serviço de negócio para operações de mensagens com validação de acesso"""

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

        # Validar que remetente é dono do item OU possui reivindicação aprovada/pendente
        has_claim = False
        if sender.id != item.user_id:
            # Verificar se tem reivindicação para este item
            claim_result = await db.execute(
                select(Claim).where(
                    and_(
                        Claim.item_id == item_id,
                        Claim.requester_id == sender.id,
                    )
                )
            )
            has_claim = claim_result.scalar_one_or_none() is not None

        if sender.id != item.user_id and not has_claim:
            raise PermissionError(
                "Você só pode enviar mensagens para itens que você publicou ou para os quais possui reivindicação"
            )

        # Validar que receiver_id existe e é um usuário válido
        receiver_result = await db.execute(
            select(User).where(User.id == msg_in.receiver_id)
        )
        receiver = receiver_result.scalar_one_or_none()

        if not receiver:
            raise ValueError(f"Usuário {msg_in.receiver_id} não encontrado")

        # Validar que o destinatário está envolvido com o item
        # (é o dono OU possui reivindicação)
        receiver_involved = False
        if receiver.id == item.user_id:
            receiver_involved = True
        else:
            receiver_claim = await db.execute(
                select(Claim).where(
                    and_(
                        Claim.item_id == item_id,
                        Claim.requester_id == receiver.id,
                    )
                )
            )
            receiver_involved = receiver_claim.scalar_one_or_none() is not None

        if not receiver_involved:
            raise PermissionError(
                "O destinatário não está envolvido com este item"
            )

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

        current_user_involved = False
        if current_user.id == item.user_id:
            current_user_involved = True
        else:
            claim_result = await db.execute(
                select(Claim).where(
                    and_(
                        Claim.item_id == item_id,
                        Claim.requester_id == current_user.id,
                    )
                )
            )
            current_user_involved = claim_result.scalar_one_or_none() is not None

        if not current_user_involved:
            raise PermissionError(
                "Você não está envolvido com este item e não pode consultar conversas"
            )

        # Validar que other_user está envolvido com item
        other_user_involved = False
        if other_user_id == item.user_id:
            other_user_involved = True
        else:
            other_claim_result = await db.execute(
                select(Claim).where(
                    and_(
                        Claim.item_id == item_id,
                        Claim.requester_id == other_user_id,
                    )
                )
            )
            other_user_involved = other_claim_result.scalar_one_or_none() is not None

        if not other_user_involved:
            raise PermissionError(
                "O outro usuário não está envolvido com este item"
            )

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
