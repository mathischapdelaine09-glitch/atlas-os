"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  label: string;
  account: "CHECKING" | "SAVINGS";
  date: string;
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  account: "CHECKING" | "SAVINGS";
};

type FinanceStore = {
  transactions: Transaction[];
  goals: Goal[];

  addTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;

  addGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
};

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      transactions: [
        {
          id: "1",
          type: "INCOME",
          amount: 2000,
          label: "Salaire",
          account: "CHECKING",
          date: "2026-07-01",
        },
      ],

      goals: [
        {
          id: "1",
          title: "Voiture",
          targetAmount: 3000,
          account: "SAVINGS",
        },
      ],

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [...state.transactions, transaction],
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      addGoal: (goal) =>
        set((state) => ({
          goals: [...state.goals, goal],
        })),

      removeGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
    }),

    {
      name: "finance-storage",
    }
  )
);