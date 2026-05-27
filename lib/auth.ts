import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schéma de validation des credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },

      async authorize(credentials) {
        // [DEBUG TEMPORAIRE — à retirer une fois login OK]
        console.log("[auth-debug] === LOGIN ATTEMPT ===");

        // Validation Zod
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          console.log("[auth-debug] Zod validation FAIL:", parsed.error.format());
          return null;
        }

        const { email, password } = parsed.data;

        // MVP solo : validation contre les variables d'environnement
        const soloEmail = process.env.SOLO_EMAIL;
        const soloHash = process.env.SOLO_PASSWORD_HASH;

        console.log("[auth-debug] SOLO_EMAIL set:", !!soloEmail, "length:", soloEmail?.length ?? 0);
        console.log("[auth-debug] SOLO_PASSWORD_HASH set:", !!soloHash, "length:", soloHash?.length ?? 0);
        console.log("[auth-debug] SOLO_PASSWORD_HASH starts with $2b$:", soloHash?.startsWith("$2b$"));
        console.log("[auth-debug] Submitted email length:", email.length, "match exact:", email === soloEmail);
        console.log("[auth-debug] Submitted password length:", password.length);

        if (!soloEmail || !soloHash) {
          console.error("[auth] SOLO_EMAIL ou SOLO_PASSWORD_HASH manquant dans .env");
          return null;
        }

        if (email !== soloEmail) {
          console.log("[auth-debug] FAIL: email mismatch");
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, soloHash);
        console.log("[auth-debug] bcrypt.compare result:", passwordMatch);
        if (!passwordMatch) {
          console.log("[auth-debug] FAIL: bcrypt mismatch");
          return null;
        }
        console.log("[auth-debug] === AUTH SUCCESS, going to DB upsert ===");

        // Récupération ou création de l'utilisateur en DB
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: "Admin",
            allocationCible: { pea: 40, crypto: 20, immo: 30, autre: 10 },
          },
          select: { id: true, email: true, name: true },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    // Injecte l'id DB dans le token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Expose l'id DB dans la session côté client
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
