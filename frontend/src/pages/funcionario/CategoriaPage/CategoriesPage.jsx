import { useState } from "react";
import "./CategoriesPage.css";


function CategoriesPage() {
  const [categorias, setCategorias] = useState([
    {
      id: 1,
      name: "Eletrônicos",
      description: "Celulares, fones, carregadores e dispositivos eletrônicos.",
    },
    {
      id: 2,
      name: "Documentos",
      description: "RG, CPF, carteirinhas, cartões e documentos pessoais.",
    },
    {
      id: 3,
      name: "Acessórios",
      description: "Relógios, óculos, pulseiras, bonés e acessórios diversos.",
    },
  ]);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setCategoriaEditando(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!nome.trim()) {
      setErro("Informe o nome da categoria.");
      return;
    }

    if (categoriaEditando) {
      setCategorias((categoriasAtuais) =>
        categoriasAtuais.map((categoria) =>
          categoria.id === categoriaEditando.id
            ? {
                ...categoria,
                name: nome.trim(),
                description: descricao.trim(),
              }
            : categoria
        )
      );

      setSucesso("Categoria atualizada com sucesso.");
    } else {
      const novaCategoria = {
        id: Date.now(),
        name: nome.trim(),
        description: descricao.trim(),
      };

      setCategorias((categoriasAtuais) => [
        ...categoriasAtuais,
        novaCategoria,
      ]);

      setSucesso("Categoria cadastrada com sucesso.");
    }

    limparFormulario();
  }

  function editarCategoria(categoria) {
    setCategoriaEditando(categoria);
    setNome(categoria.name);
    setDescricao(categoria.description || "");
    setErro("");
    setSucesso("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function excluirCategoria(categoria) {
    const confirmar = window.confirm(
      `Deseja realmente excluir a categoria "${categoria.name}"?`
    );

    if (!confirmar) {
      return;
    }

    setCategorias((categoriasAtuais) =>
      categoriasAtuais.filter(
        (item) => item.id !== categoria.id
      )
    );

    if (categoriaEditando?.id === categoria.id) {
      limparFormulario();
    }

    setErro("");
    setSucesso("Categoria excluída com sucesso.");
  }

  return (
    <main className="categories-page">
      <header className="categories-header">
        <div>
          <span className="categories-badge">
            PAINEL DO FUNCIONÁRIO
          </span>

          <h1>Gerenciar categorias</h1>

          <p>
            Organize as categorias utilizadas no cadastro
            de objetos perdidos e encontrados.
          </p>
        </div>
      </header>

      <section className="category-form-card">
        <div className="card-header">
          <div>
            <span className="card-label">
              {categoriaEditando
                ? "EDIÇÃO"
                : "NOVA CATEGORIA"}
            </span>

            <h2>
              {categoriaEditando
                ? "Editar categoria"
                : "Cadastrar categoria"}
            </h2>
          </div>

          {categoriaEditando && (
            <button
              type="button"
              className="cancel-edit-button"
              onClick={limparFormulario}
            >
              Cancelar edição
            </button>
          )}
        </div>

        {erro && (
          <div className="category-message error">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="category-message success">
            {sucesso}
          </div>
        )}

        <form
          className="category-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="category-name">
              Nome da categoria
            </label>

            <input
              id="category-name"
              type="text"
              placeholder="Ex.: Eletrônicos"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="category-description">
              Descrição
            </label>

            <textarea
              id="category-description"
              placeholder="Descreva quais objetos pertencem a esta categoria."
              value={descricao}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="save-category-button"
          >
            {categoriaEditando
              ? "Salvar alterações"
              : "Cadastrar categoria"}
          </button>
        </form>
      </section>

      <section className="categories-list-card">
        <div className="categories-list-header">
          <div>
            <span className="card-label">
              CATEGORIAS
            </span>

            <h2>Categorias cadastradas</h2>
          </div>

          <div className="categories-counter">
            {categorias.length}
          </div>
        </div>

        {categorias.length === 0 ? (
          <div className="categories-empty">
            <strong>
              Nenhuma categoria cadastrada
            </strong>

            <p>
              Utilize o formulário acima para
              cadastrar a primeira categoria.
            </p>
          </div>
        ) : (
          <div className="categories-table-wrapper">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.id}>
                    <td>#{categoria.id}</td>

                    <td>
                      <strong>
                        {categoria.name}
                      </strong>
                    </td>

                    <td>
                      {categoria.description ||
                        "Sem descrição"}
                    </td>

                    <td>
                      <div className="category-actions">
                        <button
                          type="button"
                          className="edit-category-button"
                          onClick={() =>
                            editarCategoria(categoria)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="delete-category-button"
                          onClick={() =>
                            excluirCategoria(categoria)
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default CategoriesPage;