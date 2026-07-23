"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  xp_reward: number;
  points_reward: number;
  is_archived: boolean;
  created_at: string;
};

type Completion = {
  id: string;
  habit_id: string;
  completed_on: string;
};

type Reward = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  emoji: string;
  cost: number;
  is_active: boolean;
  created_at: string;
};

type Redemption = {
  id: string;
  reward_name: string;
  reward_emoji: string;
  cost: number;
  redeemed_at: string;
};

type Gamification = {
  total_xp: number;
  points_balance: number;
  lifetime_points: number;
};

type Tab = "habits" | "rewards" | "history";

const HABIT_COLORS = {
  indigo: {
    border: "border-indigo-500/30",
    background: "bg-indigo-500/10",
    text: "text-indigo-300",
  },
  emerald: {
    border: "border-emerald-500/30",
    background: "bg-emerald-500/10",
    text: "text-emerald-300",
  },
  amber: {
    border: "border-amber-500/30",
    background: "bg-amber-500/10",
    text: "text-amber-300",
  },
  rose: {
    border: "border-rose-500/30",
    background: "bg-rose-500/10",
    text: "text-rose-300",
  },
  sky: {
    border: "border-sky-500/30",
    background: "bg-sky-500/10",
    text: "text-sky-300",
  },
} as const;

type HabitColor = keyof typeof HABIT_COLORS;

function getLocalDate(date = new Date()) {
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .split("T")[0];
}

function addDays(date: string, amount: number) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + amount);

  return getLocalDate(nextDate);
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getLevel(totalXp: number) {
  return Math.floor(totalXp / 250) + 1;
}

function getLevelProgress(totalXp: number) {
  return totalXp % 250;
}

