// Names of the notebook's faces (see `faces` in components/ui/notebook.tsx): cover, owner, guestbook, free page, contents,
// two faces per published article (newest first), back cover.
// ponytail: article faces shift when a post is published or unpublished, and stamps stuck on them move along.
export function faceName(face: number | null, titles: string[]) {
  if (face === null) return "não colado";
  const fixed = ["capa", "página do dono", "livro de visitas", "página livre", "sumário"];
  if (face < fixed.length) return fixed[face];
  const i = Math.floor((face - fixed.length) / 2);
  if (i < titles.length) return `${(face - fixed.length) % 2 ? "texto" : "abertura"} de “${titles[i]}”`;
  return i === titles.length && (face - fixed.length) % 2 === 0 ? "contracapa" : `página ${face}`;
}

export const faceCount = (articles: number) => 6 + 2 * articles;
