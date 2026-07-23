import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type {
  FinanceGoal,
  FinanceTransaction,
} from "@/types/finance";
import type { Project } from "@/types/project";
import type { Note } from "@/types/note";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // =======================================================
  // UTILISATEUR
  // =======================================================

  const usernameMetadata = user.user_metadata?.username;

  const username =
    typeof usernameMetadata === "string" &&
    usernameMetadata.trim().length > 0
      ? usernameMetadata.trim()
      : user.email?.split("@")[0] ?? "Utilisateur Atlas";

  // =======================================================
  // DONNÉES SUPABASE
  // =======================================================

  const [
    projectsResult,
    transactionsResult,
    goalsResult,
    notesResult,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(`
        id,
        user_id,
        title,
        description,
        status,
        priority,
        progress,
        budget,
        due_date,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      }),

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

    supabase
      .from("notes")
      .select(`
        id,
        user_id,
        title,
        content,
        category,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("updated_at", {
        ascending: false,
      })
      .limit(4),
  ]);

  if (projectsResult.error) {
    throw new Error(
      `Impossible de récupérer les projets : ${projectsResult.error.message}`
    );
  }

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

  if (notesResult.error) {
    throw new Error(
      `Impossible de récupérer les notes : ${notesResult.error.message}`
    );
  }

  // =======================================================
  // NORMALISATION DES DONNÉES
  // =======================================================

  const projects =
    (projectsResult.data ?? []) as Project[];

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
      target_amount: Number(goal.target_amount),
    })) as FinanceGoal[];

  const recentNotes =
    (notesResult.data ?? []) as Note[];

  // =======================================================
  // CALCULS PROJETS
  // =======================================================

  const totalProjects = projects.length;

  const inProgressProjects = projects.filter(
    (project) => project.status === "in_progress"
  );

  const completedProjects = projects.filter(
    (project) => project.status === "completed"
  );

  const notStartedProjects = projects.filter(
    (project) => project.status === "not_started"
  );

  const recentProjects = projects.slice(0, 4);

  const averageProgress =
    totalProjects > 0
      ? Math.round(
          projects.reduce(
            (total, project) =>
              total + Number(project.progress ?? 0),
            0
          ) / totalProjects
        )
      : 0;

  // =======================================================
  // CALCULS FINANCES
  // =======================================================

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

  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.type === "INCOME"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const recentTransactions =
    transactions.slice(0, 3);

  // =======================================================
  // OBJECTIF FINANCIER PRINCIPAL
  // =======================================================

  const mainGoal = goals[0];

  const goalCurrentBalance =
    mainGoal?.account === "SAVINGS"
      ? savingsBalance
      : checkingBalance;

  const goalPercent = mainGoal
    ? Math.min(
        Math.max(
          Math.round(
            (goalCurrentBalance /
              mainGoal.target_amount) *
              100
          ),
          0
        ),
        100
      )
    : 0;

  const greeting = getGreeting();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 text-white md:space-y-8">
      {/* ===================================================
          HERO
      =================================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 shadow-2xl sm:p-7 md:p-10">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            {username}
          </span>

          <h1 className="mt-5 break-words text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              voici ton espace.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Tes projets, tes finances et tes notes sont
            synchronisés avec Supabase et réunis au même endroit
            dans AtlasOS.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <Link
              href="/projects"
              className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-500 sm:w-auto"
            >
              Voir mes projets
            </Link>

            <Link
              href="/finance"
              className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 sm:w-auto"
            >
              Gérer mes finances
            </Link>

            <Link
              href="/notes"
              className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 sm:w-auto"
            >
              Ouvrir mes notes
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </section>

      {/* ===================================================
          INDICATEURS PRINCIPAUX
      =================================================== */}

      <section className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <DashboardMetric
          label="Patrimoine total"
          value={formatCurrency(totalBalance)}
          description="Courant et épargne réunis"
          icon="💰"
          tone={
            totalBalance >= 0
              ? "emerald"
              : "rose"
          }
        />

        <DashboardMetric
          label="Compte courant"
          value={formatCurrency(checkingBalance)}
          description={`${transactions.length} mouvement${
            transactions.length > 1 ? "s" : ""
          } enregistré${
            transactions.length > 1 ? "s" : ""
          }`}
          icon="💳"
          tone={
            checkingBalance >= 0
              ? "indigo"
              : "rose"
          }
        />

        <DashboardMetric
          label="Épargne"
          value={formatCurrency(savingsBalance)}
          description="Solde du Livret A"
          icon="🐖"
          tone={
            savingsBalance >= 0
              ? "amber"
              : "rose"
          }
        />

        <DashboardMetric
          label="Projets actifs"
          value={`${inProgressProjects.length} / ${totalProjects}`}
          description={`${completedProjects.length} projet${
            completedProjects.length > 1 ? "s" : ""
          } terminé${
            completedProjects.length > 1 ? "s" : ""
          }`}
          icon="🚀"
          tone="violet"
        />
      </section>

      {/* ===================================================
          APERÇU FINANCE + PROJETS
      =================================================== */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* RÉSUMÉ FINANCIER */}

        <div className="space-y-5 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Finance
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Vue d’ensemble financière
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Les chiffres proviennent directement de
                Supabase.
              </p>
            </div>

            <Link
              href="/finance"
              className="text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
            >
              Ouvrir Finance →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Revenus enregistrés
              </p>

              <p className="mt-3 text-2xl font-black text-emerald-400">
                +{formatCurrency(totalIncome)}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                Dépenses enregistrées
              </p>

              <p className="mt-3 text-2xl font-black text-rose-400">
                -{formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">
                Derniers mouvements
              </h3>
            </div>

            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map(
                  (transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700 sm:items-center sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {transaction.label}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {transaction.account ===
                          "CHECKING"
                            ? "💳 Compte courant"
                            : "🐖 Livret A"}{" "}
                          ·{" "}
                          {formatDate(
                            transaction.transaction_date
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 break-words text-right text-sm font-black ${
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
                    </div>
                  )
                )
              ) : (
                <EmptyState
                  title="Aucune transaction"
                  description="Ajoute ton premier revenu ou ta première dépense depuis la page Finance."
                  href="/finance"
                  actionLabel="Ajouter une transaction"
                />
              )}
            </div>
          </div>
        </div>

        {/* OBJECTIF PRINCIPAL */}

        <div className="space-y-5 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
              Objectif principal
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Ton prochain cap
            </h2>
          </div>

          {mainGoal ? (
            <>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
                <p className="text-lg font-bold text-white">
                  {mainGoal.title}
                </p>

                <p className="mt-2 text-xs text-amber-200/70">
                  {mainGoal.account === "SAVINGS"
                    ? "Basé sur ton Livret A"
                    : "Basé sur ton compte courant"}
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <span className="text-3xl font-black text-amber-400">
                    {goalPercent} %
                  </span>

                  <span className="break-words text-xs text-slate-400 sm:text-right">
                    {formatCurrency(
                      goalCurrentBalance
                    )}{" "}
                    /{" "}
                    {formatCurrency(
                      mainGoal.target_amount
                    )}
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full border border-amber-500/10 bg-slate-950/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-500"
                    style={{
                      width: `${goalPercent}%`,
                    }}
                  />
                </div>
              </div>

              <Link
                href="/finance"
                className="block rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-amber-500/40 hover:text-white"
              >
                Gérer mes objectifs
              </Link>
            </>
          ) : (
            <EmptyState
              title="Aucun objectif"
              description="Crée un objectif financier pour suivre sa progression directement ici."
              href="/finance"
              actionLabel="Créer un objectif"
            />
          )}
        </div>
      </section>

      {/* ===================================================
          PROJETS
      =================================================== */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-5 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
                Projets
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Tes projets récents
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Suis rapidement ce qui avance et ce qui reste
                à préparer.
              </p>
            </div>

            <Link
              href="/projects"
              className="text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
            >
              Tous les projets →
            </Link>
          </div>

          <div className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  href={`/projects/${project.id}`}
                  key={project.id}
                  className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-indigo-500/30 hover:bg-slate-950"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {project.title}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {project.description ||
                          "Aucune description"}
                      </p>
                    </div>

                    <ProjectStatusBadge
                      status={project.status}
                    />
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-[11px] text-slate-500">
                      <span>Progression</span>

                      <span>
                        {Number(project.progress ?? 0)} %
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              Number(
                                project.progress ?? 0
                              ),
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="Aucun projet"
                description="Crée ton premier projet pour commencer à organiser tes objectifs dans AtlasOS."
                href="/projects"
                actionLabel="Créer un projet"
              />
            )}
          </div>
        </div>

        {/* STATISTIQUES PROJETS */}

        <div className="space-y-5 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">
              Progression
            </p>

            <h2 className="mt-2 text-xl font-bold">
              État des projets
            </h2>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 text-center">
            <p className="text-4xl font-black text-indigo-400">
              {averageProgress} %
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Progression moyenne
            </p>
          </div>

          <div className="space-y-3">
            <ProjectStatRow
              label="En cours"
              value={inProgressProjects.length}
              tone="indigo"
            />

            <ProjectStatRow
              label="À préparer"
              value={notStartedProjects.length}
              tone="amber"
            />

            <ProjectStatRow
              label="Terminés"
              value={completedProjects.length}
              tone="emerald"
            />
          </div>
        </div>
      </section>

      {/* ===================================================
          NOTES
      =================================================== */}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-5 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">
                Notes
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Tes dernières notes
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Retrouve rapidement tes idées, tes procédures
                et tes rappels récents.
              </p>
            </div>

            <Link
              href="/notes"
              className="text-sm font-semibold text-indigo-400 transition hover:text-indigo-300"
            >
              Toutes les notes →
            </Link>
          </div>

          {recentNotes.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes?editId=${note.id}`}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-violet-500/30 hover:bg-slate-950"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getNoteCategoryClasses(
                        note.category
                      )}`}
                    >
                      {getNoteCategoryIcon(note.category)}{" "}
                      {note.category}
                    </span>

                    <span className="text-[10px] text-slate-600">
                      {formatDateTime(note.updated_at)}
                    </span>
                  </div>

                  <h3 className="mt-4 line-clamp-1 font-semibold text-white">
                    {note.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-5 text-slate-500">
                    {note.content}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucune note"
              description="Crée ta première note pour la retrouver directement sur ton Dashboard."
              href="/notes"
              actionLabel="Créer une note"
            />
          )}
        </div>

        <div className="space-y-5 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">
              Mémo rapide
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Ton espace de capture
            </h2>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
            <p className="text-4xl font-black text-violet-400">
              {recentNotes.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              note{recentNotes.length > 1 ? "s" : ""} récente
              {recentNotes.length > 1 ? "s" : ""} affichée
              {recentNotes.length > 1 ? "s" : ""}
            </p>
          </div>

          <Link
            href="/notes"
            className="block rounded-xl bg-violet-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Écrire une note
          </Link>
        </div>
      </section>
    </div>
  );
}

