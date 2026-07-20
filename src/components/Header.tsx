"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 30);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navigation = [
		{ name: "Sobre", href: "/#sobre" },
		{ name: "Artigos", href: "/#artigos" },
		{ name: "Eventos", href: "/#eventos" },
	];

	const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
		if (href.startsWith("/#") && pathname === "/") {
			e.preventDefault();
			const id = href.replace("/#", "");
			const el = document.getElementById(id);
			if (el) {
				const y = el.getBoundingClientRect().top + window.scrollY - 84;
				window.scrollTo({ top: y, behavior: "smooth" });
				setIsMenuOpen(false);
			}
		}
	};

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				(isScrolled || isMenuOpen)
					? "bg-background/95 backdrop-blur-md border-b-[1.5px] border-border-subtle shadow-sm"
					: "bg-transparent border-b-[1.5px] border-transparent"
			}`}
			style={{ height: "70px" }}
		>
			<div className="max-w-[1160px] mx-auto px-6 h-full flex items-center justify-between">
				{/* Logo */}
				<Link href="/" className="flex items-center text-text-heading">
					<img src="assets/logo-signature.png" alt="Logo" className="w-20" />
				</Link>

				{/* Desktop Navigation */}
				<nav className="hidden md:flex items-center gap-8 font-serif">
					{navigation.map((item) => (
						<a
							key={item.name}
							href={item.href}
							onClick={(e) => handleScrollTo(e, item.href)}
							className="relative text-text-body hover:text-text-heading py-1 text-[1.0625rem] transition-colors group"
						>
							{item.name}
							<span className="absolute bottom-0 left-0 w-0 h-[2px] bg-accent-secondary transition-all duration-200 group-hover:w-full" />
						</a>
					))}

					<a
						href="/#contato"
						onClick={(e) => handleScrollTo(e, "/#contato")}
						className="btn-primary"
						style={{
							padding: "8px 18px",
							fontSize: "var(--text-small)",
							background: "var(--accent-secondary)",
							borderColor: "var(--accent-secondary)",
							borderRadius: "var(--radius-md) var(--radius-sm) var(--radius-md) var(--radius-sm)",
						}}
					>
						Diga olá
					</a>
				</nav>

				{/* Mobile menu button */}
				<button
					className="md:hidden p-2 text-text-body hover:text-text-heading transition-colors"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-label="Toggle menu"
				>
					{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{/* Mobile Navigation Dropdown */}
			{isMenuOpen && (
				<div className="md:hidden absolute top-[70px] left-0 right-0 bg-background border-b-[1.5px] border-border-subtle shadow-md p-6 flex flex-col gap-4 font-serif">
					{navigation.map((item) => (
						<a
							key={item.name}
							href={item.href}
							onClick={(e) => handleScrollTo(e, item.href)}
							className="text-text-body hover:text-text-heading text-lg py-2 border-b border-border/50"
						>
							{item.name}
						</a>
					))}
					<a
						href="/#contato"
						onClick={(e) => handleScrollTo(e, "/#contato")}
						className="btn-primary w-full text-center mt-2"
						style={{
							background: "var(--accent-secondary)",
							borderColor: "var(--accent-secondary)",
						}}
					>
						Diga olá
					</a>
				</div>
			)}
		</header>
	);
}
