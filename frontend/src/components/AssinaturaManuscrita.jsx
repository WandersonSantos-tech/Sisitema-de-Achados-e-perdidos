
import { useEffect, useRef, useState } from "react";
import "./AssinaturaManuscrita.css";

export default function AssinaturaManuscrita({
  onConfirmar,
  disabled = false,
}) {
  const canvasRef = useRef(null);
  const desenhando = useRef(false);
  const [assinou, setAssinou] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const configurar = () => {
      const largura = canvas.clientWidth;
      const altura = 210;
      const escala = window.devicePixelRatio || 1;

      canvas.width = largura * escala;
      canvas.height = altura * escala;

      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      ctx.strokeStyle = "#172554";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    configurar();
  }, []);

  const coordenadas = (evento) => {
    const rect = canvasRef.current.getBoundingClientRect();

    return {
      x: evento.clientX - rect.left,
      y: evento.clientY - rect.top,
    };
  };

  const iniciar = (evento) => {
    if (disabled || confirmado) return;

    evento.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = coordenadas(evento);

    canvas.setPointerCapture(evento.pointerId);

    desenhando.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const mover = (evento) => {
    if (!desenhando.current) return;

    evento.preventDefault();

    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = coordenadas(evento);

    ctx.lineTo(x, y);
    ctx.stroke();

    setAssinou(true);
  };

  const finalizar = () => {
    desenhando.current = false;
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setAssinou(false);
    setConfirmado(false);
  };

  const confirmar = () => {
    if (!assinou || disabled) return;

    const imagem = canvasRef.current.toDataURL("image/png");

    setConfirmado(true);
    onConfirmar?.(imagem);
  };

  return (
    <section className="assinatura-card">
      <div className="assinatura-cabecalho">
        <div>
          <h3>Assinatura do responsável</h3>
          <p>
            Utilize o mouse, dedo ou caneta para assinar
            no espaço abaixo.
          </p>
        </div>
      </div>

      <div className="assinatura-area">
        <canvas
          ref={canvasRef}
          onPointerDown={iniciar}
          onPointerMove={mover}
          onPointerUp={finalizar}
          onPointerCancel={finalizar}
          onLostPointerCapture={finalizar}
          aria-label="Área para desenhar sua assinatura"
        />

        <div className="assinatura-linha" />

        <span className="assinatura-legenda">
          Assine acima da linha
        </span>
      </div>

      <div className="assinatura-aviso">
        Sua assinatura será incorporada ao termo de
        devolução após a confirmação do documento.
      </div>

      <div className="assinatura-acoes">
        <button
          type="button"
          className="assinatura-btn-secundario"
          disabled={disabled || confirmado}
          onClick={limpar}
        >
          Limpar assinatura
        </button>

        <button
          type="button"
          className="assinatura-btn-primario"
          disabled={!assinou || disabled || confirmado}
          onClick={confirmar}
        >
          {confirmado
            ? "Assinatura capturada"
            : "Confirmar assinatura"}
        </button>
      </div>
    </section>
  );
}
