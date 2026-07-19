"use client";

interface VideoSlotProps {
	id: string;
	radius?: number;
	placeholder?: string;
	className?: string;
	style?: React.CSSProperties;
	src?: string;
}

export function VideoSlot({
	radius = 12,
	placeholder = "Solte um vídeo",
	className = "",
	style = {},
	src,
}: VideoSlotProps) {
	const borderRadiusStyle = `${radius}px`;
	const isImage = src ? !/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(src) : false;

	return (
		<div
			className={`relative w-full h-full overflow-hidden bg-black/5 ${className}`}
			style={{
				borderRadius: borderRadiusStyle,
				...style,
			}}
		>
			{src ? (
				isImage ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={src}
						alt={placeholder}
						className="w-full h-full object-cover"
					/>
				) : (
					<video
						src={src}
						playsInline
						autoPlay
						muted
						loop
						preload="metadata"
						className="w-full h-full object-cover bg-black"
					/>
				)
			) : (
				<div className="flex flex-col items-center justify-center h-full p-4 text-center text-ink-300">
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.6"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="opacity-45 mb-2"
					>
						<rect x="2" y="4" width="15" height="16" rx="2" />
						<path d="m22 8-5 4 5 4V8Z" />
						<path d="m8 10 4 2-4 2v-4Z" />
					</svg>
					<div className="text-xs font-serif font-medium">{placeholder}</div>
				</div>
			)}
			<div className="absolute inset-0 border border-border-subtle pointer-events-none" style={{ borderRadius: borderRadiusStyle }} />
		</div>
	);
}

