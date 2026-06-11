/**
 * Calcul d'âge dynamique à partir d'une date de naissance.
 * Module pur (importable côté client et serveur).
 */

/** Âge en années révolues à une date donnée (par défaut : aujourd'hui). */
export function computeAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Âge effectif d'un utilisateur : dérivé de `dateNaissance` si présente
 * (donc actualisé automatiquement au fil du temps), sinon fallback sur le
 * champ `ageActuel` legacy. Renvoie `null` si aucune des deux infos n'est connue.
 */
export function resolveAge(
  user: { dateNaissance?: Date | null; ageActuel?: number | null },
  now: Date = new Date()
): number | null {
  if (user.dateNaissance) return computeAge(user.dateNaissance, now);
  return user.ageActuel ?? null;
}
