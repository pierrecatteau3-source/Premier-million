import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getDashboardData } from "@/lib/services/dashboard.service";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const data = await getDashboardData(session.userId);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
