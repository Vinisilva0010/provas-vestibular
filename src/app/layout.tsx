import { resolveSiteUrl } from "@/lib/site-url";
import type { Metadata, Viewport } from "next";
import { Anton, Lexend } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MotionProvider } from "@/components/motion/motion-provider";
import { siteName } from "@/lib/site";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin", "latin-ext"],
  variable: "--font-lexend",
  display: "swap",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl(process.env)),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
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
    <html lang="pt-BR" className={`${lexend.variable} ${anton.variable}`}>
      <body className="flex min-h-dvh flex-col overflow-x-clip antialiased">
        <MotionProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
