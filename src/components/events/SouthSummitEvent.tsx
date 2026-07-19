import { ImageSlot } from "@/components/ImageSlot";
import { VideoSlot } from "@/components/VideoSlot";

export const SouthSummitMetadata = {
	id: "south-summit",
	nome: "South Summit Brazil",
	ano: "2026",
	local: "Cais Mauá — Porto Alegre, RS",
	localCurto: "Porto Alegre",
	papel: "Corps",
	num: "Nº 001",
	cor: "#fd525b",
	corEscura: "#370c3b",
	nota: "Três dias no Cais Mauá entre startups, palcos e café. Credencial de corps — do lado de quem faz o evento acontecer.",
};

export function SouthSummitDetails() {
	return (
		<div className="grid grid-cols-2 gap-[14px]">
			<div className="col-span-2 h-[230px]">
				<ImageSlot
					id="g-south-summit-1"
					shape="rounded"
					radius={14}
					placeholder="Foto principal do evento"
					src="/uploads/ss_brazil1.jpg"
				/>
			</div>
			<div className="h-[170px]">
				<ImageSlot
					id="g-south-summit-2"
					shape="rounded"
					radius={14}
					placeholder="Foto do evento"
					src="/uploads/ss_brazil2.jpg"
				/>
			</div>
			<div className="h-[170px]">
				<VideoSlot
					id="g-south-summit-v"
					radius={14}
					placeholder="Vídeo (mp4) ou foto"
					src="/uploads/ss_brazil3.mp4"
				/>
			</div>
		</div>
	);
}
