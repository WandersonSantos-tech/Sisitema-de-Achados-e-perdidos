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


    op.add_column(
        "users",
        sa.Column(
            "cpf_provisorio",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )

    conexao = op.get_bind()

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

    op.create_index(
        "ix_users_cpf",
        "users",
        ["cpf"],
        unique=True
    )

def downgrade():
    op.drop_index("ix_users_cpf", table_name="users")
    op.drop_column("users", "cpf_provisorio")