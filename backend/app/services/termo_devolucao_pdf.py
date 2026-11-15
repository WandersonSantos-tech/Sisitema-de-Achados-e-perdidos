


import base64
import hashlib
import io
from datetime import datetime, timezone
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    PageBreak,
    Spacer,
    Image,
    KeepTogether,
)

AZUL = colors.HexColor("#14264B")
AZUL_CLARO = colors.HexColor("#2563EB")
CINZA = colors.HexColor("#475569")

ESTILOS = {
    "titulo": ParagraphStyle(
        "TituloTermo",
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=23,
        textColor=AZUL,
        alignment=TA_CENTER,
        spaceAfter=22,
    ),
    "subtitulo": ParagraphStyle(
        "SubtituloTermo",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=17,
        textColor=AZUL,
        spaceBefore=16,
        spaceAfter=10,
    ),
    "texto": ParagraphStyle(
        "TextoTermo",
        fontName="Helvetica",
        fontSize=10,
        leading=17,
        textColor=CINZA,
        alignment=TA_JUSTIFY,
        spaceAfter=13,
    ),
    "campo": ParagraphStyle(
        "CampoTermo",
        fontName="Helvetica",
        fontSize=10,
        leading=17,
        textColor=AZUL,
        spaceAfter=8,
    ),
}


def _texto(valor):
    return escape(str(valor or "Não informado"))


def _data(valor):
    if not valor:
        return "Não informada"

    if isinstance(valor, str):
        try:
            valor = datetime.fromisoformat(
                valor.replace("Z", "+00:00")
            )
        except ValueError:
            return _texto(valor)

    return valor.strftime("%d/%m/%Y às %H:%M")


def _paragrafo(texto, estilo="texto"):
    return Paragraph(texto, ESTILOS[estilo])


def _clausula(numero, titulo, conteudo):
    return [
        _paragrafo(
            f"CLÁUSULA {numero} — {titulo}",
            "subtitulo",
        ),
        _paragrafo(conteudo),
    ]


def _rodape(canvas, doc):
    canvas.saveState()

    largura, altura = A4

    canvas.setFillColor(AZUL)
    canvas.rect(
        0,
        altura - 12,
        largura,
        12,
        fill=1,
        stroke=0,
    )

    canvas.setFont("Helvetica-Bold", 10)
    canvas.setFillColor(AZUL)
    canvas.drawString(
        48,
        altura - 42,
        "ONDE TÁ | ACHADOS E PERDIDOS",
    )

    canvas.setStrokeColor(
        colors.HexColor("#E2E8F0")
    )
    canvas.line(
        48,
        52,
        largura - 48,
        52,
    )

    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(CINZA)

    canvas.drawString(
        48,
        37,
        "Documento eletrônico de devolução",
    )

    canvas.drawRightString(
        largura - 48,
        37,
        f"Página {doc.page} de 4",
    )

    canvas.restoreState()


def _imagem_assinatura(assinatura_base64):
    if not assinatura_base64:
        return None

    prefixo = "data:image/png;base64,"

    if assinatura_base64.startswith(prefixo):
        assinatura_base64 = assinatura_base64[
            len(prefixo):
        ]

    imagem_bytes = base64.b64decode(
        assinatura_base64,
        validate=True,
    )

    if len(imagem_bytes) > 500_000:
        raise ValueError(
            "Imagem de assinatura muito grande"
        )

    imagem = ImageReader(io.BytesIO(imagem_bytes))

    largura, altura = imagem.getSize()

    if largura < 10 or altura < 10:
        raise ValueError("Assinatura inválida")

    elemento = Image(
        io.BytesIO(imagem_bytes),
        width=240,
        height=85,
        kind="proportional",
    )

    elemento.hAlign = "CENTER"

    return elemento


