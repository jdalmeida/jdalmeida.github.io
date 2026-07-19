import { ImageSlot } from "@/components/ImageSlot";
import { VideoSlot } from "@/components/VideoSlot";

export const HackathonMetadata = {
	id: "hackathon-va",
	nome: "3º Hackathon de Venâncio Aires",
	ano: "2024",
	local: "Venâncio Aires, RS",
	localCurto: "Venâncio Aires",
	papel: "Dev & Leader",
	num: "Nº 004",
	cor: "var(--gold-600)",
	corEscura: "#75561F",
	nota: "Onde as startups viraram parte da minha vida.",
};

export function HackathonDetails() {
	return (
		<div className="grid grid-cols-2 gap-[14px]">
			<div className="col-span-2 h-[230px]">
				<ImageSlot
					id="g-hackathon-va-1"
					shape="rounded"
					radius={14}
					placeholder="Foto principal do evento"
					src="/uploads/hackathon1.jpg"
				/>
			</div>
			<div className="h-[170px]">
				<ImageSlot
					id="g-hackathon-va-2"
					shape="rounded"
					radius={14}
					placeholder="Foto do evento"
					src="/uploads/hackathon2.jpg"
				/>
			</div>
			<div className="h-[170px]">
				<VideoSlot
					id="g-hackathon-va-v"
					radius={14}
					placeholder="Vídeo (mp4) ou foto"
					src="/uploads/hackathon3.mp4"
				/>
			</div>
		</div>
	);
}
