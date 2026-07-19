import type { Metadata } from "next";
import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SoundEffects } from "@/components/SoundEffects";
import { ScrollProgress } from "@/components/ScrollProgress";

export const metadata: Metadata = {
	title: {
		template: "%s | João de Almeida",
		default: "João de Almeida - Software Engineer",
	},
	description:
		"Especialista em desenvolvimento de software, liderança técnica e transformação digital. Compartilhando insights sobre tecnologia e inovação.",
	keywords: [
		"João de Almeida",
		"CTO",
		"Allpines",
		"desenvolvimento de software",
		"liderança técnica",
		"transformação digital",
		"Next.js",
		"React",
		"Node.js",
		"tecnologia",
		"inovação",
	],
	authors: [{ name: "João de Almeida", url: "https://github.com/jdalmeida" }],
	creator: "João de Almeida",
	publisher: "João de Almeida",
	metadataBase: new URL("https://jdalmeida.github.io"),
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: "https://jdalmeida.github.io",
		title: "João de Almeida - Software",
		description:
			"Especialista em desenvolvimento de software, liderança técnica e transformação digital.",
		siteName: "João de Almeida Blog",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "João de Almeida - Software",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "João de Almeida - Software Engineer",
		description:
			"Especialista em desenvolvimento de software, liderança técnica e transformação digital.",
		images: ["/og-image.png"],
		creator: "@jdalmeida",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: {
		icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
		shortcut: "/favicon.svg",
		apple: "/apple-touch-icon.png",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR" className="scroll-smooth">
			<body className="antialiased overflow-x-hidden paper-surface text-ink-700">
				<Analytics />
				<SpeedInsights />
				{/* Sound Effects */}
				<SoundEffects />

				<div className="flex min-h-screen flex-col relative">
					<Header />

					{/* Main content with proper spacing for fixed header */}
					<main className="flex-1 pt-20">{children}</main>

					<Footer />
				</div>

				{/* Scroll Progress Indicator */}
				<ScrollProgress />

			</body>
		</html>
	);
}
