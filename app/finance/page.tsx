import { revalidatePath } from "next/cache";
import { financeStore } from "@/lib/finance-store";

// === SERVER ACTIONS (Déplacées obligatoirement hors du composant principal) ===

export async function addTransactionAction(formData: FormData) {
  "use server";
  const label = formData.get("label") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const account = formData.get("account") as "CHECKING" | "SAVINGS";

  if (!label || isNaN(amount)) return;

  financeStore.transactions.unshift({
    id: Date.now().toString(),
    label,
    amount,
    type,
    account,
    date: new Date().toISOString().split("T")[0],
  });

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function addGoalAction(formData: FormData) {
  "use server";
  const title = formData.get("title") as string;
  const targetAmount = parseFloat(formData.get("targetAmount") as string);
  const account = formData.get("account") as "CHECKING" | "SAVINGS";

  if (!title || isNaN(targetAmount)) return;

  financeStore.goals.push({
    id: Date.now().toString(),
    title,
    targetAmount,
    account,
  });

  revalidatePath("/finance");
}

export async function deleteTransactionAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const index = financeStore.transactions.findIndex((t) => t.id === id);
  if (index !== -1) financeStore.transactions.splice(index, 1);

  revalidatePath("/finance");
  revalidatePath("/dashboard");
}

export async function deleteGoalAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const index = financeStore.goals.findIndex((g) => g.id === id);
  if (index !== -1) financeStore.goals.splice(index, 1);

  revalidatePath("/finance");
}

// === COMPOSANT PRINCIPAL ===

export default async function FinancePage() {
  // Calcul des soldes
  const checkingBalance = financeStore.transactions
    .filter((t) => t.account === "CHECKING")
    .reduce((acc, t) => (t.type === "INCOME" ? acc + t.amount : acc - t.amount), 0);

  const savingsBalance = financeStore.transactions
    .filter((t) => t.account === "SAVINGS")
    .reduce((acc, t) => (t.type === "INCOME" ? acc + t.amount : acc - t.amount), 0);

  return (
    <div className="space-y-8 p-4 text-white max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">💳 Gestion Financière</h1>
        <p className="text-slate-400">Suis tes comptes, transactions et objectifs d'épargne.</p>
      </div>

      {/* Cartes des Soldes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-medium">💳 Compte Courant</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">Principal</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {checkingBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-medium">🐖 Livret A</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full">Épargne</span>
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {savingsBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </div>
        </div>
      </div>

      {/* Formulaires & Objectifs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ajouter une transaction */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-4 h-fit">
          <h2 className="text-lg font-bold">➕ Ajouter un mouvement</h2>
          <form action={addTransactionAction} className="space-y-3 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">Libellé</label>
              <input
                type="text"
                name="label"
                required
                placeholder="Ex: Salaire, Courses..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  required
                  placeholder="100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Type</label>
                <select
                  name="type"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="INCOME">📈 Revenu (+)</option>
                  <option value="EXPENSE">📉 Dépense (-)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Compte concerné</label>
              <select
                name="account"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="CHECKING">💳 Compte Courant</option>
                <option value="SAVINGS">🐖 Livret A</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg transition cursor-pointer"
            >
              Enregistrer
            </button>
          </form>
        </div>

        {/* Objectifs d'épargne */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-4 h-fit">
          <h2 className="text-lg font-bold">🎯 Créer un objectif</h2>
          <form action={addGoalAction} className="space-y-3 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">Titre de l'objectif</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Ex: Voiture, Vacances..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Cible (€)</label>
                <input
                  type="number"
                  name="targetAmount"
                  required
                  placeholder="3000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Sur le compte</label>
                <select
                  name="account"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="SAVINGS">🐖 Livret</option>
                  <option value="CHECKING">💳 Courant</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 rounded-lg transition cursor-pointer"
            >
              Ajouter l'objectif
            </button>
          </form>

          {/* Liste des objectifs */}
          <div className="pt-4 border-t border-slate-700/60 space-y-3">
            <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Vos objectifs en cours</h3>
            {financeStore.goals.map((g) => {
              const currentBalance = g.account === "SAVINGS" ? savingsBalance : checkingBalance;
              const percent = Math.min(Math.round((currentBalance / g.targetAmount) * 100), 100);

              return (
                <div key={g.id} className="bg-slate-900/60 border border-slate-700/50 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">{g.title}</span>
                    <form action={deleteGoalAction}>
                      <input type="hidden" name="id" value={g.id} />
                      <button type="submit" className="text-slate-500 hover:text-rose-400 cursor-pointer">✕</button>
                    </form>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>
                      {currentBalance.toLocaleString("fr-FR")} € / {g.targetAmount.toLocaleString("fr-FR")} €
                    </span>
                    <span className="font-semibold text-amber-400">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historique des transactions */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold">📜 Historique</h2>
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {financeStore.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-slate-900/50 border border-slate-700/40 p-3 rounded-xl text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">{t.label}</div>
                  <div className="text-[10px] text-slate-400">
                    {t.account === "CHECKING" ? "💳 Courant" : "🐖 Livret"} • {t.date}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold ${
                      t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </span>
                  <form action={deleteTransactionAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="text-slate-500 hover:text-rose-400 cursor-pointer">✕</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}