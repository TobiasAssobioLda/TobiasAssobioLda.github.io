import type { ReactNode } from "react";

const BUILD = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="build-id" content={BUILD} />
        <link rel="preload" as="image" href="/capa/cover.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;550;650&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-build={BUILD}>{children}</body>
    </html>
  );
}
