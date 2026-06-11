import type { Metadata } from "next";
import { HomeClient } from "@/components/home/HomeClient";
import { getAllPosts } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "João de Almeida | Home",
	description:
		"CTO da Allpines, desenvolvedor fullstack e tech lead focado em soluções sofisticadas e escaláveis.",
};

export default async function Home() {
	const posts = (await getAllPosts()).slice(0, 3);

	return <HomeClient posts={posts} />;
}
