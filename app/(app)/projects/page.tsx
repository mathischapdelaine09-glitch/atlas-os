import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type {
  Project,
  ProjectPriority,
  ProjectStatus,
} from "@/types/project";

const allowedStatuses: ProjectStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "archived",
];

const allowedPriorities: ProjectPriority[] = [
  "low",
  "medium",
  "high",
];

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data, error } = await supabase
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
    });

  if (error) {
    throw new Error(
      `Impossible de récupérer les projets : ${error.message}`
    );
  }

  const projects = (data ?? []) as Project[];

  async function createProjectAction(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const title = String(
      formData.get("title") ?? ""
    ).trim();

    const description = String(
      formData.get("description") ?? ""
    ).trim();

    const rawStatus = String(
      formData.get("status") ?? "not_started"
    );

    const rawPriority = String(
      formData.get("priority") ?? "medium"
    );

    const rawBudget = String(
      formData.get("budget") ?? ""
    ).trim();

    const rawDueDate = String(
      formData.get("due_date") ?? ""
    ).trim();

    if (!title) {
      return;
    }

    const status: ProjectStatus =
      allowedStatuses.includes(
        rawStatus as ProjectStatus
      )
        ? (rawStatus as ProjectStatus)
        : "not_started";

    const priority: ProjectPriority =
      allowedPriorities.includes(
        rawPriority as ProjectPriority
      )
        ? (rawPriority as ProjectPriority)
        : "medium";

    let budget: number | null = null;

    if (rawBudget !== "") {
      const parsedBudget = Number(rawBudget);

      if (
        Number.isFinite(parsedBudget) &&
        parsedBudget >= 0
      ) {
        budget = parsedBudget;
      }
    }

    const initialProgress =
      status === "completed"
        ? 100
        : status === "in_progress"
          ? 25
          : 0;

    const { error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title,
        description,
        status,
        priority,
        progress: initialProgress,
        budget,
        due_date: rawDueDate || null,
      });

    if (error) {
      throw new Error(
        `Impossible de créer le projet : ${error.message}`
      );
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  async function updateProgressAction(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const projectId = String(
      formData.get("id") ?? ""
    );

    const rawProgress = Number(
      formData.get("progress")
    );

    if (
      !projectId ||
      !Number.isFinite(rawProgress)
    ) {
      return;
    }

    const progress = Math.min(
      100,
      Math.max(0, Math.round(rawProgress))
    );

    const status: ProjectStatus =
      progress === 100
        ? "completed"
        : progress === 0
          ? "not_started"
          : "in_progress";

    const { error } = await supabase
      .from("projects")
      .update({
        progress,
        status,
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(
        `Impossible de modifier le projet : ${error.message}`
      );
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  async function updateStatusAction(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const projectId = String(
      formData.get("id") ?? ""
    );

    const rawStatus = String(
      formData.get("status") ?? ""
    );

    if (
      !projectId ||
      !allowedStatuses.includes(
        rawStatus as ProjectStatus
      )
    ) {
      return;
    }

    const status =
      rawStatus as ProjectStatus;

    const update: {
      status: ProjectStatus;
      progress?: number;
    } = {
      status,
    };

    if (status === "not_started") {
      update.progress = 0;
    }

    if (status === "completed") {
      update.progress = 100;
    }

    const { error } = await supabase
      .from("projects")
      .update(update)
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(
        `Impossible de modifier le statut : ${error.message}`
      );
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  async function deleteProjectAction(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const projectId = String(
      formData.get("id") ?? ""
    );

    if (!projectId) {
      return;
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(
        `Impossible de supprimer le projet : ${error.message}`
      );
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  const activeProjects = projects.filter(
    (project) =>
      project.status === "not_started" ||
      project.status === "in_progress"
  );

  const completedProjects = projects.filter(
    (project) =>
      project.status === "completed"
  );

  const archivedProjects = projects.filter(
    (project) =>
      project.status === "archived"
  );

  const averageProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce(
            (total, project) =>
              total + project.progress,
            0
          ) / projects.length
        );

  const totalBudget = projects.reduce(
    (total, project) =>
      total + (project.budget ?? 0),
    0
  );

  return (
    <div className="w-full space-y-6 md:space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
          Centre de pilotage
        </p>

        <h1 className="mt-2 break-words text-3xl font-black text-white sm:text-4xl">
          Mes projets
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Centralise tes objectifs et suis leur
          progression sans avoir à les déplacer entre
          plusieurs petites colonnes.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Projets actifs"
          value={activeProjects.length.toString()}
        />

        <StatCard
          label="Terminés"
          value={completedProjects.length.toString()}
        />

        <StatCard
          label="Progression moyenne"
          value={`${averageProgress} %`}
        />

        <StatCard
          label="Budget total"
          value={formatMoney(totalBudget)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)] xl:items-start">
        <aside className="h-fit min-w-0 rounded-3xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5 xl:sticky xl:top-8">
          <h2 className="text-lg font-bold text-white">
            Nouveau projet
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Commence avec les informations essentielles.
          </p>

          <form
            action={createProjectAction}
            className="mt-5 space-y-4"
          >
            <FormField
              label="Titre"
              htmlFor="project-title"
            >
              <input
                id="project-title"
                name="title"
                type="text"
                required
                placeholder="Ex : Lancer Veyra Calendar"
                className={inputClassName}
              />
            </FormField>

            <FormField
              label="Description"
              htmlFor="project-description"
            >
              <textarea
                id="project-description"
                name="description"
                rows={4}
                placeholder="Objectif et détails du projet..."
                className={`${inputClassName} resize-none`}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label="Statut"
                htmlFor="project-status"
              >
                <select
                  id="project-status"
                  name="status"
                  defaultValue="not_started"
                  className={inputClassName}
                >
                  <option value="not_started">
                    À préparer
                  </option>

                  <option value="in_progress">
                    En cours
                  </option>

                  <option value="completed">
                    Terminé
                  </option>
                </select>
              </FormField>

              <FormField
                label="Priorité"
                htmlFor="project-priority"
              >
                <select
                  id="project-priority"
                  name="priority"
                  defaultValue="medium"
                  className={inputClassName}
                >
                  <option value="low">
                    Basse
                  </option>

                  <option value="medium">
                    Normale
                  </option>

                  <option value="high">
                    Haute
                  </option>
                </select>
              </FormField>
            </div>

            <FormField
              label="Budget"
              htmlFor="project-budget"
            >
              <input
                id="project-budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex : 500"
                className={inputClassName}
              />
            </FormField>

            <FormField
              label="Échéance"
              htmlFor="project-due-date"
            >
              <input
                id="project-due-date"
                name="due_date"
                type="date"
                className={inputClassName}
              />
            </FormField>

            <button
              type="submit"
              className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
            >
              Créer le projet
            </button>
          </form>
        </aside>

        <div className="min-w-0 space-y-8">
          <ProjectSection
            title="Projets actifs"
            description="Les projets à préparer ou actuellement en cours."
            projects={activeProjects}
            emptyText="Aucun projet actif pour le moment."
            updateProgressAction={
              updateProgressAction
            }
            updateStatusAction={
              updateStatusAction
            }
            deleteProjectAction={
              deleteProjectAction
            }
          />

          <ProjectSection
            title="Projets terminés"
            description="Les projets dont la progression a atteint 100 %."
            projects={completedProjects}
            emptyText="Tu n’as encore terminé aucun projet."
            updateProgressAction={
              updateProgressAction
            }
            updateStatusAction={
              updateStatusAction
            }
            deleteProjectAction={
              deleteProjectAction
            }
          />

          {archivedProjects.length > 0 && (
            <ProjectSection
              title="Archives"
              description="Les projets que tu souhaites conserver sans les afficher parmi les projets actifs."
              projects={archivedProjects}
              emptyText="Aucun projet archivé."
              updateProgressAction={
                updateProgressAction
              }
              updateStatusAction={
                updateStatusAction
              }
              deleteProjectAction={
                deleteProjectAction
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}

const inputClassName =
  "min-h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/40 p-3 sm:p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-white sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-slate-400"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function ProjectSection({
  title,
  description,
  projects,
  emptyText,
  updateProgressAction,
  updateStatusAction,
  deleteProjectAction,
}: {
  title: string;
  description: string;
  projects: Project[];
  emptyText: string;
  updateProgressAction: (
    formData: FormData
  ) => Promise<void>;
  updateStatusAction: (
    formData: FormData
  ) => Promise<void>;
  deleteProjectAction: (
    formData: FormData
  ) => Promise<void>;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start justify-between gap-3 sm:items-end">
        <div>
          <h2 className="text-xl font-bold text-white">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
          {projects.length}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-500 sm:py-14">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              updateProgressAction={
                updateProgressAction
              }
              updateStatusAction={
                updateStatusAction
              }
              deleteProjectAction={
                deleteProjectAction
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectCard({
  project,
  updateProgressAction,
  updateStatusAction,
  deleteProjectAction,
}: {
  project: Project;
  updateProgressAction: (
    formData: FormData
  ) => Promise<void>;
  updateStatusAction: (
    formData: FormData
  ) => Promise<void>;
  deleteProjectAction: (
    formData: FormData
  ) => Promise<void>;
}) {
  return (
    <article className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-slate-700 sm:p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={project.status} />

            <PriorityBadge
              priority={project.priority}
            />

            {project.due_date && (
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">
                Échéance :{" "}
                {formatDate(project.due_date)}
              </span>
            )}
          </div>

          <h3 className="mt-4 break-words text-lg font-bold text-white">
            {project.title}
          </h3>

          <p className="mt-2 break-words text-sm leading-6 text-slate-400">
            {project.description ||
              "Aucune description renseignée."}
          </p>

          <div className="mt-5">
            <div className="mb-2 flex justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Progression
              </span>

              <span className="text-sm font-bold text-white">
                {project.progress} %
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{
                  width: `${project.progress}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-5">
            <span>
              Budget :{" "}
              <strong className="text-slate-300">
                {project.budget === null
                  ? "Non défini"
                  : formatMoney(project.budget)}
              </strong>
            </span>

            <span>
              Créé le{" "}
              <strong className="text-slate-300">
                {formatDate(project.created_at)}
              </strong>
            </span>
          </div>
        </div>

        <div className="w-full min-w-0 space-y-3 lg:w-56 lg:shrink-0">
          <form
            action={updateProgressAction}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4"
          >
            <input
              type="hidden"
              name="id"
              value={project.id}
            />

            <label
              htmlFor={`progress-${project.id}`}
              className="mb-2 block text-xs font-semibold text-slate-500"
            >
              Avancement
            </label>

            <div className="flex min-w-0 gap-2">
              <input
                id={`progress-${project.id}`}
                name="progress"
                type="number"
                min="0"
                max="100"
                defaultValue={project.progress}
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                className="min-h-10 shrink-0 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-500"
              >
                %
              </button>
            </div>
          </form>

          <form
            action={updateStatusAction}
            className="space-y-2"
          >
            <input
              type="hidden"
              name="id"
              value={project.id}
            />

            <select
              name="status"
              defaultValue={project.status}
              className={inputClassName}
            >
              <option value="not_started">
                À préparer
              </option>

              <option value="in_progress">
                En cours
              </option>

              <option value="completed">
                Terminé
              </option>

              <option value="archived">
                Archivé
              </option>
            </select>

            <button
              type="submit"
              className="min-h-10 w-full rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              Modifier le statut
            </button>
          </form>

          <form action={deleteProjectAction}>
            <input
              type="hidden"
              name="id"
              value={project.id}
            />

            <button
              type="submit"
              className="min-h-10 w-full rounded-xl border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10"
            >
              Supprimer
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: ProjectStatus;
}) {
  const styles: Record<
    ProjectStatus,
    {
      label: string;
      className: string;
    }
  > = {
    not_started: {
      label: "À préparer",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-300",
    },

    in_progress: {
      label: "En cours",
      className:
        "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
    },

    completed: {
      label: "Terminé",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    },

    archived: {
      label: "Archivé",
      className:
        "border-slate-600 bg-slate-800 text-slate-400",
    },
  };

  const style = styles[status];

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: ProjectPriority;
}) {
  const labels: Record<
    ProjectPriority,
    string
  > = {
    low: "Priorité basse",
    medium: "Priorité normale",
    high: "Priorité haute",
  };

  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">
      {labels[priority]}
    </span>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}