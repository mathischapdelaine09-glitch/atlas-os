"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "today" | "upcoming" | "completed";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  completed: boolean;
  createdAt: string;
};

type DatabaseTask = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};



const priorityLabels: Record<Priority, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
};

const priorityStyles: Record<Priority, string> = {
  low: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};


function getToday() {
  const currentDate = new Date();
  const timezoneOffset = currentDate.getTimezoneOffset();

  const localDate = new Date(
    currentDate.getTime() - timezoneOffset * 60 * 1000,
  );

  return localDate.toISOString().split("T")[0];
}

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function getFilterTitle(filter: Filter) {
  const titles: Record<Filter, string> = {
    all: "Toutes les tâches",
    today: "À faire aujourd’hui",
    upcoming: "Tâches à venir",
    completed: "Tâches terminées",
  };

  return titles[filter];
}

function databaseTaskToTask(task: DatabaseTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.due_date ?? "",
    completed: task.completed,
    createdAt: task.created_at,
  };
}

export default function TodoPage() {
  const [supabase] = useState(() => createClient());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");

  /*
   * Charge les tâches enregistrées dans le navigateur.
   */
useEffect(() => {
  let cancelled = false;

  async function loadTasks() {
    setIsLoaded(false);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (cancelled) {
      return;
    }

    if (userError || !user) {
      setErrorMessage(
        "Impossible de retrouver ton compte utilisateur.",
      );
      setIsLoaded(true);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("tasks")
      .select(`
        id,
        user_id,
        title,
        description,
        priority,
        due_date,
        completed,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("due_date", {
        ascending: true,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false });

    if (cancelled) {
      return;
    }

    if (error) {
      console.error(
        "Impossible de charger les tâches :",
        error,
      );

      setErrorMessage(
        `Impossible de charger les tâches : ${error.message}`,
      );

      setIsLoaded(true);
      return;
    }

    const loadedTasks = (data ?? []).map((task) =>
      databaseTaskToTask(task as DatabaseTask),
    );

    setTasks(loadedTasks);
    setIsLoaded(true);
  }

  void loadTasks();

  return () => {
    cancelled = true;
  };
}, [supabase]);

  const stats = useMemo(() => {
    const today = getToday();

    const completed = tasks.filter((task) => task.completed).length;

    const dueToday = tasks.filter(
      (task) => task.dueDate === today && !task.completed,
    ).length;

    return {
      total: tasks.length,
      remaining: tasks.length - completed,
      completed,
      dueToday,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const today = getToday();
    const cleanSearch = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesSearch =
          cleanSearch === "" ||
          task.title.toLowerCase().includes(cleanSearch) ||
          task.description.toLowerCase().includes(cleanSearch);

        if (!matchesSearch) {
          return false;
        }

        if (filter === "today") {
          return task.dueDate === today && !task.completed;
        }

        if (filter === "upcoming") {
          return task.dueDate > today && !task.completed;
        }

        if (filter === "completed") {
          return task.completed;
        }

        return true;
      })
      .sort((firstTask, secondTask) => {
        /*
         * Les tâches non terminées passent en premier.
         */
        if (firstTask.completed !== secondTask.completed) {
          return Number(firstTask.completed) - Number(secondTask.completed);
        }

        /*
         * Les tâches avec une date passent avant celles sans date.
         */
        if (firstTask.dueDate && !secondTask.dueDate) {
          return -1;
        }

        if (!firstTask.dueDate && secondTask.dueDate) {
          return 1;
        }

        /*
         * Les dates les plus proches passent en premier.
         */
        if (firstTask.dueDate && secondTask.dueDate) {
          return firstTask.dueDate.localeCompare(secondTask.dueDate);
        }

        return secondTask.createdAt.localeCompare(firstTask.createdAt);
      });
  }, [tasks, filter, search]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setEditingTaskId(null);
  }

  function openCreateForm() {
    resetForm();
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    resetForm();
  }

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  const cleanTitle = title.trim();
  const cleanDescription = description.trim();

  if (!cleanTitle || !userId || isSaving) {
    return;
  }

  setIsSaving(true);
  setErrorMessage("");

  try {
    if (editingTaskId) {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          title: cleanTitle,
          description: cleanDescription,
          priority,
          due_date: dueDate || null,
        })
        .eq("id", editingTaskId)
        .eq("user_id", userId)
        .select(`
          id,
          user_id,
          title,
          description,
          priority,
          due_date,
          completed,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        throw error;
      }

      const updatedTask = databaseTaskToTask(
        data as DatabaseTask,
      );

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? updatedTask
            : task,
        ),
      );
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: cleanTitle,
          description: cleanDescription,
          priority,
          due_date: dueDate || null,
          completed: false,
        })
        .select(`
          id,
          user_id,
          title,
          description,
          priority,
          due_date,
          completed,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        throw error;
      }

      const newTask = databaseTaskToTask(
        data as DatabaseTask,
      );

      setTasks((currentTasks) => [
        newTask,
        ...currentTasks,
      ]);
    }

    closeForm();
  } catch (error) {
    console.error(
      "Impossible d’enregistrer la tâche :",
      error,
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Impossible d’enregistrer la tâche.",
    );
  } finally {
    setIsSaving(false);
  }
}

  async function toggleTask(taskId: string) {
  if (!userId) {
    return;
  }

  const task = tasks.find(
    (currentTask) => currentTask.id === taskId,
  );

  if (!task) {
    return;
  }

  const newCompletedValue = !task.completed;

  setErrorMessage("");

  const { error } = await supabase
    .from("tasks")
    .update({
      completed: newCompletedValue,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    console.error(
      "Impossible de modifier la tâche :",
      error,
    );

    setErrorMessage(
      `Impossible de modifier la tâche : ${error.message}`,
    );

    return;
  }

  setTasks((currentTasks) =>
    currentTasks.map((currentTask) =>
      currentTask.id === taskId
        ? {
            ...currentTask,
            completed: newCompletedValue,
          }
        : currentTask,
    ),
  );
}

  function editTask(task: Task) {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setIsFormOpen(true);
  }

  async function deleteTask(taskId: string) {
  if (!userId) {
    return;
  }

  const confirmation = window.confirm(
    "Veux-tu vraiment supprimer cette tâche ?",
  );

  if (!confirmation) {
    return;
  }

  setErrorMessage("");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) {
    console.error(
      "Impossible de supprimer la tâche :",
      error,
    );

    setErrorMessage(
      `Impossible de supprimer la tâche : ${error.message}`,
    );

    return;
  }

  setTasks((currentTasks) =>
    currentTasks.filter(
      (task) => task.id !== taskId,
    ),
  );
}

  async function deleteCompletedTasks() {
  if (
    stats.completed === 0 ||
    !userId
  ) {
    return;
  }

  const confirmation = window.confirm(
    `Supprimer les ${stats.completed} tâche(s) terminée(s) ?`,
  );

  if (!confirmation) {
    return;
  }

  setErrorMessage("");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .eq("completed", true);

  if (error) {
    console.error(
      "Impossible de nettoyer les tâches :",
      error,
    );

    setErrorMessage(
      `Impossible de nettoyer les tâches : ${error.message}`,
    );

    return;
  }

  setTasks((currentTasks) =>
    currentTasks.filter(
      (task) => !task.completed,
    ),
  );
}

  return (
    <div className="mx-auto min-w-0 w-full max-w-7xl overflow-x-hidden pb-24 sm:pb-0">
      {/* En-tête de la page */}
      <header className="mb-5 min-w-0 sm:mb-8 sm:flex sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Organisation
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            To-do
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Centralise tes tâches, organise tes priorités et garde une vision
            claire de ce que tu dois accomplir.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="hidden min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-[0.98] sm:flex sm:w-auto"
        >
          <span className="text-lg leading-none">+</span>
          Nouvelle tâche
        </button>
      </header>

{errorMessage && (
  <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
    {errorMessage}
  </div>
)}

      {/* Cartes de statistiques */}
      <section className="mb-5 grid min-w-0 grid-cols-2 gap-2 sm:mb-6 sm:gap-3 lg:grid-cols-4">
        <StatCard
          label="Toutes"
          value={stats.total}
          description="Tâches enregistrées"
        />

        <StatCard
          label="À faire"
          value={stats.remaining}
          description="Tâches restantes"
        />

        <StatCard
          label="Aujourd’hui"
          value={stats.dueToday}
          description="À terminer ce jour"
        />

        <StatCard
          label="Terminées"
          value={stats.completed}
          description="Tâches accomplies"
        />
      </section>

      <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
        {/* Filtres */}
        <aside className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/50 p-2 sm:p-3 xl:sticky xl:top-8 xl:h-fit">
          <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Affichage
          </p>

          <div className="-mx-2 flex min-w-0 gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
            <FilterButton
              active={filter === "all"}
              label="Toutes"
              count={stats.total}
              onClick={() => setFilter("all")}
            />

            <FilterButton
              active={filter === "today"}
              label="Aujourd’hui"
              count={stats.dueToday}
              onClick={() => setFilter("today")}
            />

            <FilterButton
              active={filter === "upcoming"}
              label="À venir"
              onClick={() => setFilter("upcoming")}
            />

            <FilterButton
              active={filter === "completed"}
              label="Terminées"
              count={stats.completed}
              onClick={() => setFilter("completed")}
            />

            {/* Espace de fin pour que le dernier filtre ne soit pas coupé sur mobile. */}
            <span aria-hidden="true" className="w-2 shrink-0 xl:hidden" />
          </div>

          <div className="mt-3 hidden border-t border-slate-800 px-3 pt-4 xl:block">
            <p className="text-xs leading-5 text-slate-500">
            
            </p>
          </div>
        </aside>

        {/* Liste principale */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 p-3 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {getFilterTitle(filter)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredTasks.length} tâche
                {filteredTasks.length !== 1 ? "s" : ""} affichée
                {filteredTasks.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une tâche..."
                className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 sm:w-72"
              />

              {stats.completed > 0 && (
                <button
                  type="button"
                  onClick={deleteCompletedTasks}
                  className="min-h-11 w-full rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white sm:w-auto"
                >
                  Nettoyer
                </button>
              )}
            </div>
          </div>

          {!isLoaded ? (
            <LoadingState />
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              hasTasks={tasks.length > 0}
              onCreate={openCreateForm}
            />
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onEdit={() => editTask(task)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bouton flottant uniquement sur téléphone */}
      <button
        type="button"
        onClick={openCreateForm}
        aria-label="Créer une nouvelle tâche"
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-3xl font-light text-white shadow-xl shadow-indigo-950/40 transition active:scale-95 sm:hidden"
      >
        +
      </button>

      {/* Fenêtre de création ou modification */}
      {isFormOpen && (
        <TaskForm
          title={title}
          description={description}
          priority={priority}
          dueDate={dueDate}
          editing={editingTaskId !== null}
          isSaving={isSaving}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onPriorityChange={setPriority}
          onDueDateChange={setDueDate}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  description: string;
};

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/50 p-3 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-4xl">
        {value}
      </p>

      <p className="mt-1 hidden text-xs text-slate-500 sm:block">
        {description}
      </p>
    </article>
  );
}

type FilterButtonProps = {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
};

function FilterButton({
  active,
  label,
  count,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition sm:px-4 xl:w-full ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span>{label}</span>

      {typeof count === "number" && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active
              ? "bg-white/15 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

type TaskCardProps = {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const today = getToday();
  const overdue =
    Boolean(task.dueDate) && task.dueDate < today && !task.completed;

  const dueToday =
    Boolean(task.dueDate) && task.dueDate === today && !task.completed;

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl border p-3 transition sm:p-5 ${
        task.completed
          ? "border-slate-800 bg-slate-900/30 opacity-70"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            task.completed
              ? "Marquer comme non terminée"
              : "Marquer comme terminée"
          }
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
            task.completed
              ? "border-indigo-500 bg-indigo-500 text-white"
              : "border-slate-600 hover:border-indigo-400"
          }`}
        >
          {task.completed && (
            <span className="text-xs font-bold leading-none">✓</span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3
                className={`break-words text-base font-semibold ${
                  task.completed
                    ? "text-slate-500 line-through"
                    : "text-white"
                }`}
              >
                {task.title}
              </h3>

              {task.description && (
                <p
                  className={`mt-1 whitespace-pre-wrap break-words text-sm leading-6 ${
                    task.completed ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            <span
              className={`w-fit shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${priorityStyles[task.priority]}`}
            >
              {priorityLabels[task.priority]}
            </span>
          </div>

          <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {task.dueDate && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    overdue
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                      : dueToday
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                  }`}
                >
                  {overdue
                    ? `En retard · ${formatDate(task.dueDate)}`
                    : dueToday
                      ? "Aujourd’hui"
                      : formatDate(task.dueDate)}
                </span>
              )}

              {task.completed && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                  Terminée
                </span>
              )}
            </div>

            <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg px-3 py-2 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
              >
                Modifier
              </button>

              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg px-3 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

type EmptyStateProps = {
  hasTasks: boolean;
  onCreate: () => void;
};

function EmptyState({ hasTasks, onCreate }: EmptyStateProps) {
  return (
    <div className="flex min-h-72 min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 px-4 py-10 text-center sm:min-h-80 sm:px-6 sm:py-12">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-2xl text-indigo-400">
        ✓
      </div>

      <h3 className="text-lg font-bold text-white">
        {hasTasks ? "Aucune tâche trouvée" : "Ta liste est vide"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {hasTasks
          ? "Modifie ta recherche ou sélectionne une autre catégorie."
          : "Ajoute une première tâche pour commencer à organiser ton travail."}
      </p>

      {!hasTasks && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Créer ma première tâche
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <p className="text-sm text-slate-500">Chargement des tâches...</p>
    </div>
  );
}

type TaskFormProps = {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  editing: boolean;
  isSaving: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: Priority) => void;
  onDueDateChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

function TaskForm({
  title,
  description,
  priority,
  dueDate,
  editing,
  isSaving,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onDueDateChange,
  onSubmit,
  onClose,
}: TaskFormProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden bg-black/60 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-10 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[calc(100dvh-3rem-env(safe-area-inset-bottom))] min-w-0 w-full overflow-y-auto overscroll-contain rounded-3xl border border-slate-700 bg-slate-950 p-4 shadow-2xl sm:max-h-[92vh] sm:max-w-xl sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-400">
              Veyra OS
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {editing ? "Modifier la tâche" : "Nouvelle tâche"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le formulaire"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xl text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="min-w-0 space-y-5">
          <div>
            <label
              htmlFor="task-title"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Nom de la tâche
            </label>

            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              maxLength={120}
              required
              autoFocus
              placeholder="Exemple : Terminer la page To-do"
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
            />

            <p className="mt-1 text-right text-xs text-slate-600">
              {title.length}/120
            </p>
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Description{" "}
              <span className="font-normal text-slate-500">
                facultative
              </span>
            </label>

            <textarea
              id="task-description"
              value={description}
              onChange={(event) =>
                onDescriptionChange(event.target.value)
              }
              maxLength={500}
              rows={4}
              placeholder="Ajoute des informations utiles..."
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
            />
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-priority"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Priorité
              </label>

              <select
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  onPriorityChange(event.target.value as Priority)
                }
                className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-date"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Date limite
              </label>

              <input
                id="task-date"
                type="date"
                value={dueDate}
                onChange={(event) =>
                  onDueDateChange(event.target.value)
                }
                className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white sm:w-auto"
            >
              Annuler
            </button>

            <button
  type="submit"
  disabled={!title.trim() || isSaving}
  className="min-h-12 w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
>
  {isSaving
    ? "Enregistrement..."
    : editing
      ? "Enregistrer"
      : "Ajouter la tâche"}
</button>
          </div>
        </form>
      </div>
    </div>
  );
}