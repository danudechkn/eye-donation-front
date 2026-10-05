import { Sidebar } from "@/components/Sidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-zinc-50/50">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
