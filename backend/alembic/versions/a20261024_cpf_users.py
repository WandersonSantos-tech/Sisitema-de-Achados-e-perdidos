
"""Adiciona CPF e preenche usuários antigos com CPFs provisórios."""

from alembic import op
import sqlalchemy as sa


revision = "a20261024_cpf_users"
down_revision = "a20261017_flow"
branch_labels = None
depends_on = None


def gerar_cpf(base: int) -> str:
    numeros = [int(n) for n in f"{base:09d}"]

    for tamanho in (9, 10):
        soma = sum(
            numeros[i] * (tamanho + 1 - i)
            for i in range(tamanho)
        )

        digito = (soma * 10) % 11

        if digito == 10:
            digito = 0

        numeros.append(digito)

    return "".join(map(str, numeros))


def upgrade():
    conexao = op.get_bind()
    inspetor = sa.inspect(conexao)

    colunas = {
        coluna["name"]
        for coluna in inspetor.get_columns("users")
    }

    # Cria CPF somente se ainda não existir.
    if "cpf" not in colunas:
        op.add_column(
            "users",
            sa.Column("cpf", sa.String(11), nullable=True)
        )


    if "cpf_provisorio" not in colunas:
        op.add_column(
            "users",
            sa.Column(
                "cpf_provisorio",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false()
            )
        )


    usuarios = conexao.execute(
        sa.text(
            "SELECT id FROM users WHERE cpf IS NULL ORDER BY id"
        )
    ).fetchall()

    usados = set(
        conexao.execute(
            sa.text("SELECT cpf FROM users WHERE cpf IS NOT NULL")
        ).scalars()
    )

    sequencia = 900000000

    for usuario in usuarios:
        while True:
            if sequencia > 999999999:
                raise RuntimeError(
                    "Faixa de CPFs provisórios esgotada"
                )

            cpf = gerar_cpf(sequencia)
            sequencia += 1

            if cpf not in usados:
                break

        conexao.execute(
            sa.text("""
                UPDATE users
                SET cpf = :cpf,
                    cpf_provisorio = TRUE
                WHERE id = :id
            """),
            {
                "cpf": cpf,
                "id": usuario.id
            }
        )

        usados.add(cpf)

    # Evita criar outro índice se CPF já possui restrição UNIQUE.
    indices = sa.inspect(conexao).get_indexes("users")
    restricoes = sa.inspect(conexao).get_unique_constraints("users")

    cpf_ja_unico = any(
        indice.get("unique")
        and indice.get("column_names") == ["cpf"]
        for indice in indices
    ) or any(
        restricao.get("column_names") == ["cpf"]
        for restricao in restricoes
    )

    if not cpf_ja_unico:
        op.create_index(
            "ix_users_cpf",
            "users",
            ["cpf"],
            unique=True
        )


def downgrade():
    conexao = op.get_bind()
    inspetor = sa.inspect(conexao)

    indices = {
        indice["name"]
        for indice in inspetor.get_indexes("users")
    }

    if "ix_users_cpf" in indices:
        op.drop_index("ix_users_cpf", table_name="users")


    colunas = {
        coluna["name"]
        for coluna in sa.inspect(conexao).get_columns("users")
    }

    if "cpf_provisorio" in colunas:
        op.drop_column("users", "cpf_provisorio")
