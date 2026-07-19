import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPostBySlug } from "@/lib/markdown";

export const dynamic = "force-dynamic";

interface PageProps {
	params: {
		slug: string;
	};
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const post = await getPostBySlug(params.slug);

	if (!post) {
		return {
			title: "Post não encontrado",
		};
	}

	return {
		title: post.title,
		description: post.excerpt,
		openGraph: {
			title: post.title,
			description: post.excerpt,
			type: "article",
			publishedTime: post.date,
			authors: [post.author],
			tags: post.tags,
		},
		twitter: {
			card: "summary_large_image",
			title: post.title,
			description: post.excerpt,
		},
	};
}

export default async function BlogPostPage({ params }: PageProps) {
	const post = await getPostBySlug(params.slug);

	if (!post) {
		notFound();
	}

	return (
		<div className="font-serif text-text-body py-12 px-6">
			<div className="max-w-[760px] mx-auto">
				{/* Back link */}
				<div className="mb-8">
					<Link
						href="/blog"
						className="inline-flex items-center text-accent-secondary hover:text-terracotta-700 font-mono text-text-small transition-colors group"
					>
						<ArrowLeft
							size={16}
							className="mr-2 group-hover:-translate-x-1 transition-transform duration-200"
						/>
						Voltar para o blog
					</Link>
				</div>

				{/* Article */}
				<article className="prose prose-lg max-w-none">
					{/* Header */}
					<header className="not-prose mb-10">
						{/* Tags */}
						{post.tags.length > 0 && (
							<div className="flex flex-wrap gap-2 mb-6">
								{post.tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center px-3 py-1 font-mono text-text-caption text-green-900 bg-green-100 border border-green-300 rounded-[999px]"
									>
										<Tag size={12} className="mr-1" />
										{tag}
									</span>
								))}
							</div>
						)}

						{/* Title */}
						<h1 className="font-display font-semibold text-[2.75rem] text-text-heading mb-6 leading-tight">
							{post.title}
						</h1>

						{/* Meta */}
						<div className="flex flex-wrap items-center gap-6 text-text-muted border-b border-border-subtle pb-6 font-mono text-text-small">
							<div className="flex items-center">
								<User size={16} className="mr-2" />
								<span>{post.author}</span>
							</div>

							<div className="flex items-center">
								<Calendar size={16} className="mr-2" />
								<time>
									{format(new Date(post.date), "dd 'de' MMMM 'de' yyyy", {
										locale: ptBR,
									})}
								</time>
							</div>

							<div className="flex items-center">
								<Clock size={16} className="mr-2" />
								<span>{post.readTime} min de leitura</span>
							</div>
						</div>
					</header>

					{/* Content */}
					<div className="prose prose-lg max-w-none prose-a:text-accent-secondary hover:prose-a:text-terracotta-700 prose-blockquote:border-l-[3px] prose-blockquote:border-accent-primary prose-blockquote:bg-green-100/30 prose-blockquote:p-4 prose-blockquote:rounded-r-[var(--radius-md)] prose-code:font-mono prose-code:bg-paper-200 prose-code:text-ink-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-ink-900 prose-pre:text-paper-100 prose-pre:rounded-[var(--radius-md)] prose-pre:p-5">
						<ReactMarkdown remarkPlugins={[remarkGfm]}>
							{post.content}
						</ReactMarkdown>
					</div>
				</article>

				{/* Footer/CTA */}
				<footer className="mt-12 pt-8 border-t border-border-subtle">
					<div className="grain-overlay bg-surface-card border border-border-subtle rounded-[var(--radius-md)_var(--radius-sm)_var(--radius-md)_var(--radius-sm)] shadow-[var(--shadow-sm)] p-8">
						<h3 className="font-serif font-bold text-text-h3 text-text-heading mb-2">
							Gostou do artigo?
						</h3>
						<p className="text-text-body mb-6 leading-relaxed">
							Compartilhe suas opiniões e dúvidas. Vamos conversar sobre tecnologia!
						</p>
						<div className="flex flex-col sm:flex-row gap-4">
							<Link href="/#contato" className="btn-primary">
								Entrar em contato
							</Link>
							<Link href="/blog" className="btn-secondary">
								Ver mais artigos
							</Link>
						</div>
					</div>
				</footer>
			</div>
		</div>
	);
}
