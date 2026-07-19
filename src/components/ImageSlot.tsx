"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ImageSlotProps {
	id: string;
	shape?: "rect" | "rounded" | "circle" | "pill";
	radius?: number;
	placeholder?: string;
	className?: string;
	style?: React.CSSProperties;
	src: string;
}

export function ImageSlot({
	id,
	shape = "rounded",
	radius = 12,
	placeholder = "Drop an image",
	className = "",
	style = {},
	src,
}: ImageSlotProps) {

	let borderRadiusStyle = "var(--radius-md) var(--radius-sm) var(--radius-md) var(--radius-sm)";
	if (shape === "circle") {
		borderRadiusStyle = "50%";
	} else if (shape === "pill") {
		borderRadiusStyle = "var(--radius-full)";
	} else if (shape === "rect") {
		borderRadiusStyle = "0";
	} else if (shape === "rounded" && radius !== 12) {
		borderRadiusStyle = `${radius}px`;
	}

	return (
		<div
			className={`relative w-full h-full overflow-hidden bg-black/5 ${className}`}
			style={{
				borderRadius: borderRadiusStyle,
				...style,
			}}
		>
			<Image
				src={src}
				alt={placeholder}
				className="w-full h-full object-cover"
        priority
				width={500}
        height={500}
			/>
			<div className="absolute inset-0 border border-border-subtle pointer-events-none" style={{ borderRadius: borderRadiusStyle }} />
		</div>
	);
}
