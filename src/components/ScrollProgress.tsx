"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
	const [scrollProgress, setScrollProgress] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
			if (totalHeight > 0) {
				const progress = (window.scrollY / totalHeight) * 100;
				setScrollProgress(progress);
			} else {
				setScrollProgress(0);
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		// Run once on mount to capture initial scroll position
		handleScroll();

		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<>
			{/* Horizontal Ink Progress Bar (Top) */}
			<div className="fixed top-0 left-0 right-0 z-[999] h-[3px] bg-paper-300/30 pointer-events-none">
				<div
					className="h-full bg-accent-secondary transition-all duration-75 ease-out rounded-r-sm"
					style={{ width: `${scrollProgress}%` }}
				/>
			</div>

			{/* Vertical Wax Seal Scroll Indicator (Desktop - Right Edge) */}
			<div 
				className="fixed right-6 top-[20%] bottom-[20%] w-[1.5px] bg-gradient-to-b from-transparent via-border-strong/30 to-transparent hidden lg:block z-[40] pointer-events-none"
				aria-hidden="true"
			>
				<div
					className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-out pointer-events-auto cursor-help group"
					style={{
						top: `${scrollProgress}%`,
						left: "50%",
					}}
				>
					<img
						src="/assets/seal-red.png"
						alt="Selo de progresso"
						className="w-9 h-9 drop-shadow-[0_4px_10px_rgba(140,61,40,0.15)] object-contain transition-transform duration-200 group-hover:scale-110 active:scale-95"
					/>
					{/* Elegant Monospace Tooltip */}
					<div className="absolute right-11 top-1/2 -translate-y-1/2 bg-surface-card border-[1.5px] border-border-subtle px-2.5 py-1 rounded shadow-md text-text-muted font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
						{Math.round(scrollProgress)}% lido
					</div>
				</div>
			</div>
		</>
	);
}
