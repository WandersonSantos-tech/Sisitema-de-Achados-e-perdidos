from __future__ import annotations

import asyncio
import math
import unicodedata
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from rapidfuzz import fuzz
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import Item
from app.models.enums import ItemType, ItemStatus
from app.schemas.match import MatchScoreDetails, MatchResultResponse

if TYPE_CHECKING:
    pass


class MatchingService:
    """Serviço de correspondência inteligente entre itens perdidos e encontrados"""

    # Limiar mínimo de similaridade (65%) para considerar uma correspondência válida
    MINIMUM_SIMILARITY_THRESHOLD = 65.0

    # Pesos dos critérios (em percentagem)
    CATEGORY_WEIGHT = 30.0
    TEXTUAL_SIMILARITY_WEIGHT = 40.0
    TEMPORAL_PROXIMITY_WEIGHT = 15.0
    GEOGRAPHICAL_PROXIMITY_WEIGHT = 15.0

    # Parâmetros para cálculos
    TEMPORAL_PROXIMITY_MAX_DAYS = 3  # Pontuação máxima até 3 dias
    TEMPORAL_PROXIMITY_DECAY_DAYS = 30  # Decai até 0 em 30 dias
    GEOGRAPHICAL_PROXIMITY_MAX_KM = 1  # Pontuação máxima até 1 km
    GEOGRAPHICAL_PROXIMITY_DECAY_KM = 15  # Decai até 0 em 15 km

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Normaliza texto removendo acentos e convertendo para minúsculas"""
        if not text:
            return ""

        # Remove acentos
        nfd_text = unicodedata.normalize("NFD", text)
        normalized = "".join(
            char for char in nfd_text if unicodedata.category(char) != "Mn"
        )

        # Converte para minúsculas
        return normalized.lower()

    @staticmethod
    def _calculate_haversine_distance(
        lat1: Decimal,
        lon1: Decimal,
        lat2: Decimal,
        lon2: Decimal,
    ) -> float:
        """
        Calcula a distância entre dois pontos usando a fórmula de Haversine.
        Retorna a distância em quilômetros.
        """
        # Raio da Terra em km
        earth_radius_km = 6371.0

        # Converte para float
        lat1_f = float(lat1)
        lon1_f = float(lon1)
        lat2_f = float(lat2)
        lon2_f = float(lon2)

        # Converte para radianos
        lat1_rad = math.radians(lat1_f)
        lon1_rad = math.radians(lon1_f)
        lat2_rad = math.radians(lat2_f)
        lon2_rad = math.radians(lon2_f)

        # Diferenças
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        # Fórmula de Haversine
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        distance = earth_radius_km * c

        return distance

    @staticmethod
    def _calculate_category_score(
        target_category_id: int,
        candidate_category_id: int,
    ) -> float:
        """
        Calcula o score de similaridade de categoria.
        Retorna 30 se as categorias são iguais, 0 caso contrário.
        """
        if target_category_id == candidate_category_id:
            return MatchingService.CATEGORY_WEIGHT
        return 0.0

    @staticmethod
    def _calculate_textual_similarity_score(
        target_title: str,
        target_description: str,
        candidate_title: str,
        candidate_description: str,
    ) -> float:
        """
        Calcula o score de similaridade textual usando RapidFuzz.
        Utiliza token_set_ratio para robustez.
        Retorna score normalizado (0-40%).
        """
        target_text = f"{target_title} {target_description}"
        candidate_text = f"{candidate_title} {candidate_description}"

        # Normaliza textos
        target_normalized = MatchingService._normalize_text(target_text)
        candidate_normalized = MatchingService._normalize_text(candidate_text)

        # Calcula similaridade usando token_set_ratio
        similarity = fuzz.token_set_ratio(
            target_normalized, candidate_normalized)

        # Normaliza para 0-40%
        return (similarity / 100.0) * MatchingService.TEXTUAL_SIMILARITY_WEIGHT

    @staticmethod
    def _calculate_temporal_proximity_score(
        target_event_date: datetime,
        candidate_event_date: datetime,
    ) -> float:
        """
        Calcula o score de proximidade temporal.
        - Até 3 dias de diferença: pontuação máxima (15 pontos)
        - De 3 a 30 dias: decai linearmente até 0
        - Acima de 30 dias: 0 pontos
        """
        # Calcula diferença em dias
        date_diff = abs((target_event_date - candidate_event_date).days)

        if date_diff <= MatchingService.TEMPORAL_PROXIMITY_MAX_DAYS:
            return MatchingService.TEMPORAL_PROXIMITY_WEIGHT
        elif date_diff < MatchingService.TEMPORAL_PROXIMITY_DECAY_DAYS:
            # Decáy linear
            decay_range = (
                MatchingService.TEMPORAL_PROXIMITY_DECAY_DAYS
                - MatchingService.TEMPORAL_PROXIMITY_MAX_DAYS
            )
            days_over_max = date_diff - MatchingService.TEMPORAL_PROXIMITY_MAX_DAYS
            score = (
                MatchingService.TEMPORAL_PROXIMITY_WEIGHT
                * (1 - days_over_max / decay_range)
            )
            return max(0.0, score)
        else:
            return 0.0

    @staticmethod
    def _calculate_geographical_proximity_score(
        target_latitude: Decimal | None,
        target_longitude: Decimal | None,
        candidate_latitude: Decimal | None,
        candidate_longitude: Decimal | None,
        target_location_name: str,
        candidate_location_name: str,
    ) -> float:
        """
        Calcula o score de proximidade geográfica.
        Se ambos possuem coordenadas, usa Haversine.
        Se não, usa similaridade textual entre location_name.
        """
        # Se ambos têm coordenadas
        if (
            target_latitude is not None
            and target_longitude is not None
            and candidate_latitude is not None
            and candidate_longitude is not None
        ):
            distance_km = MatchingService._calculate_haversine_distance(
                target_latitude,
                target_longitude,
                candidate_latitude,
                candidate_longitude,
            )

            if distance_km <= MatchingService.GEOGRAPHICAL_PROXIMITY_MAX_KM:
                return MatchingService.GEOGRAPHICAL_PROXIMITY_WEIGHT
            elif distance_km < MatchingService.GEOGRAPHICAL_PROXIMITY_DECAY_KM:
                # Decáy linear
                decay_range = (
                    MatchingService.GEOGRAPHICAL_PROXIMITY_DECAY_KM
                    - MatchingService.GEOGRAPHICAL_PROXIMITY_MAX_KM
                )
                km_over_max = distance_km - MatchingService.GEOGRAPHICAL_PROXIMITY_MAX_KM
                score = (
                    MatchingService.GEOGRAPHICAL_PROXIMITY_WEIGHT
                    * (1 - km_over_max / decay_range)
                )
                return max(0.0, score)
            else:
                return 0.0
        else:
            # Usa similaridade textual dos nomes de localização com peso reduzido
            similarity = fuzz.token_set_ratio(
                MatchingService._normalize_text(target_location_name),
                MatchingService._normalize_text(candidate_location_name),
            )
            # Reduz o peso a 30% do máximo quando não há coordenadas
            return (similarity / 100.0) * MatchingService.GEOGRAPHICAL_PROXIMITY_WEIGHT * 0.3

    @staticmethod
    def _calculate_weighted_similarity_score(
        target_item: Item,
        candidate_item: Item,
    ) -> tuple[float, MatchScoreDetails]:
        """
        Calcula o score de similaridade ponderado entre dois itens.
        Retorna: (score_total, detalhes)
        """
        # Calcula subscore para cada critério
        category_score = MatchingService._calculate_category_score(
            target_item.category_id,
            candidate_item.category_id,
        )

        textual_score = MatchingService._calculate_textual_similarity_score(
            target_item.title,
            target_item.description,
            candidate_item.title,
            candidate_item.description,
        )

        temporal_score = MatchingService._calculate_temporal_proximity_score(
            target_item.event_date,
            candidate_item.event_date,
        )

        geographical_score = MatchingService._calculate_geographical_proximity_score(
            target_item.latitude,
            target_item.longitude,
            candidate_item.latitude,
            candidate_item.longitude,
            target_item.location_name,
            candidate_item.location_name,
        )

        # Score total (0-100%)
        total_score = category_score + textual_score + \
            temporal_score + geographical_score

        # Detalhes dos scores
        details = MatchScoreDetails(
            category_score=category_score,
            textual_similarity_score=textual_score,
            temporal_proximity_score=temporal_score,
            geographical_proximity_score=geographical_score,
        )

        return total_score, details

    async def find_matches_for_item(
        self,
        db: AsyncSession,
        item_id: UUID,
    ) -> list[dict]:
        """
        Encontra correspondências para um item específico.
        Retorna lista de dicionários com informações de cada correspondência.
        """
        # Recupera o item
        result = await db.execute(select(Item).where(Item.id == item_id))
        target_item = result.scalar_one_or_none()

        if not target_item:
            return []

        # Determina o tipo dos candidatos
        if target_item.type == ItemType.ENCONTRADO:
            # Busca itens PERDIDO com status PERDIDO
            candidate_type = ItemType.PERDIDO
            candidate_status = ItemStatus.PERDIDO
        else:
            # Busca itens ENCONTRADO com status ENCONTRADO
            candidate_type = ItemType.ENCONTRADO
            candidate_status = ItemStatus.ENCONTRADO

        # Query para buscar candidatos
        query = select(Item).where(
            and_(
                Item.type == candidate_type,
                Item.status == candidate_status,
                Item.id != item_id,  # Exclui o próprio item
            )
        )

        result = await db.execute(query)
        candidate_items = result.scalars().all()

        # Calcula correspondências
        matches = []
        for candidate in candidate_items:
            score, details = self._calculate_weighted_similarity_score(
                target_item,
                candidate,
            )

            # Se o score atinge o limiar mínimo, adiciona à lista
            if score >= self.MINIMUM_SIMILARITY_THRESHOLD:
                match_data = {
                    "item_id": target_item.id,
                    "matched_item_id": candidate.id,
                    "similarity_score": score,
                    "matched_item_title": candidate.title,
                    "matched_item_description": candidate.description,
                    "matched_item_location_name": candidate.location_name,
                    "matched_item_event_date": candidate.event_date.isoformat(),
                    "matched_item_type": candidate.type.value,
                    "score_details": details,
                }
                matches.append(match_data)

        # Ordena por score descrescente
        matches.sort(key=lambda x: x["similarity_score"], reverse=True)

        return matches


# Instância global do serviço
matching_service = MatchingService()
