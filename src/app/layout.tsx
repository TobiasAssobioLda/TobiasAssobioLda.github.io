import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preload" as="image" href="/capa/cover.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
