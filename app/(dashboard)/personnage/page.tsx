import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface CharacterDef {
  id: string;
  name: string;
  tagline: string;
  asset: string;
}

const CHARACTERS: CharacterDef[] = [
  {
    id: "le-stratege",
    name: "Le Stratège",
    tagline: "Analyse, plan, exécute. Patrimoine maîtrisé.",
    asset: "/character/le-stratege.svg",
  },
  {
    id: "laventuriere",
    name: "L'Aventurière",
    tagline: "Risques calculés, opportunités saisies.",
    asset: "/character/laventuriere.svg",
  },
];

export default async function PersonnagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <Header
        title="Personnage"
        description="Choisis ton avatar et débloque des items via les succès"
      />

      <div className="p-6 space-y-6">
        {/* Bandeau placeholder de validation */}
        <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 shadow-elev-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Placeholder visuel —</span>{" "}
            Ces 2 personnages sont des SVG de validation. Tu les remplaceras
            par tes assets Midjourney/DALL-E dans <code className="text-foreground">public/character/</code>{" "}
            sans toucher au code.
          </p>
        </div>

        {/* Les 2 personnages côte à côte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CHARACTERS.map((char) => (
            <Card
              key={char.id}
              className="overflow-hidden ring-1 ring-foreground/10 shadow-elev-2 transition-transform hover:scale-[1.02]"
            >
              <CardContent className="flex flex-col items-center pt-6 pb-4 px-4">
                {/* Cadre du personnage */}
                <div className="relative w-full max-w-[280px] aspect-[2/3] overflow-hidden rounded-xl bg-gradient-to-b from-card to-background ring-1 ring-foreground/5">
                  {/* Halo or derrière le perso */}
                  <div
                    className="absolute inset-x-8 bottom-8 top-1/4 rounded-full opacity-30 blur-2xl"
                    style={{
                      background:
                        "radial-gradient(circle, hsl(38 92% 50%) 0%, transparent 70%)",
                    }}
                  />
                  <Image
                    src={char.asset}
                    alt={char.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    priority
                    className="relative object-contain"
                  />
                </div>

                {/* Nom + tagline */}
                <h3 className="mt-5 text-xl font-bold gradient-gold-text">{char.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground text-center">
                  {char.tagline}
                </p>

                {/* CTA désactivé (sera activé quand le système est en place) */}
                <button
                  disabled
                  className="mt-4 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
                  title="Sélection à venir"
                >
                  Choisir (à venir)
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer : prochaines étapes */}
        <div className="rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10 shadow-elev-1">
          <h4 className="text-sm font-semibold mb-2">À venir dans la gamification</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• 5 slots d&apos;équipement : tenue · couvre-chef · lunettes · bijou · accessoire main</li>
            <li>• Catalogue d&apos;items débloqués par tes succès (achievements)</li>
            <li>• Persistance du personnage et de l&apos;équipement en DB</li>
            <li>• Affichage du perso dans la sidebar + dashboard</li>
          </ul>
        </div>
      </div>
    </>
  );
}
