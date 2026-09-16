/**
 * O QR code na tela: o SVG inteiro numa URL de dados, dentro de um `<img>`.
 *
 * É `<img>`, e não o SVG embutido por `innerHTML`: uma imagem não executa
 * nada, é dimensionada por CSS como qualquer outra, e o texto que ela carrega
 * vem da biblioteca `qrcode` — não de quem digitou a URL. O resultado tem
 * ~2 KB, e o mesmo componente serve ao tablet (ilha de cliente) e à prévia do
 * painel (renderizada no servidor), porque não depende de nada dos dois lados.
 *
 * `alt` é obrigatório: o QR é uma imagem funcional, e quem não a vê precisa
 * saber para onde ela leva.
 */
export function ImagemQr({
  svg,
  alt,
  className,
}: {
  svg: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL de dados gerada aqui mesmo; o otimizador do Next não tem o que otimizar.
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}
