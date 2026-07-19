"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
	SouthSummitMetadata,
	SouthSummitDetails,
} from "@/components/events/SouthSummitEvent";
import {
	AmchamSXMetadata,
	AmchamSXDetails,
} from "@/components/events/AmchamSXEvent";
import {
	TechstarsMetadata,
	TechstarsDetails,
} from "@/components/events/TechstarsEvent";
import {
	HackathonMetadata,
	HackathonDetails,
} from "@/components/events/HackathonEvent";

interface Post {
	slug: string;
	title: string;
	excerpt: string;
	date: string;
	readTime: number;
}

export function HomeClient({ posts }: { posts: Post[] }) {
	const [showIntro, setShowIntro] = useState(true);
	const [eventoAbertoId, setEventoAbertoId] = useState<string | null>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);

	const eventosList = [
		{ metadata: SouthSummitMetadata, Details: SouthSummitDetails },
		{ metadata: AmchamSXMetadata, Details: AmchamSXDetails },
		{ metadata: TechstarsMetadata, Details: TechstarsDetails },
		{ metadata: HackathonMetadata, Details: HackathonDetails },
	];

	const n = eventosList.length;
	const center = (n - 1) / 2;
	const idx = eventosList.findIndex((e) => e.metadata.id === eventoAbertoId);
	const eventoAberto = idx >= 0 ? eventosList[idx] : null;

	useEffect(() => {
		// Run intro overlay animation on initial mount
		setShowIntro(true);
		const timer = setTimeout(() => {
			setShowIntro(false);
		}, 3400);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		// Scroll-Parallax Logic
		const onScroll = () => {
			const y = window.scrollY;
			const elements = document.querySelectorAll("[data-par]");
			elements.forEach((el: any) => {
				const par = parseFloat(el.getAttribute("data-par") || "0");
				el.style.transform = `translateY(${-y * par}px)`;
			});
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		// Escape Key Event listener
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && eventoAbertoId) {
				setEventoAbertoId(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [eventoAbertoId]);

	const closeIntro = () => {
		setShowIntro(false);
	};

	const scrollSections = {
		artigos: () => {
			const el = document.getElementById("artigos");
			if (el) {
				const y = el.getBoundingClientRect().top + window.scrollY - 84;
				window.scrollTo({ top: y, behavior: "smooth" });
			}
		},
		eventos: () => {
			const el = document.getElementById("eventos");
			if (el) {
				const y = el.getBoundingClientRect().top + window.scrollY - 84;
				window.scrollTo({ top: y, behavior: "smooth" });
			}
		},
	};

	const irPrev = () => {
		setEventoAbertoId(eventosList[(idx - 1 + n) % n].metadata.id);
	};

	const irProx = () => {
		setEventoAbertoId(eventosList[(idx + 1) % n].metadata.id);
	};

	return (
		<div className="paper-surface min-h-screen relative overflow-x-hidden text-text-body font-serif">
			{/* Animated Intro Overlay */}
			{showIntro && (
				<div
					onClick={closeIntro}
					className="paper-surface fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
					style={{
						animation: "introFade 3.4s ease forwards",
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 997.815 707.444"
						className="signature-animated w-[min(420px,60vw)] text-ink-900"
					>
						<g transform="translate(-35.25734,-48.309492)">
							<path id="p1" pathLength="1" d="M 784.35352,63.15625 C 345.00205,211.72046 53.890625,433.93164 53.890625,433.93164 c -6.637544,5.06632 -7.910783,14.55441 -2.84375,21.19141 5.066195,6.63629 14.552781,7.90945 21.189453,2.84375 0,0 287.272502,-222.38721 721.802732,-369.321153 7.90936,-2.674665 47.90783,-32.425999 45.23334,-40.335423 -9.00283,-0.107691 -44.74256,11.701211 -54.91888,14.846026 z" />
							<path id="p2" pathLength="1" d="m 887.06445,206.83008 c -5.33758,3.05286 -13.93558,5.39534 -24.43945,9.78711 -21.00774,8.78354 -51.20042,22.005 -87.83789,38.75195 -73.27495,33.49391 -172.25105,81.05402 -274.05664,135.01953 -72.18617,38.26474 -145.64059,79.7379 -212.5586,121.76563 10.37309,-14.65362 20.26454,-29.14489 29.11329,-43.21289 55.45989,-88.17186 82.31931,-161.2202 77.95117,-208.17774 -0.77362,-8.31329 -8.1398,-14.42554 -16.45313,-13.65234 -8.31329,0.77362 -14.42554,8.13979 -13.65234,16.45312 2.86313,30.77861 -19.86596,104.10339 -73.44141,189.2793 -22.05518,35.06402 -49.42299,72.51818 -81.59765,110.79883 -0.16213,0.11336 -0.33803,0.22648 -0.5,0.33984 -84.74039,59.30464 -150.038395,116.07262 -173.070316,170.68945 -6.094205,14.46966 11.175676,27.49052 23.410157,17.6504 67.308439,-54.19529 123.840989,-110.81493 170.562499,-166 82.45931,-57.36137 184.66919,-116.35388 284.39844,-169.21875 101.13515,-53.61013 199.66854,-100.96016 272.46289,-134.23438 36.39717,-16.63711 66.37864,-29.76319 86.93359,-38.35742 10.27748,-4.29711 18.24001,-7.472 23.22656,-9.3086 2.49328,-0.91829 28.26642,-19.41595 43.06438,-44.82145 8.46464,-14.5323 -47.71852,13.13276 -53.51555,16.44841 z" />
							<path id="p3" pathLength="1" d="m 537.14844,196.7168 c -2.68489,0.12812 -4.94862,0.86692 -6.1836,1.48437 -2.46994,1.23491 -3.29719,2.17464 -3.99609,2.85938 -1.3978,1.36946 -1.81801,2.05924 -2.30273,2.74804 -0.96946,1.37762 -1.64919,2.54323 -2.47657,4.00391 -0.29966,0.52904 -0.78063,1.53337 -1.10351,2.125 L 253.88281,633.37891 c -4.4557,7.06155 -2.34301,16.39814 4.71875,20.85351 7.06104,4.45607 16.39751,2.34428 20.85352,-4.7168 L 457.52539,367.32227 c -2.9171,8.94213 -5.85214,17.86789 -8.61328,27.10937 -15.32808,51.30274 -27.71555,106.32812 -30.30274,156.64844 -5.66503,110.18414 37.52477,153.06782 74.24553,122.16992 6.38952,-5.37589 -14.29854,-6.01739 -19.67521,-12.40625 -19.32898,-22.97301 -26.76175,-61.7511 -24.37305,-108.21094 2.3887,-46.45984 14.17566,-99.67323 29.07617,-149.54492 14.90051,-49.87169 32.86545,-96.48195 47.27735,-130.30664 7.20594,-16.91234 13.53437,-30.64975 18.07812,-39.89648 1.72293,-3.50624 2.87673,-5.64891 3.98828,-7.7129 l 3.40235,-5.39062 c 4.46883,-7.08321 2.32844,-16.44958 -4.77344,-20.88867 -2.9163,-1.82269 -6.02215,-2.3039 -8.70703,-2.17578 z" />
							<path id="p4" pathLength="1" d="m 623.0312,172.82246 c -5.36524,0.62474 -9.98957,4.06451 -12.13086,9.02344 0,0 -121.04209,277.25866 -173.27257,414.18778 -5.76699,15.11895 -9.39927,35.2948 -7.71271,46.84154 2.59068,17.73655 18.8553,36.96616 36.61658,39.38143 8.55206,1.16296 41.48644,-9.83732 22.05417,-13.56556 -27.04605,-5.189 -27.39885,-16.39998 -31.59565,-31.1171 -3.17479,-11.13316 -0.18992,-22.61024 4.89456,-34.38434 L 638.66011,193.83222 c 3.30887,-7.66512 -0.22199,-16.56133 -7.88672,-19.87109 -2.43607,-1.05248 -5.10625,-1.44519 -7.74219,-1.13867 z" />
							<path id="p5" pathLength="1" d="m 558.59375,430.16992 c -5.3162,0.95451 -9.71934,4.67268 -11.55078,9.75391 L 474.9707,639.92578 c -2.69734,7.53073 0.93781,15.85933 8.29378,19.00212 7.35597,3.1428 15.88703,0.0122 19.46404,-7.14274 0,0 22.88179,-45.97296 46.85742,-89.01758 7.08105,-12.71296 14.21243,-24.98437 20.85547,-35.82617 -1.54268,5.31201 -3.17116,10.71509 -4.94141,16.04882 -8.43747,25.42199 -18.15625,48.42188 -18.15625,48.42188 -3.06867,7.2814 -0.0131,15.69777 7.01217,19.31457 7.02526,3.61679 15.65075,1.21415 19.79447,-5.51379 0,0 21.73108,-35.3857 44.30469,-68.41211 2.04453,-2.99126 4.01998,-5.66162 6.06445,-8.58594 -2.94707,6.96953 -5.95778,14.03148 -9.13867,21.11719 -16.14254,35.95889 -28.39784,44.61186 -33.36719,69.96875 -1.70167,8.68301 -2.15532,18.45909 1.53711,26.5 3.09539,6.74075 6.62792,12.93458 16.00977,15.45508 9.38184,2.5205 18.01366,-1.47324 25.07812,-7.00195 6.57497,-5.14592 9.38718,-6.82556 15.20062,-29.7813 1.47956,-5.84242 -22.69351,2.00607 -28.47992,3.69145 3.21882,-6.39724 16.90539,-33.70352 31.60547,-66.44922 8.25771,-18.39475 16.28635,-37.3479 21.90821,-53.32812 2.81092,-7.99011 5.03231,-15.18923 6.38672,-21.69336 1.3544,-6.50413 3.63387,-11.65769 -0.83399,-21.08984 -2.49871,-5.27506 -11.60459,-10.54677 -17.49023,-9.99219 -5.88565,0.55457 -8.71309,2.72313 -11.37305,4.61719 -5.31991,3.7881 -9.60763,8.48017 -14.64258,14.38085 -5.99717,7.02837 -12.64653,15.88956 -19.45312,25.32032 1.13228,-8.03948 1.16813,-15.74468 -2.72657,-24.24219 -1.19515,-2.60762 -3.37804,-5.80091 -7.00781,-8.02539 -3.62977,-2.22448 -8.22428,-2.83836 -11.54297,-2.38867 -6.63737,0.89937 -9.50408,3.6666 -12.27929,6.05664 -3.62102,3.11845 -6.84262,6.97759 -10.0918,11.22656 l 11.66992,-32.38281 c 2.83051,-7.85439 -1.24162,-16.51629 -9.0957,-19.34766 -2.49694,-0.89951 -5.18668,-1.12584 -7.79883,-0.65625 z m 100.50586,54.6875 c 0.26265,-0.18703 0.28418,-0.041 -0.20703,0.18945 0.0366,-0.0277 0.17584,-0.16724 0.20703,-0.18945 z m -65.10742,9.20899 c 0.0485,0.0241 -0.18137,0.14968 -0.4668,0.30468 0.0219,-0.0194 0.0966,-0.11312 0.11719,-0.13086 0.17147,-0.14767 0.30717,-0.19493 0.34961,-0.17382 z" />
							<path id="p6" pathLength="1" d="m 781.5918,440.36719 c -1.53656,0.0641 -2.96701,0.27498 -4.20703,0.58593 -4.9601,1.24382 -8.59976,3.41055 -12.26758,5.9375 -14.67129,10.10783 -30.36845,28.55718 -46.93164,51.12696 -9.83807,13.4058 -19.48163,28.11732 -28.22461,42.92187 -2.05274,2.11174 -3.83856,4.17571 -5.44336,7.04883 -0.92591,1.65769 -1.94004,3.89041 -2.39453,6.64063 -3.00056,5.52566 -5.89011,11.03488 -8.46485,16.42187 -5.78639,12.10659 -10.3847,23.67016 -13.12695,34.48438 -2.41196,9.51167 -3.64023,18.56103 -1.34961,27.80078 0.17432,9.25917 6.15482,17.95254 14.33203,22.03515 9.21066,4.59859 20.34329,4.44185 32.28516,0.41602 10.47029,-3.52973 22.06316,-10.22984 34.88867,-20.79102 -1.62181,8.10327 -2.02864,16.22539 0.84375,24.77735 2.65772,7.9155 11.22915,12.1776 19.14453,9.51953 7.91574,-2.65851 12.17711,-11.23109 9.51758,-19.14649 -0.23701,-0.70564 -0.0344,-10.80815 3.7168,-22.29296 3.75121,-11.48481 9.7065,-24.73878 15.30468,-36.12696 5.59819,-11.38818 10.68452,-20.66439 13.36914,-26.01758 0.67116,-1.33829 1.12266,-2.08035 1.87891,-4.1875 0.18906,-0.52678 0.42122,-1.12434 0.68359,-2.43164 0.26238,-1.3073 1.40604,-6.79481 1.66038,-14.33852 -2.08258,-30.00349 -13.94128,-11.59349 -26.87131,0.0885 -2.59932,2.33996 -2.62001,2.81166 -3.65821,4.16797 -1.03819,1.35631 -2.27448,3.03901 -3.84179,5.20899 -35.99344,49.83362 -62.95022,68.42117 -76.29493,72.91992 -3.77959,1.27417 -6.00758,1.42581 -7.42578,1.35547 -0.0258,-0.55214 -0.0819,-1.10244 -0.16797,-1.64844 -0.18299,-0.50566 -0.70251,-6.00768 1.29297,-13.87695 1.99548,-7.86927 5.88634,-17.96948 11.09961,-28.87696 1.54272,-3.22775 3.40425,-6.6372 5.15821,-9.98828 9.88697,-1.58334 19.88232,-6.1014 31.82031,-13.2832 25.50354,-15.34273 56.63003,-43.2843 64.33203,-84.13867 1.07693,-5.71245 1.61375,-10.62675 1.19531,-15.65821 -0.41843,-5.03145 -1.81222,-11.20455 -7.45117,-16.07421 -4.22921,-3.65225 -9.79267,-4.77245 -14.40234,-4.58008 z m -13.54883,44.76172 c -6.84558,16.08544 -19.17501,29.93157 -32.10156,40.21093 2.20764,-3.16503 4.40173,-6.40938 6.62109,-9.43359 8.8502,-12.0597 17.82099,-22.63956 25.48047,-30.77734 z m -79.01172,146.48046 c 0.24321,0.78189 0.39524,1.62663 0.25977,2.55665 -0.0139,-0.85804 -0.10078,-1.71335 -0.25977,-2.55665 z" />
							<path id="p7" pathLength="1" d="m 959.19922,355.23437 a 15.119612,15.119612 0 0 0 -14.92383,8.02149 c 0,0 -27.28008,52.02482 -51.14648,109.80664 -6.58264,15.93692 -12.82291,32.25872 -18.27735,48.22266 -30.85853,1.26938 -54.50598,19.55112 -68.24804,41.32617 -15.2119,24.10407 -20.96166,52.03844 -17.97852,74.51758 a 15.119612,15.119612 0 0 0 5.53711,9.8125 c 5.39277,4.31827 12.71175,6.66187 19.39453,6.35546 6.68278,-0.3064 12.51893,-2.66382 17.77344,-5.77148 10.50901,-6.21532 19.58644,-15.77407 29,-27.67969 0.0752,-0.0951 0.15139,-0.21713 0.22656,-0.3125 1.11926,2.9047 2.45764,5.75215 4.22852,8.49414 a 15.1181,15.1181 0 0 0 20.90234,4.49805 15.1181,15.1181 0 0 0 4.49805,-20.90234 c -1.45027,-2.24558 -2.80365,-18.03892 1.3457,-38.94922 8.37659,-14.41711 16.62947,-29.73885 24.50977,-45.50586 17.57765,-35.16962 33.22754,-71.63672 43.7832,-100.47266 5.27783,-14.41797 9.28007,-26.85256 11.66406,-36.77148 1.192,-4.95946 2.01648,-9.21204 2.27344,-13.50391 0.12848,-2.14593 0.1671,-4.29752 -0.35352,-7.07226 -0.52061,-2.77474 -1.52056,-6.89004 -6.04297,-10.67188 a 15.119612,15.119612 0 0 0 -8.16601,-3.44141 z m -93.9375,197.55274 c -0.54195,2.05116 -1.22533,4.20411 -1.7168,6.2168 -0.22723,0.93055 -0.37574,1.77543 -0.59765,2.69726 -9.05122,15.27786 -18.02654,28.88343 -26.33594,39.39258 -6.82065,8.62629 -13.23222,14.92352 -17.95117,18.46094 1.26411,-12.73291 5.64291,-28.335 13.51367,-40.80664 8.12526,-12.87493 18.509,-22.50807 33.08789,-25.96094 z" />
							<path id="p8" pathLength="1" d="m 1016.7559,418.97656 c -2.9758,0.22939 -5.8172,1.33439 -8.1661,3.17578 -1.4146,1.11079 -1.5612,1.46483 -2.1699,2.09766 l -0.01,-0.006 c -0.013,0.0155 -0.026,0.0334 -0.039,0.0488 -1.028,1.07841 -1.8603,1.98115 -1.9355,2.41015 -49.77896,59.22101 -96.84073,142.30728 -121.73638,235.15235 -2.16231,8.06477 2.62268,16.35544 10.6875,18.51758 8.06418,2.16244 16.35457,-2.62152 18.51758,-10.68555 10.99048,-40.98753 26.82151,-80.0809 45.18946,-115.95117 -5.623,17.4351 -10.88384,34.57948 -14.68164,49.62304 -2.78346,11.02561 -4.89156,20.94883 -6.00196,29.56446 -1.11039,8.61562 -2.32804,15.2683 1.35742,24.28515 4.2455,10.38703 9.56438,18.20686 16.66211,23.46094 7.09773,5.25408 16.29121,7.18036 23.95703,5.4375 7.66583,-1.74286 13.56408,-6.27891 17.4629,-11.97461 3.89882,-5.69569 8.05278,-13.38795 9.63178,-21.89664 3.4092,-18.37128 3.0991,-28.53547 -11.80071,-19.07178 -8.80958,5.59544 -19.95764,18.50783 -20.86804,24.18261 -1.33782,-1.61927 -7.27088,-13.91095 -6.41421,-20.55794 0.85668,-6.64698 2.72437,-15.70776 5.33008,-26.02929 5.21142,-20.64308 13.33442,-46.46361 21.92969,-71.59375 8.59529,-25.13014 17.67199,-49.63623 24.80859,-67.94141 3.5683,-9.15259 6.659,-16.77163 8.9102,-22.03516 1.1042,-2.58188 2.0021,-4.57568 2.582,-5.7832 -0.1015,0.13043 -0.5223,0.47391 -0.7012,0.6582 0.06,-0.071 0.1194,-0.1537 0.1797,-0.22461 8.7002,-10.24242 0.7135,-25.89614 -12.6855,-24.86328 z" />
							<path id="p9" pathLength="1" d="m 910.23437,584.05859 c -5.37517,0.53046 -10.059,3.8883 -12.2871,8.8086 -3.44506,7.60683 -0.0704,16.5661 7.5371,20.00976 0,0 13.17586,5.99679 30.2129,9.91407 17.03703,3.91727 30.71901,-0.0515 50.52123,-10.59142 7.37079,-3.92302 29.6848,-19.48142 21.3719,-18.69736 -9.65658,0.9108 -19.6083,2.25668 -26.97891,6.18007 -8.12596,4.32511 -24.31974,-3.18071 -38.13883,-6.35809 -13.8191,-3.17739 -24.51563,-7.99219 -24.51563,-7.99219 -2.4178,-1.09504 -5.08129,-1.53424 -7.72266,-1.27344 z" />
							<path id="p10" pathLength="1" d="m 835.11133,473.93945 a 15.1181,15.1181 0 0 0 -7.29102,2.84571 15.1181,15.1181 0 0 0 -3.22461,21.13476 l 2.08399,2.83594 a 15.1181,15.1181 0 0 0 21.13476,3.22656 15.1181,15.1181 0 0 0 3.22657,-21.13672 l -2.08399,-2.83398 a 15.1181,15.1181 0 0 0 -13.8457,-6.07227 z" />
						</g>
					</svg>
				</div>
			)}

			{/* Main Content Wrapper (Fades in after intro) */}
			<div className={`transition-opacity duration-1000 ${showIntro ? "opacity-0 h-screen overflow-hidden" : "opacity-100"}`}>
				{/* Hero Section */}
				<header
				id="topo"
				className="relative min-h-screen flex items-center px-6 sm:px-10 lg:px-16 py-20 overflow-hidden"
			>
				<div className="relative z-10 w-full max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
					{/* Text Column */}
					<div className="w-full lg:col-span-7 flex flex-col justify-center">
						<div
							className="font-mono text-text-caption tracking-widest uppercase text-green-700 mb-[18px]"
							style={{
								animation: "inkIn 700ms var(--ease-organic) both",
							}}
						>
							( Jalmeida - portfólio )
						</div>
						<h1
							className="font-display font-semibold text-text-display-1 text-6xl leading-[1.02] text-text-heading mb-[22px]"
							style={{
								animation: "inkIn 800ms var(--ease-organic) 120ms both",
							}}
						>
							Construindo software<br />
							<span className="text-accent-secondary">que molda o futuro.</span>
						</h1>
						<p
							className="text-text-body-lg leading-[1.65] max-w-[520px] mb-[34px] text-justify"
							style={{
								animation: "inkIn 800ms var(--ease-organic) 260ms both",
								textWrap: "pretty",
							}}
						>
							Olá! Meu nome é João. Escrevo sobre IA, software e tudo que me interessa sobre tecnologia. Guardo aqui também as memórias dos lugares por onde passei.
						</p>
						<div
							className="flex gap-4 items-center mb-[46px]"
							style={{
								animation: "inkIn 800ms var(--ease-organic) 400ms both",
							}}
						>
							<button onClick={scrollSections.artigos} className="btn-primary">
								Leia meus artigos
							</button>
							<button onClick={scrollSections.eventos} className="btn-secondary">
								Veja por onde passei
							</button>
						</div>
					</div>

					{/* Collage Column */}
					<div
						className="w-full lg:col-span-5 flex items-center justify-center relative min-h-[320px] sm:min-h-[400px] lg:min-h-[500px]"
						style={{
							animation: "driftIn 1000ms var(--ease-organic) 400ms both",
						}}
					>
						{/* Main Highlighted Logo Collage */}
						<div
							className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-none aspect-[4/3] flex items-center justify-center z-10"
							style={{
								animation: "floatY 8s ease-in-out infinite",
							}}
						>
							<img
								src="/logo_collage.png"
								alt="Colagem de Logos </J>"
								className="w-full h-auto object-contain drop-shadow-[0_12px_28px_rgba(43,35,26,0.14)] select-none"
							/>
						</div>

						{/* Floating Ornaments - clustered around the main collage */}
						<div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-visible hidden sm:block">
							{/* Camellia */}
							<div
								data-par="0.05"
								className="absolute -left-[10%] top-[10%] z-20"
								style={{
									animation: "driftIn 900ms var(--ease-organic) 300ms both, floatY 7s ease-in-out 1300ms infinite",
								}}
							>
								<img
									src="/assets/camellia.png"
									alt=""
									className="w-[120px] lg:w-[150px] mix-blend-multiply -rotate-12"
								/>
							</div>

							{/* Blueprint */}
							<div
								data-par="0.09"
								className="absolute -right-[8%] top-[5%] z-0"
								style={{
									animation: "driftIn 900ms var(--ease-organic) 480ms both, floatY 8s ease-in-out 1500ms infinite",
								}}
							>
								<img
									src="/assets/blueprint.png"
									alt=""
									className="w-[110px] lg:w-[130px] rounded-[4px] shadow-[var(--shadow-md)] rotate-6"
								/>
							</div>

							{/* Envelope */}
							<div
								data-par="0.14"
								className="absolute -right-[10%] bottom-[20%] z-20"
								style={{
									animation: "driftIn 900ms var(--ease-organic) 640ms both, floatY 6s ease-in-out 1600ms infinite",
								}}
							>
								<img
									src="/assets/envelope.png"
									alt=""
									className="w-[120px] lg:w-[140px] rounded-[4px] shadow-[var(--shadow-md)] rotate-12"
								/>
							</div>

							{/* Postcard */}
							<div
								data-par="0.07"
								className="absolute -left-[12%] bottom-[22%] z-0"
								style={{
									animation: "driftIn 900ms var(--ease-organic) 800ms both, floatY 7.5s ease-in-out 1800ms infinite",
								}}
							>
								<img
									src="/assets/postcard.png"
									alt=""
									className="w-[130px] lg:w-[160px] rounded-[4px] shadow-[var(--shadow-md)] -rotate-6"
								/>
							</div>

							{/* Red Seal */}
							<div
								data-par="0.18"
								className="absolute left-[12%] -bottom-[4%] z-20"
								style={{
									animation: "driftIn 900ms var(--ease-organic) 950ms both, floatY 5.5s ease-in-out 1900ms infinite",
								}}
							>
								<img
									src="/assets/seal-red.png"
									alt=""
									className="w-[60px] lg:w-[76px] mix-blend-multiply rotate-12"
								/>
							</div>

							{/* Fern */}
							<div
								data-par="0.12"
								className="absolute right-[22%] -bottom-[8%] z-10"
								style={{
									animation: "driftIn 900ms var(--ease-organic) 1100ms both, floatY 6.5s ease-in-out 2000ms infinite",
								}}
							>
								<img
									src="/assets/fern.png"
									alt=""
									className="w-[80px] lg:w-[100px] mix-blend-multiply -rotate-10"
								/>
							</div>
						</div>
					</div>
				</div>
			</header>

			{/* Sobre Section */}
			<section
				id="sobre"
				className="scroll-margin-top max-w-[1160px] mx-auto px-10 py-[110px] grid grid-cols-1 md:grid-cols-12 gap-[72px]"
				style={{ scrollMarginTop: "90px" }}
			>
				<div className="md:col-span-7">
					<div className="font-mono text-text-caption tracking-widest uppercase text-green-700 mb-[14px]">
						( 01 — sobre )
					</div>
					<h2 className="font-display font-semibold text-text-display-2 text-text-heading text-3xl mb-6">
						Sobre mim
					</h2>
					<p className="text-text-body-lg leading-[1.65] mb-[18px] text-justify" style={{ textWrap: "pretty" }}>
						Sou João Gabriel de Almeida, desenvolvedor no interior do Rio Grande do Sul. Gosto de ferramentas que parecem pensadas — algumas linhas de cuidado num lugar que quase ninguém olha.
					</p>
					<p className="text-text-body leading-[1.65] mb-[28px] text-justify" style={{ textWrap: "pretty" }}>
						Hoje passo os dias entre código, produto e escrita, tentando entender o que a IA muda no ofício de programar. Spoiler: quase tudo, menos o cuidado.
					</p>
					<div className="flex gap-[10px] flex-wrap">
						<span className="inline-flex items-center gap-[6px] px-3 py-1 font-mono text-[0.8125rem] tracking-wider uppercase bg-green-100 text-green-900 border border-green-300 rounded-[999px]">
							produto
						</span>
						<span className="inline-flex items-center gap-[6px] px-3 py-1 font-mono text-[0.8125rem] tracking-wider uppercase bg-[#F3E1D6] text-terracotta-700 border border-terracotta-300 rounded-[999px]">
							ia aplicada
						</span>
						<span className="inline-flex items-center gap-[6px] px-3 py-1 font-mono text-[0.8125rem] tracking-wider uppercase bg-paper-200 text-ink-700 border border-ink-300 rounded-[999px]">
							comunidade
						</span>
					</div>
				</div>
			</section>

			{/* Artigos Section */}
			<section
				id="artigos"
				className="bg-paper-50 border-y-[1.5px] border-border-subtle"
				style={{ scrollMarginTop: "90px" }}
			>
				<div className="max-w-[900px] mx-auto px-10 py-[110px] relative">
					<img
						src="/assets/stamp.png"
						alt=""
						aria-hidden="true"
						className="absolute right-[30px] top-[70px] w-[78px] rounded-[3px] shadow-[var(--shadow-md)] rotate-14 pointer-events-none"
					/>
					<div>
						<div className="font-mono text-text-caption tracking-widest uppercase text-green-700 mb-[14px]">
							( 02 — escrita )
						</div>
						<h2 className="font-display font-semibold text-text-display-2 text-3xl text-text-heading mb-[10px]">
							Artigos
						</h2>
						<p className="text-text-body text-text-muted mb-[26px]">
							Notas sobre IA, contexto e o ofício de programar.
						</p>
					</div>

					{/* Article cards */}
					<div className="flex flex-col">
						{posts.map((post) => (
							<Link
								key={post.slug}
								href={`/blog/${post.slug}`}
								className="block py-6 border-b-[1.5px] border-border-subtle group hover:no-underline"
							>
								<div className="flex justify-between font-mono text-text-caption text-text-muted mb-2">
									<span>
										{new Date(post.date).toLocaleDateString("pt-BR", {
											day: "2-digit",
											month: "short",
											year: "numeric",
										}).replace(" de ", " ")}
									</span>
									<span>{post.readTime} min</span>
								</div>
								<h3 className="font-serif font-bold text-text-h2 text-text-heading group-hover:text-accent-secondary transition-colors duration-200 m-0">
									{post.title}
								</h3>
								<p className="font-serif text-text-body leading-[1.65] mt-[6px] m-0 text-justify">
									{post.excerpt}
								</p>
							</Link>
						))}
					</div>

					<div className="mt-[34px]">
						<Link
							href="/blog"
							className="font-mono text-text-small tracking-wider text-accent-secondary hover:text-terracotta-700 hover:underline"
						>
							ver todos no blog ↗
						</Link>
					</div>
				</div>
			</section>

			{/* Eventos Section */}
			<section
				id="eventos"
				className="max-w-[1160px] mx-auto px-10 py-[110px] pb-[100px]"
				style={{ scrollMarginTop: "90px" }}
			>
				<div className="max-w-[660px] mx-auto text-center mb-12">
					<div className="font-mono text-text-caption tracking-widest uppercase text-green-700 mb-[14px]">
						( 03 — na estrada )
					</div>
					<h2 className="font-display font-semibold text-text-display-2 text-text-heading mb-[14px]">
						Eventos &amp; credenciais
					</h2>
					<p className="text-text-body-lg leading-[1.65] m-0 text-justify" style={{ textWrap: "pretty" }}>
						Uma pilha de crachás dos lugares por onde passei. Clique numa credencial para abrir o registro completo — com a nota, o local e a galeria de fotos.
					</p>
				</div>

				{/* Fanned events cards */}
				<div className="flex justify-center items-start flex-wrap min-h-[400px] mt-[76px]">
					{eventosList.map((ev, i) => {
						const d = i - center;
						const fanTransform = `rotate(${d * 7}deg) translateY(${d * d * 10}px)`;
						const zIndex = i + 1;

						const isHovered = hoveredId === ev.metadata.id;
						const transformStyle = isHovered
							? "translateY(-30px) rotate(0deg) scale(1.05)"
							: fanTransform;
						const zIndexStyle = isHovered ? 60 : zIndex;

						return (
							<div
								key={ev.metadata.id}
								onClick={() => setEventoAbertoId(ev.metadata.id)}
								onMouseEnter={() => setHoveredId(ev.metadata.id)}
								onMouseLeave={() => setHoveredId(null)}
								title="Ver o registro do evento"
								className="cursor-pointer"
								style={{
									margin: "0 -38px",
									transform: transformStyle,
									zIndex: zIndexStyle,
									transition: "transform 360ms var(--ease-organic)",
								}}
							>
								<div className="grain-overlay" style={{
									width: "236px",
									height: "344px",
									background: "var(--paper-50)",
									border: "1.5px solid var(--border-subtle)",
									borderRadius: "var(--radius-md) var(--radius-sm) var(--radius-md) var(--radius-sm)",
									boxShadow: "var(--shadow-lg)",
									overflow: "hidden",
									display: "flex",
									flexDirection: "column",
								}}>
									<div style={{ padding: "16px 18px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "7px" }}>
										<div style={{ width: "42px", height: "12px", borderRadius: "var(--radius-full)", background: "var(--paper-200)", border: "1px solid var(--border-subtle)", boxShadow: "inset 0 1px 2px rgba(43,35,26,0.25)" }} />
										<div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "12.5px", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-900)", textAlign: "center", lineHeight: 1.3 }}>
											{ev.metadata.nome}
										</div>
										<div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", color: "var(--text-muted)" }}>
											{ev.metadata.localCurto} · {ev.metadata.ano}
										</div>
									</div>
									<div
										className="flex-1 flex flex-col justify-center items-center gap-[5px] p-[16px]"
										style={{ background: ev.metadata.cor }}
									>
										<div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(250,245,233,0.75)" }}>
											credencial
										</div>
										<div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "34px", lineHeight: 1, color: "var(--paper-50)" }}>
											João Gabriel
										</div>
										<div style={{ fontStyle: "italic", fontSize: "16px", color: "rgba(250,245,233,0.9)" }}>
											de Almeida
										</div>
									</div>
									<div
										style={{ background: ev.metadata.corEscura, padding: "12px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "16px", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--paper-50)" }}
									>
										{ev.metadata.papel}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div style={{ textAlign: "center", marginTop: "56px", fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
					↑ clique numa credencial para ver o registro completo
				</div>
			</section>

			{/* Modal Event details */}
			{eventoAberto && (
				<div
					onClick={() => setEventoAbertoId(null)}
					className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto px-[22px] py-[52px]"
					style={{
						background: "rgba(43,35,26,0.55)",
						animation: "overlayIn 240ms ease both",
					}}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						className="paper-surface relative overflow-hidden"
						style={{
							width: "min(1060px, 100%)",
							background: "var(--paper-100)",
							border: "1.5px solid var(--border-strong)",
							borderRadius: "var(--radius-lg)",
							boxShadow: "var(--shadow-lg)",
							animation: "panelIn 360ms var(--ease-organic) both",
						}}
					>
						{/* Modal Header */}
						<div
							className="flex items-center justify-between gap-4 py-5 px-[26px] border-b-[1.5px] border-border-subtle"
							style={{ background: "var(--paper-50)" }}
						>
							<div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--green-700)" }}>
								registro {eventoAberto.metadata.num} — evento
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={irPrev}
									title="Registro anterior"
									className="w-[38px] h-[38px] rounded-full border border-border-subtle bg-paper-100 text-ink-700 hover:border-border-strong hover:text-accent-secondary transition-colors text-lg flex items-center justify-center"
								>
									←
								</button>
								<button
									onClick={irProx}
									title="Próximo registro"
									className="w-[38px] h-[38px] rounded-full border border-border-subtle bg-paper-100 text-ink-700 hover:border-border-strong hover:text-accent-secondary transition-colors text-lg flex items-center justify-center"
								>
									→
								</button>
								<button
									onClick={() => setEventoAbertoId(null)}
									title="Fechar"
									className="w-[38px] h-[38px] rounded-full border border-border-subtle bg-paper-100 text-ink-700 hover:border-border-strong hover:text-accent-secondary transition-colors text-xl flex items-center justify-center"
								>
									×
								</button>
							</div>
						</div>

						{/* Modal Body */}
						<div className="grid grid-cols-1 md:grid-cols-12 gap-12 p-[48px_46px_54px]">
							{/* Card Front badge visual swinging */}
							<div className="md:col-span-4 flex justify-center">
								<div
									style={{
										transformOrigin: "top center",
										animation: "swingB 5.5s ease-in-out infinite",
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
									}}
								>
									{/* Ribbon */}
									<div className="w-[30px] h-[96px] bg-[repeating-linear-gradient(180deg,var(--ink-900)_0_10px,var(--ink-700)_10px_20px)] rounded-[4px_4px_0_0]" />
									{/* Gold clip */}
									<div className="w-[44px] h-[16px] bg-accent-gold border border-gold-600 rounded-[4px] -mt-[2px] shadow-[var(--shadow-sm)] relative z-20" />
									{/* Strap connecting clip to badge slot */}
									<div className="w-[16px] h-[30px] bg-[rgba(250,245,233,0.75)] border border-[var(--border-strong)] -mt-[3px] relative z-10 rounded-[2px] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
										{/* Metal snap button */}
										<div className="w-[6px] h-[6px] rounded-full bg-[var(--ink-500)]" />
									</div>
									{/* Badge */}
									<div className="grain-overlay" style={{
										width: "280px",
										height: "400px",
										marginTop: "-20px",
										background: "var(--paper-50)",
										border: "1.5px solid var(--border-subtle)",
										borderRadius: "var(--radius-md) var(--radius-sm) var(--radius-md) var(--radius-sm)",
										boxShadow: "var(--shadow-lg)",
										overflow: "hidden",
										display: "flex",
										flexDirection: "column",
										position: "relative",
										zIndex: 5,
									}}>
										<div style={{ padding: "16px 20px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
											<div style={{ width: "46px", height: "13px", borderRadius: "var(--radius-full)", background: "var(--paper-200)", border: "1px solid var(--border-subtle)", boxShadow: "inset 0 1px 2px rgba(43,35,26,0.25)" }} />
											<div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "15px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-900)", textAlign: "center", lineHeight: 1.3 }}>
												{eventoAberto.metadata.nome}
											</div>
											<div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-caption)", color: "var(--text-muted)" }}>
												{eventoAberto.metadata.localCurto} · {eventoAberto.metadata.ano}
											</div>
										</div>
										<div
											className="flex-1 flex flex-col justify-center items-center gap-[6px] p-[18px]"
											style={{ background: eventoAberto.metadata.cor }}
										>
											<div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(250,245,233,0.75)" }}>
												credencial
											</div>
											<div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "42px", lineHeight: 1, color: "var(--paper-50)" }}>
												João Gabriel
											</div>
											<div style={{ fontStyle: "italic", fontSize: "19px", color: "rgba(250,245,233,0.9)" }}>
												de Almeida
											</div>
										</div>
										<div
											style={{ background: eventoAberto.metadata.corEscura, padding: "14px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "19px", letterSpacing: "0.24em", textTransform: "uppercase", color: "var(--paper-50)" }}
										>
											{eventoAberto.metadata.papel}
										</div>
									</div>
								</div>
							</div>

							{/* Right: Info and dynamic rendering of details component */}
							<div className="md:col-span-8">
								<div className="flex items-baseline gap-4 flex-wrap mb-3">
									<h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "var(--text-display-2)", color: "var(--ink-900)", margin: 0, lineHeight: 1.05 }}>
										{eventoAberto.metadata.nome}
									</h3>
									<span style={{ fontFamily: "var(--font-display)", fontSize: "30px", color: "var(--terracotta-500)" }}>
										{eventoAberto.metadata.ano}
									</span>
								</div>
								<p style={{ fontSize: "var(--text-body-lg)", lineHeight: "var(--leading-normal)", color: "var(--text-body)", margin: "0 0 26px", maxWidth: "600px", textWrap: "pretty" }}>
									{eventoAberto.metadata.nota}
								</p>
								<div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>
									galeria — fotos &amp; vídeos do evento
								</div>
								{/* Render details slots dynamically! */}
								<eventoAberto.Details />
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Contato Section */}
			<section
				id="contato"
				className="relative max-w-[820px] mx-auto px-10 py-[120px] text-center"
				style={{ scrollMarginTop: "90px" }}
			>
				<img
					src="/assets/eucalyptus.png"
					alt=""
					aria-hidden="true"
					className="absolute left-[6%] top-[90px] w-[105px] mix-blend-multiply -rotate-12 pointer-events-none hidden md:block"
				/>
				<div>
					<div className="font-mono text-text-caption tracking-widest uppercase text-green-700 mb-[14px]">
						( 04 — contato )
					</div>
					<h2 className="font-display font-semibold text-text-display-1 text-text-heading mb-[18px]">
						Diga olá.
					</h2>
					<p className="text-text-body-lg text-text-body mb-11">
						Sem formulário — só uma conversa.
					</p>
					<div className="flex flex-col gap-0 text-left max-w-[520px] mx-auto">
						<a
							href="https://github.com/jdalmeida"
							target="_blank"
							rel="noopener noreferrer"
							className="flex justify-between items-center py-5 px-[6px] border-b-[1.5px] border-border-subtle no-underline text-text-heading font-semibold text-text-h3 hover:text-accent-secondary hover:pl-[14px] transition-all duration-200"
						>
							<span>GitHub</span>
							<span className="font-mono text-text-small text-text-muted">@joaodealmeida ↗</span>
						</a>
						<a
							href="https://linkedin.com/in/joao-de-almeida9"
							target="_blank"
							rel="noopener noreferrer"
							className="flex justify-between items-center py-5 px-[6px] border-b-[1.5px] border-border-subtle no-underline text-text-heading font-semibold text-text-h3 hover:text-accent-secondary hover:pl-[14px] transition-all duration-200"
						>
							<span>LinkedIn</span>
							<span className="font-mono text-text-small text-text-muted">joão gabriel de almeida ↗</span>
						</a>
						<a
							href="mailto:joao@allpines.com.br"
							className="flex justify-between items-center py-5 px-[6px] border-b-[1.5px] border-border-subtle no-underline text-text-heading font-semibold text-text-h3 hover:text-accent-secondary hover:pl-[14px] transition-all duration-200"
						>
							<span>E-mail</span>
							<span className="font-mono text-text-small text-text-muted">joao@allpines.com.br ↗</span>
						</a>
					</div>
				</div>
			</section>

			{/* Signature Collage */}
			<div className="w-full flex justify-center pt-8 pb-24 px-6 border-t-[1.5px] border-border-subtle max-w-[820px] mx-auto">
				<img
					src="/signature_collage.png"
					alt="Signature Collage"
					className="w-full max-w-[620px] h-auto object-contain select-none opacity-90 hover:opacity-100 transition-opacity duration-300"
				/>
			</div>
			</div>
		</div>
	);
}
