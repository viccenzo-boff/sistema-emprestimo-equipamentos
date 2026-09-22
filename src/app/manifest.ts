import type { MetadataRoute } from "next";

/**
 * Manifest do web app (Tarefa 19). Convenção do Next: este arquivo gera
 * `/manifest.webmanifest`, e a rota sai estática no `build`.
 *
 * Ele é entregue mesmo sabendo que o Chrome do Android ainda NÃO vai oferecer
 * "Instalar aplicativo": o install exige o protocolo `https://`, que é a
 * Tarefa 20. Escrever o manifest agora é o que faz aquela tarefa ser só
 * infraestrutura. Quem dá a tela cheia no Android hoje é o Fully Kiosk
 * Browser; no iPad, "Adicionar à Tela de Início" já funciona em HTTP.
 *
 * `start_url` é relativo de propósito — ele resolve contra a origem que serviu
 * a página, então o manifest não carrega o IP da rede da coordenação. O que
 * carrega o endereço é o ícone gravado na tela de início do iPad: se o IP
 * mudar, aquele ícone para de abrir e precisa ser removido e adicionado de
 * novo (por isso a reserva de DHCP é passo obrigatório do guia).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Empréstimo de Equipamentos — Unoesc",
    short_name: "Empréstimos",
    description:
      "Retirada e devolução de notebooks, tablets e extensões dos cursos de Computação da Unoesc.",
    start_url: "/",
    display: "standalone",
    theme_color: "#023770",
    background_color: "#ffffff",
    icons: [
      /**
       * Só `purpose: "any"`. Nada de `maskable`: a zona segura de um ícone
       * mascarável no Android é o círculo de 80% da largura, e com ela o
       * símbolo sobraria minúsculo dentro de muito branco. Sem `maskable`
       * declarado, o Chrome põe o ícone num quadrado arredondado branco sem
       * cortar nada.
       */
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
