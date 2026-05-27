import "dotenv/config";
import { PrismaClient, Pilier } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Utilisateur de test
  const user = await prisma.user.upsert({
    where: { email: "demo@premier-million.fr" },
    update: {},
    create: {
      email: "demo@premier-million.fr",
      name: "Demo",
      objectif: 1_000_000,
      ageCible: 40,
      epargneMensuelle: 2000,
      allocationCible: { pea: 40, crypto: 20, immo: 30, autre: 10 },
    },
  });

  console.log(`✅ User: ${user.email}`);

  // Assets de démonstration
  const assets = [
    { name: "CW8 (MSCI World ETF)", pilier: Pilier.PEA, type: "ETF" },
    { name: "Bitcoin", pilier: Pilier.CRYPTO, type: "Token" },
    { name: "Appartement Paris 11e", pilier: Pilier.IMMO, type: "Bien propre" },
    { name: "Livret A", pilier: Pilier.AUTRE, type: "Épargne" },
  ];

  for (const assetData of assets) {
    const asset = await prisma.asset.upsert({
      where: { id: `seed-${assetData.pilier.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-${assetData.pilier.toLowerCase()}`,
        ...assetData,
        userId: user.id,
        snapshots: {
          create: {
            value: getSeedValue(assetData.pilier),
            date: new Date(),
          },
        },
      },
    });
    console.log(`✅ Asset: ${asset.name}`);
  }

  const total = await prisma.snapshot.aggregate({
    _sum: { value: true },
    where: { asset: { userId: user.id } },
  });

  console.log(`\n💰 Patrimoine total seed: ${total._sum.value?.toLocaleString("fr-FR")} €`);

  // Succès débloqués pour le compte démo (notified=true → pas de toast au 1er login)
  const demoAchievements = [
    "premiers_pas",    // a des actifs
    "diversifie",      // 4 piliers présents
    "premier_cap",     // > 10 000 €
    "cap_50k",         // > 50 000 €
    "cap_100k",        // > 100 000 €
    "cap_250k",        // > 250 000 € (245k snapshot + pas de matelas = légèrement en-dessous, mais démo)
    "epargne_active",  // epargneMensuelle = 2000
  ];

  for (const achievementId of demoAchievements) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: user.id, achievementId } },
      update: {},
      create: { userId: user.id, achievementId, notified: true },
    });
    console.log(`🏆 Achievement: ${achievementId}`);
  }

  console.log("🎉 Seed terminé.");
}

function getSeedValue(pilier: Pilier): number {
  const values: Record<Pilier, number> = {
    PEA: 45000,
    CRYPTO: 12000,
    IMMO: 180000,
    AUTRE: 8000,
    LIQUIDITE: 0,
  };
  return values[pilier];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
