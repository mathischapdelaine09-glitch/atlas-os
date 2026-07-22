import Link from "next/link";
import { projectsStore } from "@/lib/projects-store";
import { financeStore } from "@/lib/finance-store";
import { notesStore } from "@/lib/notes-store";

export default function DashboardPage() {
  // --- CALCULS PROJETS ---
  const totalProjects = projectsStore.length;
  const inProgressProjects = projectsStore.filter((p) => p.status === "IN_PROGRESS");
  // ⚡ FIX: "DONE" au lieu de "COMPLETED"
  const completedProjectsCount = projectsStore.filter((p) => p.status === "DONE").length;
  const recentProjects = projectsStore.slice(0, 3);

  // --- CALCULS FINANCES ---
  const checkingBalance = financeStore.transactions
    .filter((t) => t.account === "CHECKING")
    .reduce((acc, t) => (t.type === "INCOME" ? acc + t.amount : acc - t.amount), 0);

  const savingsBalance = financeStore.transactions
    .filter((t) => t.account === "SAVINGS")
    .reduce((acc, t) => (t.type === "INCOME" ? acc + t.amount : acc - t.amount), 0);

  const recentTransactions = financeStore.transactions.slice(0, 4);

  // Objectif le plus avancé
  const mainGoal = financeStore.goals[0];
  const goalCurrentBalance = mainGoal?.account === "SAVINGS" ? savingsBalance : checkingBalance;
  const goalPercent = mainGoal
    ? Math.min(Math.round((goalCurrentBalance / mainGoal.targetAmount) * 100), 100)
    : 0;

  return (
    <div className="space-y-8 text-white p-2 md:p-6">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-800/80 to-slate-900 border border-slate-700/60 p-8 shadow-2xl">
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Mahis CHAPDELAINE
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">AtlasOS</span> 
          </h1>
          <p className="text-slate-400 max-w-xl text-sm md:text-base">
            Voici l'état de tes finances et l'avancement de tes projets en temps réel.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. GRILLE DES METRIQUES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carte Solde Courant */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition duration-300">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Compte Courant</span>
            <span className="text-xl">💳</span>
          </div>
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            {checkingBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/40 flex justify-between text-xs text-slate-400">
            <span>Livret A :</span>
            <span className="font-semibold text-amber-400">
              {savingsBalance.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
            </span>
          </div>
        </div>

        {/* Carte Projets */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition duration-300">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Projets Actifs</span>
            <span className="text-xl">🚀</span>
          </div>
          <div className="text-3xl font-black text-indigo-400 tracking-tight">
            {inProgressProjects.length} <span className="text-sm font-normal text-slate-400">/ {totalProjects}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/40 flex justify-between text-xs text-slate-400">
            <span>Terminés :</span>
            <span className="font-semibold text-emerald-400">{completedProjectsCount} projets</span>
          </div>
        </div>

        {/* Carte Objectif Phare */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition duration-300">
          <div className="flex justify-between items-center text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Objectif Principal</span>
            <span className="text-xl">🎯</span>
          </div>
          {mainGoal ? (
            <>
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold text-white truncate max-w-[180px]">{mainGoal.title}</span>
                <span className="text-xs font-extrabold text-amber-400">{goalPercent}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-500"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                <span>Progression :</span>
                <span>{goalCurrentBalance.toLocaleString("fr-FR")} / {mainGoal.targetAmount.toLocaleString("fr-FR")} €</span>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 py-4">Aucun objectif défini sur la page Finance.</p>
          )}
        </div>
      </div>

      {/* 3. FLUX D'ACTIVITÉ RÉCENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne Derniers Projets */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span>📁</span> Projets Récents
            </h2>
            <Link
              href="/projects"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Voir tout →
            </Link>
          </div>

          <div className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-900/60 border border-slate-700/40 p-3.5 rounded-xl text-xs hover:bg-slate-900 transition"
                >
                  <div className="space-y-1 max-w-[70%]">
                    <div className="font-semibold text-white text-sm truncate">{p.title}</div>
                    <div className="text-slate-400 text-[11px] line-clamp-1">{p.description || "Pas de description"}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      p.status === "DONE"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : p.status === "IN_PROGRESS"
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "bg-slate-700/40 text-slate-400 border border-slate-600/30"
                    }`}
                  >
                    {p.status === "DONE" ? "Terminé" : p.status === "IN_PROGRESS" ? "En cours" : "À faire"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Aucun projet créé pour l'instant.</p>
            )}
          </div>
        </div>

        {/* Colonne Dernières Transactions */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span>💸</span> Flux Financier Récent
            </h2>
            <Link
              href="/finance"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
            >
              Gérer la finance →
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between bg-slate-900/60 border border-slate-700/40 p-3.5 rounded-xl text-xs hover:bg-slate-900 transition"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white text-sm">{t.label}</div>
                    <div className="text-[10px] text-slate-400">
                      {t.account === "CHECKING" ? "💳 Courant" : "🐖 Livret"} • {t.date}
                    </div>
                  </div>
                  <span
                    className={`font-extrabold text-sm ${
                      t.type === "INCOME" ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Aucune transaction enregistrée.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}