import { ImageSlot } from "@/components/ImageSlot";
import { VideoSlot } from "@/components/VideoSlot";

export const AmchamSXMetadata = {
	id: "amcham-sx",
	nome: "Amcham SX",
	ano: "2025",
	local: "Vinícola Luiz Argenta - Flores da Cunha, RS",
	localCurto: "Flores da Cunha",
	papel: "Atendeee",
	num: "Nº 002",
	cor: "#0205d3",
	corEscura: "#091747",
	nota: "Evento anual de inovação e negócios da amcham, com palestras e muitas conexões.",
};

export function AmchamSXDetails() {
	return (
		<div className="grid grid-cols-2 gap-[14px]">
			<div className="col-span-2 h-[230px]">
				<ImageSlot
					id="g-amcham-sx-1"
					shape="rounded"
					radius={14}
					placeholder="Foto principal do evento"
					src="/uploads/sx1.jpg"
				/>
			</div>
			<div className="h-[170px]">
				<ImageSlot
					id="g-amcham-sx-2"
					shape="rounded"
					radius={14}
					placeholder="Foto do evento"
					src="/uploads/sx2.jpg"
				/>
			</div>
			<div className="h-[170px]">
				<VideoSlot
					id="g-amcham-sx-v"
					radius={14}
					placeholder="Vídeo (mp4) ou foto"
					src="/uploads/sx3.mp4"
				/>
			</div>
		</div>
	);
}
