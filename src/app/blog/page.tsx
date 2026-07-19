import Link from "next/link";
import { getAllPosts } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Blog",
	description:
		"Artigos sobre desenvolvimento de software, liderança técnica e inovação tecnológica.",
};

export default async function BlogPage() {
	const posts = await getAllPosts();

	return (
		<div className="min-h-screen font-serif text-text-body py-12 px-6">
			<div className="max-w-[760px] mx-auto">
				{/* Title */}
				<h1 className="font-display font-semibold text-text-display-2 text-text-heading mb-8">
					Artigos
				</h1>

				{/* Description */}
				<p className="text-text-body-lg leading-relaxed text-text-muted mb-12">
					Reflexões e notas sobre engenharia de software, inteligência artificial aplicada e o ofício de construir coisas digitais.
				</p>

				{/* Posts List */}
				<div className="flex flex-col">
					{posts.map((post) => (
						<Link
							key={post.slug}
							href={`/blog/${post.slug}`}
							className="block py-8 border-b-[1.5px] border-border-subtle group hover:no-underline"
						>
							<div className="flex justify-between font-mono text-text-caption text-text-muted mb-2">
								<span>
									{new Date(post.date).toLocaleDateString("pt-BR", {
										day: "2-digit",
										month: "short",
										year: "numeric",
									}).replace(" de ", " ")}
								</span>
								<span>{post.readTime} min de leitura</span>
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
			</div>
		</div>
	);
}
