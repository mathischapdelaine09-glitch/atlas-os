export type FinanceTransactionType =
  | "INCOME"
  | "EXPENSE";

export type FinanceAccount =
  | "CHECKING"
  | "SAVINGS";

export type FinanceTransaction = {
  id: string;
  user_id: string;
  type: FinanceTransactionType;
  amount: number;
  label: string;
  account: FinanceAccount;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

export type FinanceGoal = {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  account: FinanceAccount;
  created_at: string;
  updated_at: string;
};

export type CreateFinanceTransactionInput = {
  type: FinanceTransactionType;
  amount: number;
  label: string;
  account: FinanceAccount;
  transaction_date?: string;
};

export type CreateFinanceGoalInput = {
  title: string;
  target_amount: number;
  account: FinanceAccount;
};

export type UpdateFinanceTransactionInput =
  Partial<CreateFinanceTransactionInput>;

export type UpdateFinanceGoalInput =
  Partial<CreateFinanceGoalInput>;