import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar desktop (md+) */}
      <Sidebar />

      {/* Contenu principal */}
      <main className="bg-background flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Navigation mobile (< md) */}
      <BottomNav />

      {/* Vérifie les succès en arrière-plan et affiche le toast si nouveaux */}
      <AchievementChecker />
    </div>
  );
}