function calculateStreak(
  habitId: string,
  completions: Completion[],
  today: string,
) {
  const completedDates = new Set(
    completions
      .filter((completion) => completion.habit_id === habitId)
      .map((completion) => completion.completed_on),
  );

  let currentDate = completedDates.has(today)
    ? today
    : addDays(today, -1);

  let streak = 0;

  while (completedDates.has(currentDate)) {
    streak += 1;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

export default function HabitsPage() {
  const [supabase] = useState(() => createClient());

  /*
   * Le cast évite les soulignements TypeScript tant que les types
   * Supabase n'ont pas encore été régénérés avec les nouvelles tables.
   */
  const database = supabase as any;

  const [userId, setUserId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const [gamification, setGamification] = useState<Gamification>({
    total_xp: 0,
    points_balance: 0,
    lifetime_points: 0,
  });

  const [activeTab, setActiveTab] = useState<Tab>("habits");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [habitFormOpen, setHabitFormOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(
    null,
  );

  const [habitName, setHabitName] = useState("");
  const [habitDescription, setHabitDescription] = useState("");
  const [habitEmoji, setHabitEmoji] = useState("✨");
  const [habitColor, setHabitColor] =
    useState<HabitColor>("indigo");
  const [habitXp, setHabitXp] = useState(10);
  const [habitPoints, setHabitPoints] = useState(5);

  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardEmoji, setRewardEmoji] = useState("🎁");
  const [rewardCost, setRewardCost] = useState(50);

  const today = getLocalDate();

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "Impossible de retrouver ton compte utilisateur.",
      );
      setIsLoading(false);
      return;
    }

    setUserId(user.id);

    await database
      .from("user_gamification")
      .upsert(
        {
          user_id: user.id,
        },
        {
          onConflict: "user_id",
        },
      );

    const firstLoadedDate = addDays(today, -60);

    const [
      habitsResult,
      completionsResult,
      rewardsResult,
      redemptionsResult,
      gamificationResult,
    ] = await Promise.all([
      database
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: true }),

      database
        .from("habit_completions")
        .select("id, habit_id, completed_on")
        .eq("user_id", user.id)
        .gte("completed_on", firstLoadedDate)
        .order("completed_on", { ascending: false }),

      database
        .from("rewards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("cost", { ascending: true }),

      database
        .from("reward_redemptions")
        .select(
          "id, reward_name, reward_emoji, cost, redeemed_at",
        )
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false })
        .limit(30),

      database
        .from("user_gamification")
        .select("total_xp, points_balance, lifetime_points")
        .eq("user_id", user.id)
        .single(),
    ]);

    const firstError =
      habitsResult.error ??
      completionsResult.error ??
      rewardsResult.error ??
      redemptionsResult.error ??
      gamificationResult.error;

    if (firstError) {
      console.error(firstError);
      setErrorMessage(firstError.message);
      setIsLoading(false);
      return;
    }

    setHabits((habitsResult.data ?? []) as Habit[]);
    setCompletions(
      (completionsResult.data ?? []) as Completion[],
    );
    setRewards((rewardsResult.data ?? []) as Reward[]);
    setRedemptions(
      (redemptionsResult.data ?? []) as Redemption[],
    );

    setGamification(
      (gamificationResult.data ?? {
        total_xp: 0,
        points_balance: 0,
        lifetime_points: 0,
      }) as Gamification,
    );

    setIsLoading(false);
  }, [database, supabase, today]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const completedToday = useMemo(
    () =>
      new Set(
        completions
          .filter(
            (completion) =>
              completion.completed_on === today,
          )
          .map((completion) => completion.habit_id),
      ),
    [completions, today],
  );

  const todayProgress =
    habits.length === 0
      ? 0
      : Math.round(
          (completedToday.size / habits.length) * 100,
        );

  const weekDates = useMemo(
    () =>
      Array.from(
        {
          length: 7,
        },
        (_, index) => addDays(today, index - 6),
      ),
    [today],
  );

  const weekCompleted = completions.filter((completion) =>
    weekDates.includes(completion.completed_on),
  ).length;

  const level = getLevel(gamification.total_xp);
  const levelProgress = getLevelProgress(
    gamification.total_xp,
  );

  function resetHabitForm() {
    setEditingHabitId(null);
    setHabitName("");
    setHabitDescription("");
    setHabitEmoji("✨");
    setHabitColor("indigo");
    setHabitXp(10);
    setHabitPoints(5);
  }

  function openNewHabit() {
    resetHabitForm();
    setHabitFormOpen(true);
  }

  function openEditHabit(habit: Habit) {
    setEditingHabitId(habit.id);
    setHabitName(habit.name);
    setHabitDescription(habit.description);
    setHabitEmoji(habit.emoji);

    setHabitColor(
      habit.color in HABIT_COLORS
        ? (habit.color as HabitColor)
        : "indigo",
    );

    setHabitXp(habit.xp_reward);
    setHabitPoints(habit.points_reward);
    setHabitFormOpen(true);
  }

  function resetRewardForm() {
    setRewardName("");
    setRewardDescription("");
    setRewardEmoji("🎁");
    setRewardCost(50);
  }

  async function saveHabit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!userId || !habitName.trim() || busyId) {
      return;
    }

    setBusyId("habit-form");
    setErrorMessage("");

    const values = {
      user_id: userId,
      name: habitName.trim(),
      description: habitDescription.trim(),
      emoji: habitEmoji.trim() || "✨",
      color: habitColor,
      xp_reward: habitXp,
      points_reward: habitPoints,
    };

    const result = editingHabitId
      ? await database
          .from("habits")
          .update(values)
          .eq("id", editingHabitId)
          .eq("user_id", userId)
      : await database.from("habits").insert(values);

    if (result.error) {
      setErrorMessage(result.error.message);
      setBusyId(null);
      return;
    }

    setHabitFormOpen(false);
    resetHabitForm();
    await loadAll();
    setBusyId(null);
  }

  async function archiveHabit(habit: Habit) {
    if (!userId || busyId) {
      return;
    }

    const confirmed = window.confirm(
      `Archiver l’habitude « ${habit.name} » ? Son historique sera conservé.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(habit.id);

    const { error } = await database
      .from("habits")
      .update({
        is_archived: true,
      })
      .eq("id", habit.id)
      .eq("user_id", userId);

    if (error) {
      setErrorMessage(error.message);
    } else {
      await loadAll();
    }

    setBusyId(null);
  }

  async function toggleHabit(habitId: string) {
    if (busyId) {
      return;
    }

    setBusyId(habitId);
    setErrorMessage("");

    const { error } = await database.rpc(
      "toggle_habit_completion",
      {
        target_habit_id: habitId,
        target_date: today,
      },
    );

    if (error) {
      setErrorMessage(error.message);
    } else {
      await loadAll();
    }

    setBusyId(null);
  }

  async function saveReward(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!userId || !rewardName.trim() || busyId) {
      return;
    }

    setBusyId("reward-form");
    setErrorMessage("");

    const { error } = await database
      .from("rewards")
      .insert({
        user_id: userId,
        name: rewardName.trim(),
        description: rewardDescription.trim(),
        emoji: rewardEmoji.trim() || "🎁",
        cost: rewardCost,
      });

    if (error) {
      setErrorMessage(error.message);
      setBusyId(null);
      return;
    }

    setRewardFormOpen(false);
    resetRewardForm();
    await loadAll();
    setBusyId(null);
  }

  async function redeemReward(reward: Reward) {
    if (
      busyId ||
      gamification.points_balance < reward.cost
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Dépenser ${reward.cost} points pour « ${reward.name} » ?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(reward.id);
    setErrorMessage("");

    const { error } = await database.rpc(
      "redeem_reward",
      {
        target_reward_id: reward.id,
      },
    );

    if (error) {
      setErrorMessage(error.message);
    } else {
      await loadAll();
      setActiveTab("history");
    }

    setBusyId(null);
  }

  async function deleteReward(reward: Reward) {
    if (!userId || busyId) {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer la récompense « ${reward.name} » ?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyId(reward.id);

    const { error } = await database
      .from("rewards")
      .update({
        is_active: false,
      })
      .eq("id", reward.id)
      .eq("user_id", userId);

    if (error) {
      setErrorMessage(error.message);
    } else {
      await loadAll();
    }

    setBusyId(null);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden pb-28 sm:pb-8">
      <header className="mb-5 min-w-0 sm:mb-8 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Progression
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Habitudes
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Construis ta régularité, gagne de l’XP et
            transforme tes efforts en récompenses concrètes.
          </p>
        </div>

        <button
          type="button"
          onClick={
            activeTab === "rewards"
              ? () => setRewardFormOpen(true)
              : openNewHabit
          }
          className="mt-4 hidden min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:flex"
        >
          +{" "}
          {activeTab === "rewards"
            ? "Nouvelle récompense"
            : "Nouvelle habitude"}
        </button>
      </header>

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {errorMessage}
        </div>
      )}

      <section className="mb-5 grid min-w-0 grid-cols-2 gap-2 sm:mb-6 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label="Niveau"
          value={level}
          description={`${levelProgress}/250 XP`}
        />

        <StatCard
          label="Points"
          value={gamification.points_balance}
          description="Disponibles"
        />

        <StatCard
          label="Aujourd’hui"
          value={`${todayProgress}%`}
          description={`${completedToday.size}/${habits.length} habitudes`}
        />

        <StatCard
          label="Cette semaine"
          value={weekCompleted}
          description="Validations"
        />
      </section>

      <section className="mb-5 min-w-0 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              Progression vers le niveau {level + 1}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {250 - levelProgress} XP avant le prochain
              niveau
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            {gamification.total_xp} XP
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{
              width: `${Math.max(
                2,
                (levelProgress / 250) * 100,
              )}%`,
            }}
          />
        </div>
      </section>

      <nav className="mb-5 grid min-w-0 grid-cols-3 gap-1 rounded-2xl border border-slate-800 bg-slate-950/50 p-1">
        <TabButton
          active={activeTab === "habits"}
          onClick={() => setActiveTab("habits")}
        >
          Habitudes
        </TabButton>

        <TabButton
          active={activeTab === "rewards"}
          onClick={() => setActiveTab("rewards")}
        >
          Récompenses
        </TabButton>

        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          Historique
        </TabButton>
      </nav>

      {isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40">
          <p className="text-sm text-slate-500">
            Chargement de ta progression...
          </p>
        </div>
      ) : activeTab === "habits" ? (
        <section className="space-y-4">
          <WeeklyOverview
            dates={weekDates}
            habits={habits}
            completions={completions}
          />

          {habits.length === 0 ? (
            <EmptyState
              emoji="🌱"
              title="Aucune habitude"
              text="Commence avec deux ou trois habitudes simples que tu peux réellement tenir."
              button="Créer ma première habitude"
              onClick={openNewHabit}
            />
          ) : (
            <div className="grid min-w-0 gap-3 lg:grid-cols-2">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completed={completedToday.has(habit.id)}
                  streak={calculateStreak(
                    habit.id,
                    completions,
                    today,
                  )}
                  busy={busyId === habit.id}
                  onToggle={() => toggleHabit(habit.id)}
                  onEdit={() => openEditHabit(habit)}
                  onArchive={() => archiveHabit(habit)}
                />
              ))}
            </div>
          )}
        </section>
      ) : activeTab === "rewards" ? (
        <section>
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-200">
              Ton solde : {gamification.points_balance}{" "}
              points
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-200/60">
              Les points se dépensent ici. Ton XP et ton
              niveau restent acquis.
            </p>
          </div>

          {rewards.length === 0 ? (
            <EmptyState
              emoji="🎁"
              title="Ta boutique est vide"
              text="Ajoute des récompenses qui te motivent vraiment, mais que tu ne t’accordes pas automatiquement."
              button="Créer une récompense"
              onClick={() => setRewardFormOpen(true)}
            />
          ) : (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  affordable={
                    gamification.points_balance >= reward.cost
                  }
                  busy={busyId === reward.id}
                  onRedeem={() => redeemReward(reward)}
                  onDelete={() => deleteReward(reward)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          {redemptions.length === 0 ? (
            <EmptyState
              emoji="🧾"
              title="Aucune récompense utilisée"
              text="Les récompenses que tu débloqueras apparaîtront ici."
            />
          ) : (
            <div className="space-y-3">
              {redemptions.map((redemption) => (
                <article
                  key={redemption.id}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl">
                    {redemption.reward_emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-white">
                      {redemption.reward_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(
                        redemption.redeemed_at,
                      )}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-amber-300">
                    −{redemption.cost}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab !== "history" && (
        <button
          type="button"
          onClick={
            activeTab === "rewards"
              ? () => setRewardFormOpen(true)
              : openNewHabit
          }
          aria-label={
            activeTab === "rewards"
              ? "Créer une récompense"
              : "Créer une habitude"
          }
          className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-3xl font-light text-white shadow-xl shadow-indigo-950/40 transition active:scale-95 sm:hidden"
        >
          +
        </button>
      )}

      {habitFormOpen && (
        <Modal onClose={() => setHabitFormOpen(false)}>
          <form onSubmit={saveHabit} className="space-y-5">
            <ModalHeader
              eyebrow="Habitude"
              title={
                editingHabitId
                  ? "Modifier l’habitude"
                  : "Nouvelle habitude"
              }
              onClose={() => setHabitFormOpen(false)}
            />

            <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-3">
              <Field label="Emoji">
                <input
                  value={habitEmoji}
                  onChange={(event) =>
                    setHabitEmoji(event.target.value)
                  }
                  maxLength={4}
                  className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-center text-xl text-white outline-none focus:border-indigo-500"
                />
              </Field>

              <Field label="Nom">
                <input
                  value={habitName}
                  onChange={(event) =>
                    setHabitName(event.target.value)
                  }
                  maxLength={80}
                  required
                  placeholder="Lire 20 minutes"
                  className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />
              </Field>
            </div>

            <Field label="Description facultative">
              <textarea
                value={habitDescription}
                onChange={(event) =>
                  setHabitDescription(event.target.value)
                }
                rows={3}
                maxLength={240}
                placeholder="Pourquoi cette habitude compte pour toi ?"
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />
            </Field>

            <Field label="Couleur">
              <div className="grid grid-cols-5 gap-2">
                {(
                  Object.keys(
                    HABIT_COLORS,
                  ) as HabitColor[]
                ).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setHabitColor(color)}
                    className={`h-11 rounded-xl border transition ${HABIT_COLORS[color].background} ${HABIT_COLORS[color].border} ${
                      habitColor === color
                        ? "ring-2 ring-white/70"
                        : ""
                    }`}
                    aria-label={`Couleur ${color}`}
                  />
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="XP gagnée"
                value={habitXp}
                min={1}
                max={100}
                onChange={setHabitXp}
              />

              <NumberField
                label="Points gagnés"
                value={habitPoints}
                min={1}
                max={100}
                onChange={setHabitPoints}
              />
            </div>

            <p className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs leading-5 text-slate-500">
              Conseil : garde 10 XP et 5 points pour une
              habitude normale. Augmente seulement pour une
              habitude réellement difficile.
            </p>

            <FormActions
              saving={busyId === "habit-form"}
              submitLabel={
                editingHabitId
                  ? "Enregistrer"
                  : "Créer l’habitude"
              }
              onCancel={() => setHabitFormOpen(false)}
            />
          </form>
        </Modal>
      )}

      {rewardFormOpen && (
        <Modal onClose={() => setRewardFormOpen(false)}>
          <form onSubmit={saveReward} className="space-y-5">
            <ModalHeader
              eyebrow="Récompense"
              title="Nouvelle récompense"
              onClose={() => setRewardFormOpen(false)}
            />

            <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-3">
              <Field label="Emoji">
                <input
                  value={rewardEmoji}
                  onChange={(event) =>
                    setRewardEmoji(event.target.value)
                  }
                  maxLength={4}
                  className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-center text-xl text-white outline-none focus:border-indigo-500"
                />
              </Field>

              <Field label="Nom">
                <input
                  value={rewardName}
                  onChange={(event) =>
                    setRewardName(event.target.value)
                  }
                  required
                  maxLength={80}
                  placeholder="Une soirée jeu sans culpabiliser"
                  className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />
              </Field>
            </div>

            <Field label="Description facultative">
              <textarea
                value={rewardDescription}
                onChange={(event) =>
                  setRewardDescription(event.target.value)
                }
                rows={3}
                maxLength={240}
                placeholder="Précise ce que cette récompense comprend."
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
              />
            </Field>

            <NumberField
              label="Coût en points"
              value={rewardCost}
              min={1}
              max={100000}
              onChange={setRewardCost}
            />

            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-200/70">
              Exemple : 50 points pour une petite récompense,
              150 pour une moyenne et 400 ou plus pour une
              grosse récompense.
            </p>

            <FormActions
              saving={busyId === "reward-form"}
              submitLabel="Créer la récompense"
              onCancel={() => setRewardFormOpen(false)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/50 p-3 sm:p-5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
        {label}
      </p>

      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
        {value}
      </p>

      <p className="mt-1 hidden truncate text-xs text-slate-500 sm:block">
        {description}
      </p>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-xl px-2 py-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-500 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="block truncate">{children}</span>
    </button>
  );
}

function WeeklyOverview({
  dates,
  habits,
  completions,
}: {
  dates: string[];
  habits: Habit[];
  completions: Completion[];
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 p-3 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">
          Les 7 derniers jours
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Une vue rapide de ta régularité.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-7 gap-1.5 sm:gap-2">
        {dates.map((date) => {
          const completedCount = completions.filter(
            (completion) =>
              completion.completed_on === date,
          ).length;

          const percentage =
            habits.length === 0
              ? 0
              : Math.round(
                  (completedCount / habits.length) * 100,
                );

          return (
            <div
              key={date}
              className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 px-1 py-2 text-center sm:px-2 sm:py-3"
            >
              <p className="truncate text-[9px] font-semibold uppercase text-slate-600 sm:text-xs">
                {formatShortDate(date).split(" ")[0]}
              </p>

              <p className="mt-1 text-sm font-bold text-white sm:text-base">
                {new Date(
                  `${date}T12:00:00`,
                ).getDate()}
              </p>

              <div className="mx-auto mt-2 h-1.5 w-full max-w-10 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <p className="mt-1 text-[9px] text-slate-600 sm:text-[11px]">
                {completedCount}/{habits.length}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HabitCard({
  habit,
  completed,
  streak,
  busy,
  onToggle,
  onEdit,
  onArchive,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const style =
    HABIT_COLORS[
      habit.color in HABIT_COLORS
        ? (habit.color as HabitColor)
        : "indigo"
    ];

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl border p-3 transition sm:p-4 ${
        completed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-800 bg-slate-950/50"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          aria-label={
            completed
              ? "Annuler la validation"
              : "Valider l’habitude"
          }
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl transition active:scale-95 disabled:cursor-wait ${
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : `${style.border} ${style.background}`
          }`}
        >
          {busy ? "…" : completed ? "✓" : habit.emoji}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h3
                className={`break-words text-sm font-semibold sm:text-base ${
                  completed
                    ? "text-emerald-300"
                    : "text-white"
                }`}
              >
                {habit.name}
              </h3>

              {habit.description && (
                <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                  {habit.description}
                </p>
              )}
            </div>

            <span className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-400 sm:text-xs">
              🔥 {streak}
            </span>
          </div>

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${style.border} ${style.background} ${style.text}`}
            >
              +{habit.xp_reward} XP
            </span>

            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-300 sm:text-xs">
              +{habit.points_reward} pts
            </span>

            <span
              className={`text-[10px] font-semibold sm:text-xs ${
                completed
                  ? "text-emerald-400"
                  : "text-slate-600"
              }`}
            >
              {completed
                ? "Terminée aujourd’hui"
                : "À faire aujourd’hui"}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-800 pt-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg px-3 py-2 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
            >
              Modifier
            </button>

            <button
              type="button"
              onClick={onArchive}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-800 hover:text-white"
            >
              Archiver
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RewardCard({
  reward,
  affordable,
  busy,
  onRedeem,
  onDelete,
}: {
  reward: Reward;
  affordable: boolean;
  busy: boolean;
  onRedeem: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">
          {reward.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="break-words text-sm font-semibold text-white sm:text-base">
            {reward.name}
          </h3>

          {reward.description && (
            <p className="mt-1 break-words text-xs leading-5 text-slate-500">
              {reward.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex min-w-0 items-center justify-between gap-2">
        <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
          {reward.cost} points
        </span>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg px-2 py-2 text-xs text-slate-600 transition hover:bg-slate-800 hover:text-white"
        >
          Supprimer
        </button>
      </div>

      <button
        type="button"
        onClick={onRedeem}
        disabled={!affordable || busy}
        className="mt-3 min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
      >
        {busy
          ? "Déblocage..."
          : affordable
            ? "Débloquer"
            : "Pas assez de points"}
      </button>
    </article>
  );
}

function EmptyState({
  emoji,
  title,
  text,
  button,
  onClick,
}: {
  emoji: string;
  title: string;
  text: string;
  button?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex min-h-72 min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-10 text-center">
      <div className="text-4xl">{emoji}</div>

      <h2 className="mt-4 text-lg font-bold text-white">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {text}
      </p>

      {button && onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          {button}
        </button>
      )}
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/60 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-10 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[calc(100dvh-3rem-env(safe-area-inset-bottom))] w-full min-w-0 overflow-y-auto overscroll-contain rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-2xl sm:max-h-[92vh] sm:max-w-xl sm:p-7">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-400">
          {eyebrow}
        </p>

        <h2 className="mt-2 break-words text-2xl font-bold text-white">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xl text-slate-400 transition hover:bg-slate-700 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
      </span>

      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) =>
          onChange(
            Math.min(
              max,
              Math.max(min, Number(event.target.value)),
            ),
          )
        }
        className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm text-white outline-none focus:border-indigo-500"
      />
    </Field>
  );
}

function FormActions({
  saving,
  submitLabel,
  onCancel,
}: {
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-12 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white sm:w-auto"
      >
        Annuler
      </button>

      <button
        type="submit"
        disabled={saving}
        className="min-h-12 w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-50 sm:w-auto"
      >
        {saving ? "Enregistrement..." : submitLabel}
      </button>
    </div>
  );
}
