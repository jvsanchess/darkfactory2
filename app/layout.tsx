import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DarkFactory | Central de produção",
  description: "Centro de comando para criação, revisão e publicação de conteúdos automatizados.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
