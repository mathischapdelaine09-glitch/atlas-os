import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type {
  FinanceAccount,
  FinanceGoal,
  FinanceTransaction,
  FinanceTransactionType,
} from "@/types/finance";

// =========================================================
// OUTILS
// =========================================================

function isFinanceAccount(
  value: FormDataEntryValue | null
): value is FinanceAccount {
  return value === "CHECKING" || value === "SAVINGS";
}

function isFinanceTransactionType(
  value: FormDataEntryValue | null
): value is FinanceTransactionType {
  return value === "INCOME" || value === "EXPENSE";
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return {
    supabase,
    user,
  };
}

// =========================================================
// SERVER ACTIONS
// =========================================================

export async function addTransactionAction(
  formData: FormData
) {
  "use server";

  const { supabase, user } =
    await getAuthenticatedUser();

  const rawLabel = formData.get("label");
  const rawAmount = formData.get("amount");
  const rawType = formData.get("type");
  const rawAccount = formData.get("account");
  const rawDate = formData.get("transactionDate");

  const label =
    typeof rawLabel === "string"
      ? rawLabel.trim()
      : "";

  const amount =
    typeof rawAmount === "string"
      ? Number.parseFloat(rawAmount)
      : Number.NaN;

  const transactionDate =
    typeof rawDate === "string" &&
    rawDate.trim() !== ""
      ? rawDate
      : new Date().toISOString().split("T")[0];

  if (!label) {
    throw new Error(
      "Le libellé de la transaction est obligatoire."
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Le montant doit être supérieur à zéro."
    );
  }

  if (!isFinanceTransactionType(rawType)) {
    throw new Error(
      "Le type de transaction est invalide."
    );
  }

  if (!isFinanceAccount(rawAccount)) {
    throw new Error(
      "Le compte sélectionné est invalide."
    );
  }

  const { error } = await supabase
    .from("finance_transactions")
    .insert({
      user_id: user.id,
      label,
      amount,
      type: rawType,
      account: rawAccount,
      transaction_date: transactionDate,
    });

  if (error) {
    throw new Error(
      `Impossible d’ajouter la transaction : ${error.message}`
    );
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function addGoalAction(
  formData: FormData
) {
  "use server";

  const { supabase, user } =
    await getAuthenticatedUser();

  const rawTitle = formData.get("title");
  const rawTargetAmount =
    formData.get("targetAmount");
  const rawAccount = formData.get("account");

  const title =
    typeof rawTitle === "string"
      ? rawTitle.trim()
      : "";

  const targetAmount =
    typeof rawTargetAmount === "string"
      ? Number.parseFloat(rawTargetAmount)
      : Number.NaN;

  if (!title) {
    throw new Error(
      "Le titre de l’objectif est obligatoire."
    );
  }

  if (
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0
  ) {
    throw new Error(
      "Le montant cible doit être supérieur à zéro."
    );
  }

  if (!isFinanceAccount(rawAccount)) {
    throw new Error(
      "Le compte sélectionné est invalide."
    );
  }

  const { error } = await supabase
    .from("finance_goals")
    .insert({
      user_id: user.id,
      title,
      target_amount: targetAmount,
      account: rawAccount,
    });

  if (error) {
    throw new Error(
      `Impossible d’ajouter l’objectif : ${error.message}`
    );
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deleteTransactionAction(
  formData: FormData
) {
  "use server";

  const { supabase, user } =
    await getAuthenticatedUser();

  const rawId = formData.get("id");

  const id =
    typeof rawId === "string" ? rawId : "";

  if (!id) {
    throw new Error(
      "Identifiant de transaction manquant."
    );
  }

  const { error } = await supabase
    .from("finance_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(
      `Impossible de supprimer la transaction : ${error.message}`
    );
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deleteGoalAction(
  formData: FormData
) {
  "use server";

  const { supabase, user } =
    await getAuthenticatedUser();

  const rawId = formData.get("id");

  const id =
    typeof rawId === "string" ? rawId : "";

  if (!id) {
    throw new Error(
      "Identifiant d’objectif manquant."
    );
  }

  const { error } = await supabase
    .from("finance_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(
      `Impossible de supprimer l’objectif : ${error.message}`
    );
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

// =========================================================
// PAGE
// =========================================================

export default async function FinancePage() {
  const { supabase, user } =
    await getAuthenticatedUser();

  const [
    transactionsResult,
    goalsResult,
  ] = await Promise.all([
    supabase
      .from("finance_transactions")
      .select(`
        id,
        user_id,
        type,
        amount,
        label,
        account,
        transaction_date,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("transaction_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("finance_goals")
      .select(`
        id,
        user_id,
        title,
        target_amount,
        account,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: true,
      }),
  ]);

  if (transactionsResult.error) {
    throw new Error(
      `Impossible de récupérer les transactions : ${transactionsResult.error.message}`
    );
  }

  if (goalsResult.error) {
    throw new Error(
      `Impossible de récupérer les objectifs : ${goalsResult.error.message}`
    );
  }

  /*
   * PostgreSQL peut retourner les colonnes numeric
   * sous forme de nombres ou de chaînes selon le client.
   * On force donc amount et target_amount en nombres.
   */
  const transactions: FinanceTransaction[] =
    (transactionsResult.data ?? []).map(
      (transaction) => ({
        ...transaction,
        amount: Number(transaction.amount),
      })
    ) as FinanceTransaction[];

  const goals: FinanceGoal[] =
    (goalsResult.data ?? []).map((goal) => ({
      ...goal,
      target_amount: Number(
        goal.target_amount
      ),
    })) as FinanceGoal[];

  const checkingBalance = transactions
    .filter(
      (transaction) =>
        transaction.account === "CHECKING"
    )
    .reduce(
      (total, transaction) =>
        transaction.type === "INCOME"
          ? total + transaction.amount
          : total - transaction.amount,
      0
    );

  const savingsBalance = transactions
    .filter(
      (transaction) =>
        transaction.account === "SAVINGS"
    )
    .reduce(
      (total, transaction) =>
        transaction.type === "INCOME"
          ? total + transaction.amount
          : total - transaction.amount,
      0
    );

  const totalBalance =
    checkingBalance + savingsBalance;

  const incomeTotal = transactions
    .filter(
      (transaction) =>
        transaction.type === "INCOME"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const expenseTotal = transactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-white md:space-y-8">
      {/* EN-TÊTE */}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
          AtlasOS Finance
        </p>

        <h1 className="break-words text-3xl font-bold sm:text-4xl">
          Gestion financière
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Suis tes comptes, tes transactions et
          tes objectifs d’épargne.
        </p>
      </div>

      {/* SOLDES */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 sm:p-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Solde total</span>
            <span>💰</span>
          </div>

          <p
            className={`mt-3 break-words text-2xl font-extrabold sm:text-3xl ${
              totalBalance >= 0
                ? "text-white"
                : "text-rose-400"
            }`}
          >
            {formatCurrency(totalBalance)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Tous les comptes réunis
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 sm:p-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Compte courant</span>

            <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-semibold text-indigo-300">
              Principal
            </span>
          </div>

          <p
            className={`mt-3 break-words text-2xl font-extrabold sm:text-3xl ${
              checkingBalance >= 0
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            {formatCurrency(checkingBalance)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            💳 Compte courant
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 sm:p-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Épargne</span>

            <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
              Livret
            </span>
          </div>

          <p
            className={`mt-3 break-words text-2xl font-extrabold sm:text-3xl ${
              savingsBalance >= 0
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {formatCurrency(savingsBalance)}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            🐖 Livret A
          </p>
        </div>
      </div>

      {/* RÉSUMÉ */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Revenus enregistrés
          </p>

          <p className="mt-2 break-words text-xl font-bold text-emerald-400 sm:text-2xl">
            +{formatCurrency(incomeTotal)}
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
            Dépenses enregistrées
          </p>

          <p className="mt-2 break-words text-xl font-bold text-rose-400 sm:text-2xl">
            -{formatCurrency(expenseTotal)}
          </p>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* AJOUTER UNE TRANSACTION */}

        <section className="h-fit min-w-0 space-y-4 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-bold">
              Ajouter un mouvement
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Ajoute un revenu ou une dépense.
            </p>
          </div>

          <form
            action={addTransactionAction}
            className="space-y-4 text-sm"
          >
            <div>
              <label
                htmlFor="transaction-label"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Libellé
              </label>

              <input
                id="transaction-label"
                type="text"
                name="label"
                required
                maxLength={100}
                placeholder="Salaire, courses..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-amount"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Montant
              </label>

              <input
                id="transaction-amount"
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
                placeholder="100,00"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-date"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Date
              </label>

              <input
                id="transaction-date"
                type="date"
                name="transactionDate"
                defaultValue={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="transaction-type"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Type
                </label>

                <select
                  id="transaction-type"
                  name="type"
                  defaultValue="EXPENSE"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition focus:border-indigo-500"
                >
                  <option value="INCOME">
                    Revenu
                  </option>

                  <option value="EXPENSE">
                    Dépense
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="transaction-account"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Compte
                </label>

                <select
                  id="transaction-account"
                  name="account"
                  defaultValue="CHECKING"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition focus:border-indigo-500"
                >
                  <option value="CHECKING">
                    Courant
                  </option>

                  <option value="SAVINGS">
                    Livret
                  </option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="min-h-11 w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500"
            >
              Enregistrer
            </button>
          </form>
        </section>

        {/* OBJECTIFS */}

        <section className="h-fit min-w-0 space-y-5 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-bold">
              Objectifs
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Prépare tes prochains achats et
              projets.
            </p>
          </div>

          <form
            action={addGoalAction}
            className="space-y-3 text-sm"
          >
            <div>
              <label
                htmlFor="goal-title"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Nom de l’objectif
              </label>

              <input
                id="goal-title"
                type="text"
                name="title"
                required
                maxLength={100}
                placeholder="Voiture, voyage..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="goal-amount"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Cible
                </label>

                <input
                  id="goal-amount"
                  type="number"
                  name="targetAmount"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="3000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="goal-account"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Compte
                </label>

                <select
                  id="goal-account"
                  name="account"
                  defaultValue="SAVINGS"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-white outline-none transition focus:border-amber-500"
                >
                  <option value="SAVINGS">
                    Livret
                  </option>

                  <option value="CHECKING">
                    Courant
                  </option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="min-h-11 w-full cursor-pointer rounded-xl bg-amber-600 px-4 py-2.5 font-semibold text-white transition hover:bg-amber-500"
            >
              Ajouter l’objectif
            </button>
          </form>

          <div className="space-y-3 border-t border-slate-700/60 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Objectifs en cours
            </h3>

            {goals.length > 0 ? (
              goals.map((goal) => {
                const currentBalance =
                  goal.account === "SAVINGS"
                    ? savingsBalance
                    : checkingBalance;

                const rawPercent =
                  (currentBalance /
                    goal.target_amount) *
                  100;

                const percent = Math.min(
                  Math.max(
                    Math.round(rawPercent),
                    0
                  ),
                  100
                );

                return (
                  <div
                    key={goal.id}
                    className="space-y-3 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {goal.title}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          {goal.account ===
                          "SAVINGS"
                            ? "🐖 Livret A"
                            : "💳 Compte courant"}
                        </p>
                      </div>

                      <form
                        action={deleteGoalAction}
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={goal.id}
                        />

                        <button
                          type="submit"
                          aria-label={`Supprimer l’objectif ${goal.title}`}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </form>
                    </div>

                    <div className="flex flex-col gap-1 text-[11px] text-slate-400 sm:flex-row sm:justify-between">
                      <span>
                        {formatCurrency(
                          currentBalance
                        )}{" "}
                        /{" "}
                        {formatCurrency(
                          goal.target_amount
                        )}
                      </span>

                      <span className="font-semibold text-amber-400">
                        {percent} %
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-xs text-slate-500">
                Aucun objectif pour le moment.
              </p>
            )}
          </div>
        </section>

        {/* TRANSACTIONS */}

        <section className="min-w-0 space-y-5 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-bold">
              Historique
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {transactions.length} transaction
              {transactions.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="space-y-2 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-700/40 bg-slate-900/50 p-3 text-xs sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-semibold text-white">
                      {transaction.label}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      {transaction.account ===
                      "CHECKING"
                        ? "💳 Courant"
                        : "🐖 Livret"}{" "}
                      •{" "}
                      {formatDate(
                        transaction.transaction_date
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <span
                      className={`max-w-[9rem] break-words text-right font-bold sm:max-w-none ${
                        transaction.type ===
                        "INCOME"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {transaction.type ===
                      "INCOME"
                        ? "+"
                        : "-"}
                      {formatCurrency(
                        transaction.amount
                      )}
                    </span>

                    <form
                      action={
                        deleteTransactionAction
                      }
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={transaction.id}
                      />

                      <button
                        type="submit"
                        aria-label={`Supprimer la transaction ${transaction.label}`}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-xs text-slate-500">
                Aucune transaction enregistrée.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// =========================================================
// FORMATAGE
// =========================================================

function formatCurrency(value: number) {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}