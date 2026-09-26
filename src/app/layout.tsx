import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Young_Serif } from "next/font/google";
import "./globals.css";

const display = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-young-serif",
});

// Atkinson Hyperlegible was designed for low-vision readers.
const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "Eritaj Registry",
  description: "Rejis zèv atis ayisyen vivan: ki moun ki fè l, ki lè, ak kote li pase.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ht" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <div className="sequins" aria-hidden="true" />
        <main className="flex-1 w-full max-w-xl mx-auto px-5 py-12">{children}</main>
        <footer className="w-full max-w-xl mx-auto px-5 py-8 text-sm text-ink/75">
          <p>Yon pwogram KHADA</p>
          <p>Avèk sipò EV TRACK LLC</p>
        </footer>
      </body>
    </html>
  );
}