def gerar_termo_devolucao(
    *,
    claim_id,
    item_id,
    item_titulo,
    item_descricao,
    usuario_nome,
    usuario_email,
    funcionario_nome,
    retirada_em,
    assinatura_base64=None,
    assinado_em=None,
):
    """
    Gera o termo de devolução em PDF.

    Sem assinatura_base64:
        Documento para leitura e conferência.

    Com assinatura_base64:
        Documento contendo a assinatura desenhada.

    Retorna os bytes do PDF.
    """

    buffer = io.BytesIO()

    documento = BaseDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=48,
        rightMargin=48,
        topMargin=72,
        bottomMargin=75,
        title="Onde Tá - Termo de Devolução",
        author="Onde Tá",
        pageCompression=1,
    )

    frame = Frame(
        48,
        75,
        A4[0] - 96,
        A4[1] - 147,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )

    documento.addPageTemplates(
        PageTemplate(
            id="Termo",
            frames=[frame],
            onPage=_rodape,
        )
    )

    conteudo = []

    # ======================================
    # PÁGINA 1 — IDENTIFICAÇÃO
    # ======================================

    conteudo.append(
        _paragrafo(
            "TERMO DE RESPONSABILIDADE E "
            "DEVOLUÇÃO DE OBJETO",
            "titulo",
        )
    )

    conteudo.append(
        _paragrafo(
            "Instrumento eletrônico destinado ao registro "
            "da identificação do objeto, da proposta de "
            "devolução e das condições de retirada."
        )
    )

    conteudo.append(
        _paragrafo(
            "1. IDENTIFICAÇÃO DAS PARTES",
            "subtitulo",
        )
    )

    campos = [
        ("Solicitante", usuario_nome),
        ("E-mail", usuario_email),
        ("Funcionário responsável", funcionario_nome),
        ("Número da solicitação", claim_id),
        ("Identificador do objeto", item_id),
        ("Objeto", item_titulo),
        ("Descrição", item_descricao),
        ("Retirada agendada", _data(retirada_em)),
    ]

    for nome, valor in campos:
        conteudo.append(
            _paragrafo(
                f"<b>{_texto(nome)}:</b> {_texto(valor)}",
                "campo",
            )
        )

    conteudo.extend(
        _clausula(
            "1ª",
            "DO OBJETO",
            "O presente termo tem por finalidade "
            "documentar a proposta de devolução do objeto "
            "identificado neste instrumento, no âmbito "
            "do sistema Onde Tá — Achados e Perdidos.",
        )
    )

    conteudo.extend(
        _clausula(
            "2ª",
            "DA IDENTIFICAÇÃO DO SOLICITANTE",
            "O solicitante declara que as informações "
            "fornecidas para análise da solicitação são "
            "verdadeiras, estando ciente de que a equipe "
            "responsável poderá realizar verificações "
            "adicionais antes da entrega física.",
        )
    )

    conteudo.append(PageBreak())

    # ======================================
    # PÁGINA 2 — CONDIÇÕES
    # ======================================

    conteudo.append(
        _paragrafo(
            "CONDIÇÕES DE DEVOLUÇÃO",
            "titulo",
        )
    )

    conteudo.extend(
        _clausula(
            "3ª",
            "DA CONFERÊNCIA DO OBJETO",
            "Antes da entrega, o funcionário responsável "
            "deverá conferir a identificação do objeto e "
            "as informações da solicitação, observando "
            "os procedimentos aplicáveis à instituição.",
        )
    )

    conteudo.extend(
        _clausula(
            "4ª",
            "DO AGENDAMENTO",
            "A data e o horário registrados neste termo "
            "representam o agendamento da retirada. "
            "Eventuais alterações deverão ser comunicadas "
            "e registradas no sistema.",
        )
    )

    conteudo.extend(
        _clausula(
            "5ª",
            "DA ENTREGA FÍSICA",
            "A assinatura eletrônica deste documento "
            "não comprova, isoladamente, que o objeto "
            "foi entregue. A conclusão da devolução "
            "dependerá de confirmação específica do "
            "funcionário responsável após a entrega.",
        )
    )

    conteudo.extend(
        _clausula(
            "6ª",
            "DAS DIVERGÊNCIAS",
            "Caso sejam identificadas divergências "
            "relevantes entre o objeto apresentado e "
            "as informações da solicitação, a entrega "
            "poderá ser suspensa até que a situação "
            "seja esclarecida.",
        )
    )

    conteudo.extend(
        _clausula(
            "7ª",
            "DA RESPONSABILIDADE PELAS INFORMAÇÕES",
            "Cada participante é responsável pela "
            "veracidade das informações que fornecer. "
            "O registro deste termo não substitui "
            "eventuais verificações de titularidade "
            "exigidas pela instituição.",
        )
    )

    conteudo.append(PageBreak())

    # ======================================
    # PÁGINA 3 — SEGURANÇA E PRIVACIDADE
    # ======================================

    conteudo.append(
        _paragrafo(
            "SEGURANÇA E REGISTRO ELETRÔNICO",
            "titulo",
        )
    )

    conteudo.extend(
        _clausula(
            "8ª",
            "DO REGISTRO DA ASSINATURA",
            "A assinatura será coletada por meio "
            "de interface eletrônica, utilizando "
            "mouse, tela sensível ao toque ou "
            "dispositivo compatível. O desenho "
            "confirmado será incorporado à versão "
            "final do documento.",
        )
    )

    conteudo.extend(
        _clausula(
            "9ª",
            "DA AUTENTICAÇÃO",
            "O procedimento de assinatura deverá "
            "estar associado a uma sessão autenticada "
            "do solicitante, permitindo relacionar "
            "o registro ao usuário responsável.",
        )
    )

    conteudo.extend(
        _clausula(
            "10ª",
            "DA INTEGRIDADE DO DOCUMENTO",
            "O sistema deverá registrar uma impressão "
            "digital criptográfica SHA-256 do PDF "
            "finalizado, permitindo detectar alterações "
            "posteriores no conteúdo armazenado.",
        )
    )

    conteudo.extend(
        _clausula(
            "11ª",
            "DA PROTEÇÃO DE DADOS",
            "Os dados pessoais e registros da assinatura "
            "deverão ser utilizados para a gestão da "
            "solicitação e para a documentação da "
            "devolução, observadas as regras aplicáveis "
            "de proteção de dados e os controles de "
            "acesso do sistema.",
        )
    )

    conteudo.extend(
        _clausula(
            "12ª",
            "DO ACESSO AO DOCUMENTO",
            "A consulta e o download do termo deverão "
            "ser disponibilizados somente aos usuários "
            "autorizados, conforme sua participação "
            "na solicitação e as permissões "
            "administrativas estabelecidas.",
        )
    )

    conteudo.append(PageBreak())

    # ======================================
    # PÁGINA 4 — ASSINATURA
    # ======================================

    conteudo.append(
        _paragrafo(
            "DECLARAÇÕES E ASSINATURA",
            "titulo",
        )
    )

    conteudo.extend(
        _clausula(
            "13ª",
            "DA CIÊNCIA DAS CONDIÇÕES",
            "Ao assinar este documento, o solicitante "
            "declara ter tido acesso às condições "
            "apresentadas e manifesta sua concordância "
            "com o procedimento de devolução descrito.",
        )
    )

    conteudo.extend(
        _clausula(
            "14ª",
            "DA CONFIRMAÇÃO FINAL",
            "A confirmação da entrega física será "
            "realizada separadamente pelo funcionário. "
            "O presente termo registra a manifestação "
            "eletrônica do solicitante e as condições "
            "relacionadas à retirada.",
        )
    )

    conteudo.append(Spacer(1, 30))

    conteudo.append(
        _paragrafo(
            "ASSINATURA ELETRÔNICA DO SOLICITANTE",
            "subtitulo",
        )
    )

    imagem = _imagem_assinatura(
        assinatura_base64
    )

    if imagem:
        conteudo.append(imagem)
    else:
        conteudo.append(Spacer(1, 85))
        conteudo.append(
            _paragrafo(
                "Espaço reservado para assinatura.",
            )
        )

    conteudo.append(
        _paragrafo(
            "________________________________________",
            "campo",
        )
    )

    conteudo.append(
        _paragrafo(
            f"<b>Solicitante:</b> {_texto(usuario_nome)}",
            "campo",
        )
    )

    conteudo.append(
        _paragrafo(
            f"<b>Data da assinatura:</b> "
            f"{_data(assinado_em) if assinado_em else 'Pendente'}",
            "campo",
        )
    )

    conteudo.append(Spacer(1, 22))

    conteudo.append(
        _paragrafo(
            "<b>Observação:</b> Este instrumento "
            "contém assinatura eletrônica manuscrita "
            "quando finalizado. Não constitui, por si "
            "só, assinatura digital certificada "
            "ICP-Brasil."
        )
    )

    documento.build(conteudo)

    pdf_bytes = buffer.getvalue()

    return pdf_bytes


def calcular_hash_pdf(pdf_bytes):
    return hashlib.sha256(pdf_bytes).hexdigest()
