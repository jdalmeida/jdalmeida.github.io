import AdminNav from "@/components/admin/nav";
import NoTrack from "@/components/admin/no-track";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <NoTrack />
      {(await isAdmin()) && <AdminNav />}
      {children}
    </div>
  );
}
