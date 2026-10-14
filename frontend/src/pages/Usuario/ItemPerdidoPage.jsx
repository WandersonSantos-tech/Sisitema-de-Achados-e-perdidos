import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { categoryService } from "../../services/categoryService";
import { itemService } from "../../services/itemService";

import "./ItemPerdidoPage.css";

function Icon({ name, size = 22 }) {
  const icons = {
    arrowLeft: (
      <path
        d="M19 12H5m7-7-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),

    package: (
      <>
        <path
          d="M4 7l8-4 8 4v10l-8 4-8-4V7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <path
          d="M4 7l8 4 8-4M12 11v10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </>
    ),

    location: (
      <>
        <path
          d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
          stroke="currentColor"
          strokeWidth="2"
        />

        <circle
          cx="12"
          cy="10"
          r="2.5"
          stroke="currentColor"
          strokeWidth="2"
        />
      </>
    ),

    shield: (
      <>
        <path
          d="M12 3 20 6v5c0 5.1-3.4 8.7-8 10-4.6-1.3-8-4.9-8-10V6l8-3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <path
          d="m9 12 2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),

    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />

        <path
          d="M16 3v4M8 3v4M3 10h18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),

    check: (
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function ItemPerdidoPage() {
  const navigate = useNavigate();

  const [categorias, setCategorias] = useState([]);
  const [carregandoCategorias, setCarregandoCategorias] =
    useState(true);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    secret_details: "",
    location_name: "",
    event_date: "",
    height_cm: "",
    width_cm: "",
  });

  const [imagens, setImagens] = useState([]);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setCarregandoCategorias(true);

      const response = await categoryService.listar();

      setCategorias(response || []);
    } catch (error) {
      console.error(
        "Erro ao carregar categorias:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar as categorias."
      );
    } finally {
      setCarregandoCategorias(false);
    }
  }

  function alterarCampo(event) {
    const { name, value } = event.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function selecionarImagens(event) {
    const arquivos = Array.from(event.target.files || []);

    if (!arquivos.length) {
      return;
    }

    if (imagens.length + arquivos.length > 3) {
      setErro("Você pode adicionar no máximo 3 imagens.");
      event.target.value = "";
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const arquivoInvalido = arquivos.find(
      (arquivo) => !tiposPermitidos.includes(arquivo.type)
    );

    if (arquivoInvalido) {
      setErro("Envie apenas imagens JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    const limiteBytes = 5 * 1024 * 1024;

    const arquivoMuitoGrande = arquivos.find(
      (arquivo) => arquivo.size > limiteBytes
    );

    if (arquivoMuitoGrande) {
      setErro("Cada imagem pode ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    const novasImagens = arquivos.map((arquivo) => ({
      file: arquivo,
      preview: URL.createObjectURL(arquivo),
    }));

    setImagens((anteriores) => [
      ...anteriores,
      ...novasImagens,
    ]);

    setErro("");
    event.target.value = "";
  }

  function removerImagem(index) {
    setImagens((anteriores) => {
      const imagemRemovida = anteriores[index];

      if (imagemRemovida?.preview) {
        URL.revokeObjectURL(imagemRemovida.preview);
      }

      return anteriores.filter(
        (_, indice) => indice !== index
      );
    });
  }

  async function cadastrarItem(event) {
    event.preventDefault();

    setErro("");

    if (!form.category_id) {
      setErro("Selecione uma categoria.");
      return;
    }

    if (form.title.trim().length < 3) {
      setErro(
        "O título deve possuir pelo menos 3 caracteres."
      );
      return;
    }

    if (form.description.trim().length < 10) {
      setErro(
        "A descrição deve possuir pelo menos 10 caracteres."
      );
      return;
    }

    if (!form.location_name.trim()) {
      setErro("Informe onde o objeto foi perdido.");
      return;
    }

    if (!form.event_date) {
      setErro(
        "Informe a data e hora aproximada da perda."
      );
      return;
    }

    try {
      setSalvando(true);

      const itemCriado =
        await itemService.criarItemPerdido({
          category_id: Number(form.category_id),

          title: form.title.trim(),

          description: form.description.trim(),

          secret_details:
            form.secret_details.trim() || null,

          location_name: form.location_name.trim(),

          height_cm:
            form.height_cm !== ""
              ? Number(form.height_cm)
              : null,

          width_cm:
            form.width_cm !== ""
              ? Number(form.width_cm)
              : null,

          event_date: new Date(
            form.event_date
          ).toISOString(),
        });

      if (imagens.length > 0) {
        await itemService.enviarImagens(
          itemCriado.id,
          imagens.map((imagem) => imagem.file)
        );
      }

      imagens.forEach((imagem) => {
        URL.revokeObjectURL(imagem.preview);
      });

      navigate("/usuario/home");
    } catch (error) {
      console.error(
        "Erro ao cadastrar item:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível cadastrar o objeto."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="item-perdido-page">
      <header className="item-perdido-navbar">
        <button
          type="button"
          className="item-perdido-brand"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          <div className="item-perdido-logo">
            OT
          </div>

          <div>
            <strong>
              Onde<span>Tá</span>
            </strong>

            <small>
              Achados & Perdidos
            </small>
          </div>
        </button>

        <button
          type="button"
          className="item-voltar-button"
          onClick={() =>
            navigate("/usuario/home")
          }
        >
          <Icon
            name="arrowLeft"
            size={18}
          />

          Voltar para o início
        </button>
      </header>

      <main className="item-perdido-main">
        <section className="item-perdido-intro">
          <div className="item-intro-badge">
            REGISTRAR OBJETO PERDIDO
          </div>

          <h1>
            Conte para o OndeTá
            <br />
            o que você perdeu.
          </h1>

          <p>
            Quanto mais informações você
            fornecer, melhores serão as chances
            de encontrarmos uma possível
            correspondência.
          </p>

          <div className="item-intro-cards">
            <div>
              <span>
                <Icon
                  name="package"
                  size={20}
                />
              </span>

              <section>
                <strong>
                  Descreva o objeto
                </strong>

                <p>
                  Informe características
                  visíveis e detalhes gerais.
                </p>
              </section>
            </div>

            <div>
              <span>
                <Icon
                  name="location"
                  size={20}
                />
              </span>

              <section>
                <strong>
                  Informe o local
                </strong>

                <p>
                  Diga onde e quando percebeu
                  a perda.
                </p>
              </section>
            </div>

            <div>
              <span>
                <Icon
                  name="shield"
                  size={20}
                />
              </span>

              <section>
                <strong>
                  Proteja detalhes únicos
                </strong>

                <p>
                  Características secretas
                  ajudam na validação da
                  propriedade.
                </p>
              </section>
            </div>
          </div>
        </section>

        <section className="item-form-card">
          <div className="item-form-heading">
            <span>
              NOVO REGISTRO
            </span>

            <h2>
              Informações do objeto
            </h2>

            <p>
              Preencha os dados abaixo para
              iniciar a busca automática.
            </p>
          </div>

          {erro && (
            <div className="item-form-error">
              {erro}
            </div>
          )}

          <form
            onSubmit={cadastrarItem}
            className="item-form"
          >
            <div className="item-form-field">
              <label htmlFor="category_id">
                Categoria
              </label>

              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={alterarCampo}
                disabled={
                  carregandoCategorias
                }
                required
              >
                <option value="">
                  {carregandoCategorias
                    ? "Carregando categorias..."
                    : "Selecione uma categoria"}
                </option>

                {categorias.map(
                  (categoria) => (
                    <option
                      key={categoria.id}
                      value={categoria.id}
                    >
                      {categoria.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="item-form-field">
              <label htmlFor="title">
                Nome do objeto
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="Ex.: Fone de ouvido Bluetooth"
                value={form.title}
                onChange={alterarCampo}
                minLength={3}
                maxLength={150}
                required
              />
            </div>

            <div className="item-form-field full">
              <label htmlFor="description">
                Descrição
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Descreva cor, marca, modelo, tamanho e outras características..."
                value={form.description}
                onChange={alterarCampo}
                minLength={10}
                rows={5}
                required
              />
            </div>

            <div className="item-form-field full">
              <label htmlFor="secret_details">
                Características específicas
              </label>

              <textarea
                id="secret_details"
                name="secret_details"
                placeholder="Ex.: possui um risco na lateral, adesivo interno, iniciais gravadas..."
                value={form.secret_details}
                onChange={alterarCampo}
                rows={4}
              />

              <small>
                Essas informações podem ser
                utilizadas para comprovar que
                o objeto realmente pertence a
                você.
              </small>
            </div>

            <div className="item-form-field">
              <label htmlFor="location_name">
                Local da perda
              </label>

              <input
                id="location_name"
                name="location_name"
                type="text"
                placeholder="Ex.: Biblioteca"
                value={form.location_name}
                onChange={alterarCampo}
                maxLength={255}
                required
              />
            </div>

            <div className="item-form-field">
              <label htmlFor="event_date">
                Data e hora aproximada
              </label>

              <div className="item-input-icon">
                <Icon
                  name="calendar"
                  size={18}
                />

                <input
                  id="event_date"
                  name="event_date"
                  type="datetime-local"
                  value={form.event_date}
                  onChange={alterarCampo}
                  required
                />
              </div>
            </div>

            <div className="item-form-field">
              <label htmlFor="height_cm">
                Altura aproximada
                <span> opcional</span>
              </label>

              <div className="item-dimension-input">
                <input
                  id="height_cm"
                  name="height_cm"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Ex.: 45"
                  value={form.height_cm}
                  onChange={alterarCampo}
                />

                <span>cm</span>
              </div>
            </div>

            <div className="item-form-field">
              <label htmlFor="width_cm">
                Largura aproximada
                <span> opcional</span>
              </label>

              <div className="item-dimension-input">
                <input
                  id="width_cm"
                  name="width_cm"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Ex.: 30"
                  value={form.width_cm}
                  onChange={alterarCampo}
                />

                <span>cm</span>
              </div>
            </div>

            <div className="item-form-field full">
              <label>
                Imagens do objeto
                <span> opcional · máximo 3</span>
              </label>

              <div className="item-images-area">
                <div className="item-images-header">
                  <div>
                    <strong>
                      Adicione fotos que ajudem na identificação
                    </strong>

                    <p>
                      Você pode enviar fotos do objeto, embalagem,
                      nota fiscal ou algum detalhe importante.
                    </p>
                  </div>

                  <span className="item-images-count">
                    {imagens.length}/3
                  </span>
                </div>

                {imagens.length < 3 && (
                  <label className="item-image-picker">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={selecionarImagens}
                      disabled={salvando}
                    />

                    <span className="item-image-picker-icon">
                      +
                    </span>

                    <div>
                      <strong>Selecionar imagens</strong>
                      <small>
                        JPG, PNG ou WEBP · até 5 MB cada
                      </small>
                    </div>
                  </label>
                )}

                {imagens.length > 0 && (
                  <div className="item-image-previews">
                    {imagens.map((imagem, index) => (
                      <div
                        className="item-image-preview"
                        key={`${imagem.file.name}-${index}`}
                      >
                        <img
                          src={imagem.preview}
                          alt={`Prévia ${index + 1}`}
                        />

                        <button
                          type="button"
                          onClick={() => removerImagem(index)}
                          disabled={salvando}
                          aria-label={`Remover imagem ${index + 1}`}
                        >
                          ×
                        </button>

                        <span>
                          Imagem {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="item-form-security">
              <Icon
                name="shield"
                size={21}
              />

              <div>
                <strong>
                  Informações protegidas
                </strong>

                <p>
                  Objetos encontrados não são
                  exibidos publicamente para
                  outros usuários.
                </p>
              </div>
            </div>

            <div className="item-form-actions">
              <button
                type="button"
                className="item-cancel-button"
                onClick={() =>
                  navigate("/usuario/home")
                }
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="item-submit-button"
                disabled={
                  salvando ||
                  carregandoCategorias
                }
              >
                {salvando ? (
                  "Cadastrando..."
                ) : (
                  <>
                    <Icon
                      name="check"
                      size={19}
                    />

                    Registrar objeto perdido
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default ItemPerdidoPage;