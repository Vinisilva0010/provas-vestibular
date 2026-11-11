import type { Metadata, Viewport } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin", "latin-ext"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Provas para entrar na faculdade",
    template: "%s | Provas para entrar na faculdade",
  },
  description:
    "Datas, regras, conteúdo e materiais oficiais das principais provas de entrada na faculdade do Brasil, com a fonte de cada informação.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={lexend.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
