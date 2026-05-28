import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { AchievementChecker } from "@/components/achievements/AchievementChecker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop (md+) */}
      <AppSidebar />

      {/* Contenu principal */}
      <main className="relative z-[1] flex-1 overflow-y-auto pb-24 md:pb-12">
        <div className="mx-auto max-w-[1340px] px-5 pt-8 md:px-12 md:pt-9">
          <Topbar />
          {children}
        </div>
      </main>

      {/* Navigation mobile (< md) */}
      <BottomNav />

      {/* Vérifie les succès en arrière-plan et affiche le toast si nouveaux */}
      <AchievementChecker />
    </div>
  );
}
