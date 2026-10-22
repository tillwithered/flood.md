import "@flood-md/react/styles.css";
import type { ReactNode } from "react";
export const metadata = { title: "Flood + Next.js" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "var(--flood-canvas)",
          color: "var(--flood-text)",
          fontFamily: "var(--flood-font-sans)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
