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
};

export const viewport: Viewport = {
  // Cor da barra do navegador no tablet: azul institucional.
  themeColor: "#023770",
  width: "device-width",
  initialScale: 1,
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
