import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticles } from "@/lib/articles";
import Home from "../../page";

// Shareable link to one post: the same desk, with the notebook opened on it (see notebook.tsx).
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = (await getArticles()).find((a) => a.slug === slug);
  if (!a) return {};
  return { title: a.title, description: a.excerpt, openGraph: { type: "article", title: a.title, description: a.excerpt, tags: a.tags } };
}

export default async function Article({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  if (!(await getArticles()).some((a) => a.slug === slug)) notFound();
  return <Home />;
}
