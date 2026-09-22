import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Tipografia: uma família só para toda a interface (Geist Sans), como pede
 * interface de produto — títulos, rótulos e botões no mesmo alfabeto.
 * A monoespaçada é usada apenas nas etiquetas dos equipamentos ("NOTE-01"),
 * onde o alinhamento caractere a caractere ajuda a conferir com o adesivo
 * colado no aparelho.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Empréstimo de Equipamentos | Unoesc",
  description:
    "Sistema de empréstimo de equipamentos dos cursos de Sistemas de Informação, Ciência da Computação e Engenharia da Computação da Unoesc.",
  manifest: "/manifest.webmanifest",
  /**
   * Web app da tela de início do iPad: aberto pelo ícone, o portal ocupa a
   * tela inteira, sem a barra do Safari. É o mecanismo nativo do iOS, e ele
   * funciona em HTTP — o install do Chrome no Android não, porque exige
   * `https://` (ver a Tarefa 20).
   *
   * `statusBarStyle: "default"` deixa a barra do relógio branca com texto
   * preto, encostada no cabeçalho branco do portal. `black-translucent`
   * poria o relógio POR CIMA do conteúdo.
   */
  appleWebApp: {
    capable: true,
    title: "Empréstimos",
    statusBarStyle: "default",
  },
  icons: { apple: "/apple-touch-icon.png" },
  /**
   * A tag que o Next escreve NÃO é a que o iPad de 2023 lê. Para
   * `appleWebApp` acima ele emite `<meta name="mobile-web-app-capable">` — o
   * nome padronizado — e não `apple-mobile-web-app-capable`, que é o que o
   * iPadOS 16.4 a 17.3 entende (conferido no `generate-metadata.md`
   * instalado, e no HTML gerado). Sem esta linha, "Adicionar à Tela de
   * Início" num iPad daquela faixa abre COM a barra do Safari — e a tarefa
   * parece feita. As duas convivem de propósito; não remova nenhuma.
   */
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  // Cor da barra do navegador no tablet: azul institucional.
  themeColor: "#023770",
  width: "device-width",
  initialScale: 1,
  // Em modo web app, ocupa a área toda da tela, inclusive a das bordas
  // arredondadas do iPad Pro.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
