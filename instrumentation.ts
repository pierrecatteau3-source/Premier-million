/**
 * Hook d'instrumentation Next — exécuté une fois au démarrage du serveur.
 *
 * Railway (comme la plupart des hébergeurs datacenter) ne route pas correctement
 * l'IPv6 vers certains hôtes : Yahoo Finance publie des enregistrements AAAA mais
 * la connexion IPv6 échoue (→ "TypeError: fetch failed"), ce qui cassait les prix
 * d'actions, les mini-courbes de performance et les snapshots côté serveur.
 *
 * On force la résolution IPv4 d'abord pour TOUS les fetch serveur. CoinGecko
 * (crypto) n'était pas affecté ; ce réglage ne le dégrade pas.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
