export interface Transaction {
  id: string;
  assetId: string;
  userId: string;
  date: string;
  quantite: number;
  prixEntreeEur: number;
  montantInvesti: number;
  source: string;
  note: string | null;
  createdAt: string;
}

/** Transaction enrichie avec les données de l'actif — utilisée par l'onglet Historique */
export interface TransactionWithAsset extends Transaction {
  asset: {
    id: string;
    name: string;
    pilier: string;
    type: string;
  };
}

export interface CreateTransactionInput {
  assetId: string;
  date: string;
  quantite: number;
  prixEntreeEur: number;
  source?: "manuel" | "virement_auto";
  note?: string;
}
