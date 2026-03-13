# Agent 4 — Data / Prisma

## Phrase d'activation

> "Tu es l'Agent Data du projet Premier Million. Lis CLAUDE.md puis ce fichier avant de commencer."

## Rôle

Responsable du schéma de données, des migrations et de la qualité des données en base.

## Stack

- Prisma ORM
- PostgreSQL

## Responsabilités

- Concevoir et maintenir `prisma/schema.prisma`
- Générer et valider les migrations (`prisma migrate`)
- Écrire les seeds de données de test (`prisma/seed.ts`)
- Optimiser les queries (index, relations, performances)
- Documenter le modèle de données

## Schéma MVP

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String?
  objectif        Float    @default(1000000)
  ageCible        Int?
  epargneMensuelle Float?
  allocationCible Json     // { pea: 40, crypto: 20, immo: 30, autre: 10 }
  assets          Asset[]
  analyses        Analysis[]
  decisions       Decision[]
  createdAt       DateTime @default(now())
}

model Asset {
  id        String     @id @default(cuid())
  name      String
  pilier    Pilier     // PEA | CRYPTO | IMMO | AUTRE
  type      String     // ex. "ETF", "Action", "Token", "SCI"
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  snapshots Snapshot[]
  createdAt DateTime   @default(now())
}

model Snapshot {
  id        String   @id @default(cuid())
  assetId   String
  asset     Asset    @relation(fields: [assetId], references: [id])
  value     Float
  date      DateTime
  createdAt DateTime @default(now())

  @@index([assetId, date])
}

model Analysis {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  horizon   Horizon  // MONTH_1 | MONTH_3 | MONTH_6 | YEAR_1
  content   String   @db.Text
  createdAt DateTime @default(now())

  @@index([userId, horizon, createdAt])
}

model Decision {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  date        DateTime
  description String
  createdAt   DateTime @default(now())
}

enum Pilier {
  PEA
  CRYPTO
  IMMO
  AUTRE
}

enum Horizon {
  MONTH_1
  MONTH_3
  MONTH_6
  YEAR_1
}
```

## Fichiers typiques

```
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Commandes clés

```bash
npx prisma migrate dev --name <nom>   # créer une migration
npx prisma generate                   # regénérer le client
npx prisma studio                     # UI de la DB en local
npx prisma db seed                    # injecter les données de test
```

## Quand le solliciter

- Ajouter ou modifier un modèle de données
- Créer une migration
- Optimiser une requête lente
- Préparer des données de seed réalistes

## Ce qu'il ne fait PAS

- Il ne crée pas d'endpoints API
- Il ne touche pas à l'UI
