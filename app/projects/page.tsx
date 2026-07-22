import { revalidatePath } from "next/cache";
import { projectsStore } from "@/lib/projects-store";

export default async function ProjectsPage() {
  async function addProjectAction(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const status = (formData.get("status") as string) || "IN_PROGRESS";

    if (!title) return;

    projectsStore.unshift({
      id: Date.now().toString(),
      title,
      description,
      status,
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  async function updateStatusAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const newStatus = formData.get("newStatus") as string;

    const project = projectsStore.find((p) => p.id === id);
    if (project) {
      project.status = newStatus;
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  async function deleteProjectAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const index = projectsStore.findIndex((p) => p.id === id);
    if (index !== -1) {
      projectsStore.splice(index, 1);
    }

    revalidatePath("/projects");
    revalidatePath("/dashboard");
  }

  const todo = projectsStore.filter((p) => p.status === "TODO");
  const inProgress = projectsStore.filter((p) => p.status === "IN_PROGRESS");
  const done = projectsStore.filter((p) => p.status === "DONE");

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold text-white">🚀 Projets & Objectifs</h1>
        <p className="text-slate-400">Gère tes projets et suis leur progression.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-4 h-fit">
          <h2 className="text-lg font-bold text-white">➕ Nouveau Projet</h2>

          <form action={addProjectAction} className="space-y-3 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">Titre</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Ex: Refonte du site web"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Détails du projet..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 h-20"
              />
            </div>
{/* Champ Budget dans le formulaire de projet */}
<div className="space-y-1">
  <label className="text-xs text-slate-400 font-medium">Budget alloué (€)</label>
  <input
    type="number"
    name="budget"
    placeholder="ex: 1500"
    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
  />
</div>


            <div>
              <label className="block text-slate-400 mb-1">Statut initial</label>
              <select
                name="status"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="IN_PROGRESS">⚡ En cours</option>
                <option value="TODO">📌 À faire</option>
                <option value="DONE">✅ Terminé</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg transition"
            >
              Ajouter le projet
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* À FAIRE */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-amber-400 text-sm flex items-center justify-between">
              <span>📌 À FAIRE</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{todo.length}</span>
            </h3>
            {todo.map((p) => (
              <ProjectCard key={p.id} project={p} updateStatusAction={updateStatusAction} deleteProjectAction={deleteProjectAction} />
            ))}
          </div>

          {/* EN COURS */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-indigo-400 text-sm flex items-center justify-between">
              <span>⚡ EN COURS</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{inProgress.length}</span>
            </h3>
            {inProgress.map((p) => (
              <ProjectCard key={p.id} project={p} updateStatusAction={updateStatusAction} deleteProjectAction={deleteProjectAction} />
            ))}
          </div>

          {/* TERMINÉ */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-emerald-400 text-sm flex items-center justify-between">
              <span>✅ TERMINÉ</span>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">{done.length}</span>
            </h3>
            {done.map((p) => (
              <ProjectCard key={p.id} project={p} updateStatusAction={updateStatusAction} deleteProjectAction={deleteProjectAction} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  updateStatusAction,
  deleteProjectAction,
}: {
  project: { id: string; title: string; description: string; status: string };
  updateStatusAction: (formData: FormData) => Promise<void>;
  deleteProjectAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-lg space-y-2">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-white text-xs">{project.title}</h4>
        <form action={deleteProjectAction}>
          <input type="hidden" name="id" value={project.id} />
          <button type="submit" className="text-slate-500 hover:text-rose-400 text-xs transition">✕</button>
        </form>
      </div>

      {project.description && <p className="text-[11px] text-slate-400 line-clamp-2">{project.description}</p>}

      <div className="flex gap-1 pt-2 border-t border-slate-700/50 text-[10px]">
        {project.status !== "TODO" && (
          <form action={updateStatusAction} className="flex-1">
            <input type="hidden" name="id" value={project.id} />
            <input type="hidden" name="newStatus" value={project.status === "DONE" ? "IN_PROGRESS" : "TODO"} />
            <button type="submit" className="w-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 py-1 rounded text-center transition">
              ⬅️ Reculer
            </button>
          </form>
        )}

        {project.status !== "DONE" && (
          <form action={updateStatusAction} className="flex-1">
            <input type="hidden" name="id" value={project.id} />
            <input type="hidden" name="newStatus" value={project.status === "TODO" ? "IN_PROGRESS" : "DONE"} />
            <button type="submit" className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-white py-1 rounded text-center transition font-medium">
              Avancer ➡️
            </button>
          </form>
        )}
      </div>
    </div>
  );
}