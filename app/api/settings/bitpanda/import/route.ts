export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { BitpandaError, importBitpandaTrades } from "@/lib/services/bitpanda.service";

/**
 * POST /api/settings/bitpanda/import
 * Importe l'activité du compte BitPanda (achats, plans d'épargne inclus) dans le
 * portefeuille et l'historique. Déclenché manuellement depuis /parametres.
 * Idempotent : un trade déjà importé est ignoré (dédoublonnage sur externalId).
 */
export async function POST() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const result = await importBitpandaTrades(session.userId);

    // Les actifs et transactions importés alimentent ces écrans.
    revalidatePath("/portefeuille");
    revalidatePath("/historique");
    revalidatePath("/dashboard");

    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof BitpandaError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/settings/bitpanda/import]", err);
    return NextResponse.json(
      { error: "Échec de l'import BitPanda. Réessaie plus tard." },
      { status: 500 }
    );
  }
}
