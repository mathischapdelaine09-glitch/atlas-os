export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  label: string;
  account: "CHECKING" | "SAVINGS"; // Compte courant ou Livret
  date: string;
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  account: "CHECKING" | "SAVINGS";
};

type FinanceData = {
  transactions: Transaction[];
  goals: Goal[];
};

const globalForFinance = globalThis as unknown as {
  financeData: FinanceData | undefined;
};

export const financeStore: FinanceData = globalForFinance.financeData ?? {
  transactions: [
    { id: "1", type: "INCOME", amount: 2000, label: "Salaire", account: "CHECKING", date: "2026-07-01" },
    { id: "2", type: "EXPENSE", amount: 45, label: "Courses", account: "CHECKING", date: "2026-07-05" },
    { id: "3", type: "INCOME", amount: 500, label: "Virement épargne", account: "SAVINGS", date: "2026-07-10" },
  ],
  goals: [
    { id: "1", title: "Achat Voiture 🚗", targetAmount: 3000, account: "SAVINGS" },
    { id: "2", title: "Matelas de sécurité 🛡️", targetAmount: 1000, account: "CHECKING" },
  ],
};

if (process.env.NODE_ENV !== "production") {
  globalForFinance.financeData = financeStore;
}