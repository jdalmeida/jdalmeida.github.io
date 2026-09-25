import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono, Patrick_Hand } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Handwriting for the notebook: Patrick Hand stays legible in long text, Caveat for titles.
const hand = Patrick_Hand({ variable: "--font-hand", subsets: ["latin"], weight: "400" });
const handTitle = Caveat({ variable: "--font-hand-title", subsets: ["latin"], weight: "700" });

const description = "Portfólio de João de Almeida, Creative Developer: design, código e produtos construídos à mão.";

export const metadata: Metadata = {
  title: { default: "João de Almeida — Creative Developer", template: "%s · João de Almeida" },
  description,
  applicationName: "João de Almeida",
  authors: [{ name: "João de Almeida" }],
  creator: "João de Almeida",
  keywords: ["João de Almeida", "jalmeida", "Creative Developer", "portfólio", "design", "desenvolvimento web"],
  openGraph: { type: "website", locale: "pt_BR", siteName: "João de Almeida", title: "João de Almeida — Creative Developer", description },
  twitter: { card: "summary", title: "João de Almeida — Creative Developer", description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${hand.variable} ${handTitle.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
