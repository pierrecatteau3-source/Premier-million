import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Récupère la session et retourne l'userId ou une réponse 401.
 * Usage dans les API routes :
 *
 *   const session = await requireSession();
 *   if (session instanceof NextResponse) return session;
 *   const { userId } = session;
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  return { userId: session.user.id };
}
