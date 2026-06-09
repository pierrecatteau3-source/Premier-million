/**
 * Mapping symbole crypto (tel que renvoyé par BitPanda : BTC, ETH, …) → id CoinGecko.
 *
 * Sert à brancher le pricing live (`pricingMode: "live_crypto"`, `ticker` = id CoinGecko)
 * sur les actifs créés automatiquement par l'import BitPanda. Les actifs en mode live
 * sont ensuite valorisés par le cron snapshot et le hook usePrices, qui attendent un id
 * CoinGecko comme ticker.
 *
 * Si un symbole n'est pas dans cette table, l'actif est créé en mode "manual" : la
 * transaction (quantité + cost-basis) est tout de même importée, seul le prix live
 * manque — l'utilisateur peut le brancher plus tard. On reste donc non bloquant.
 *
 * Liste volontairement curatée (les symboles CoinGecko se chevauchent — résoudre à
 * l'aveugle via /coins/list est risqué). Couvre les principaux actifs BitPanda.
 */
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  XRP: "ripple",
  SOL: "solana",
  ADA: "cardano",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  POL: "polygon-ecosystem-token",
  LTC: "litecoin",
  TRX: "tron",
  SHIB: "shiba-inu",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  ATOM: "cosmos",
  XLM: "stellar",
  BCH: "bitcoin-cash",
  UNI: "uniswap",
  ALGO: "algorand",
  ICP: "internet-computer",
  FIL: "filecoin",
  ETC: "ethereum-classic",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  VET: "vechain",
  HBAR: "hedera-hashgraph",
  EOS: "eos",
  AAVE: "aave",
  GRT: "the-graph",
  SAND: "the-sandbox",
  MANA: "decentraland",
  XTZ: "tezos",
  EGLD: "elrond-erd-2",
  THETA: "theta-token",
  FTM: "fantom",
  CHZ: "chiliz",
  ENJ: "enjincoin",
  ZIL: "zilliqa",
  BAT: "basic-attention-token",
  CRV: "curve-dao-token",
  MKR: "maker",
  COMP: "compound-governance-token",
  SNX: "havven",
  SUSHI: "sushi",
  YFI: "yearn-finance",
  "1INCH": "1inch",
  DASH: "dash",
  ZEC: "zcash",
  NEO: "neo",
  WAVES: "waves",
  KSM: "kusama",
  FLOW: "flow",
  AXS: "axie-infinity",
  GALA: "gala",
  LDO: "lido-dao",
  IMX: "immutable-x",
  INJ: "injective-protocol",
  RNDR: "render-token",
  SEI: "sei-network",
  SUI: "sui",
  TIA: "celestia",
  PEPE: "pepe",
};

/** Renvoie l'id CoinGecko correspondant à un symbole BitPanda, ou null si inconnu. */
export function coingeckoIdForSymbol(symbol: string): string | null {
  if (!symbol) return null;
  return SYMBOL_TO_COINGECKO_ID[symbol.trim().toUpperCase()] ?? null;
}
