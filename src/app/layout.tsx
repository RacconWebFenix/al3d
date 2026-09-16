import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AL3D — Fluxo de Caixa Mensal",
  description: "Controle financeiro simples, rápido e certeiro para pequenos produtores e makers 3D.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