// =========================================================
// COMPOSANTS
// =========================================================

function DashboardMetric({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  tone:
    | "emerald"
    | "rose"
    | "indigo"
    | "amber"
    | "violet";
}) {
  const toneClasses = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    indigo: "text-indigo-400",
    amber: "text-amber-400",
    violet: "text-violet-400",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 transition hover:border-slate-600 sm:rounded-3xl sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>

        <span className="shrink-0 text-lg sm:text-xl">{icon}</span>
      </div>

      <p
        className={`mt-3 break-words text-xl font-black tracking-tight sm:mt-4 sm:text-3xl ${toneClasses[tone]}`}
      >
        {value}
      </p>

      <p className="mt-2 break-words text-[11px] leading-4 text-slate-500 sm:text-xs">
        {description}
      </p>
    </div>
  );
}

function ProjectStatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "amber" | "emerald";
}) {
  const toneClasses = {
    indigo:
      "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
    amber:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
    emerald:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${toneClasses[tone]}`}
    >
      <span className="text-sm font-medium">
        {label}
      </span>

      <span className="text-lg font-black">
        {value}
      </span>
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center">
      <p className="font-semibold text-white">
        {title}
      </p>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-flex rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function ProjectStatusBadge({
  status,
}: {
  status: Project["status"];
}) {
  if (status === "completed") {
    return (
      <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
        Terminé
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span className="shrink-0 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold text-indigo-400">
        En cours
      </span>
    );
  }

  if (status === "archived") {
    return (
      <span className="shrink-0 rounded-full border border-slate-600/40 bg-slate-700/40 px-2.5 py-1 text-[10px] font-bold text-slate-400">
        Archivé
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold text-amber-400">
      À préparer
    </span>
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


function getNoteCategoryClasses(
  category: Note["category"]
) {
  const styles = {
    Général:
      "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    Idées:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
    Urgent:
      "border-rose-500/30 bg-rose-500/10 text-rose-300",
    Procédures:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  };

  return styles[category];
}

function getNoteCategoryIcon(
  category: Note["category"]
) {
  const icons = {
    Général: "📌",
    Idées: "💡",
    Urgent: "🚨",
    Procédures: "🛠️",
  };

  return icons[category];
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Bonjour";
  }

  if (hour < 18) {
    return "Bon après-midi";
  }

  return "Bonsoir";
}