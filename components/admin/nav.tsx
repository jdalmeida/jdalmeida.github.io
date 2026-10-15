"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const LINKS = [["/admin", "Analytics"], ["/admin/links", "Links"], ["/admin/selos", "Selos"], ["/admin/ff", "Family & Friends"], ["/admin/artigos", "Artigos"]] as const;

export default function AdminNav() {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" || path.startsWith("/admin/visitante") : path.startsWith(href));
  return (
    <nav className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur" aria-label="Admin">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm sm:px-8">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={`whitespace-nowrap rounded-md px-3 py-1.5 ${active(href) ? "bg-neutral-800 text-neutral-50" : "text-neutral-400 hover:text-neutral-200"}`}>{label}</Link>
        ))}
        <form action={logout} className="ml-auto"><button className="whitespace-nowrap rounded-md px-3 py-1.5 text-neutral-400 hover:text-neutral-200">Sair</button></form>
      </div>
    </nav>
  );
}
