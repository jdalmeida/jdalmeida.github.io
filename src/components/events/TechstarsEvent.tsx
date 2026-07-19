import { ImageSlot } from "@/components/ImageSlot";
import { VideoSlot } from "@/components/VideoSlot";

export const TechstarsMetadata = {
	id: "techstars-sw",
	nome: "Techstars Startup Weekend",
	ano: "2025",
	local: "Lajeado, RS",
	localCurto: "Lajeado",
	papel: "Developer",
	num: "Nº 003",
	cor: "var(--green-700)",
	corEscura: "var(--green-900)",
	nota: "54 horas para tirar uma ideia do papel: time montado na sexta, pitch no domingo.",
};

export function TechstarsDetails() {
	return (
		<div className="grid grid-cols-2 gap-[14px]">
			<div className="col-span-2 h-[230px]">
				<ImageSlot
					id="g-techstars-sw-1"
					shape="rounded"
					radius={14}
					placeholder="Foto principal do evento"
					src="/uploads/sw_lajeado1.JPG"
				/>
			</div>
			<div className="h-[170px]">
				<ImageSlot
					id="g-techstars-sw-2"
					shape="rounded"
					radius={14}
					placeholder="Foto do evento"
					src="/uploads/sw_lajeado2.jpg"
				/>
			</div>
			<div className="h-[170px]">
				<VideoSlot
					id="g-techstars-sw-v"
					radius={14}
					placeholder="Vídeo (mp4) ou foto"
					src="/uploads/sw_lajeado3.jpg"
				/>
			</div>
		</div>
	);
}
