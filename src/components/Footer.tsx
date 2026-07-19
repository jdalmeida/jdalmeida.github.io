"use client";

export function Footer() {
	return (
		<footer
			className="border-t-[1.5px] border-border-subtle px-10 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent font-serif"
		>
			<img
				src="/assets/logo-signature.png"
				alt="Almeida"
				style={{ height: "32px", opacity: 0.8 }}
			/>
			<div
				className="font-mono text-text-muted text-xs tracking-wider"
			>
				© 2026 joão de almeida — feito à mão
			</div>
		</footer>
	);
}
