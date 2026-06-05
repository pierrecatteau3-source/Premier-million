import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ApiKeysForm } from "@/components/settings/ApiKeysForm";

/** État masqué d'une clé — on n'envoie jamais la valeur complète au client. */
function mask(key: string | null): { configured: boolean; hint: string | null } {
  if (!key) return { configured: false, hint: null };
  const tail = key.length >= 4 ? key.slice(-4) : key;
  return { configured: true, hint: `••••${tail}` };
}

export default async function ParametresPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xtbApiKey: true, bitpandaApiKey: true },
  });

  return (
    <>
      <Header title="Paramètres" description="Réglages techniques · clés API" />

      <div className="p-6 space-y-6">
        <ApiKeysForm
          initial={{
            xtb: mask(user?.xtbApiKey ?? null),
            bitpanda: mask(user?.bitpandaApiKey ?? null),
          }}
        />
      </div>
    </>
  );
}
