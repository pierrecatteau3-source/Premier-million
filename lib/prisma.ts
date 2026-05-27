import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Schéma version — bumper quand prisma generate est relancé après une migration
// afin de forcer la recréation du client singleton en dev (évite le cache stale).
const SCHEMA_VERSION = "20260319200948";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// En dev, recréer le client si le schéma a changé depuis la dernière instanciation.
const schemaChanged =
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION;

export const prisma =
  !globalForPrisma.prisma || schemaChanged
    ? createPrismaClient()
    : globalForPrisma.prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
}
