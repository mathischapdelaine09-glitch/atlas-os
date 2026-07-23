"use client";

import { useEffect, useState } from "react";

import {
  createProject,
  deleteProject,
  getProjects,
} from "@/lib/projects/project-service";

import type { Project } from "@/types/project";

export default function SupabaseProjectsTestPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  async function loadProjects() {
    try {
      setErrorMessage("");

      const projectsFromSupabase = await getProjects();

      setProjects(projectsFromSupabase);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  async function handleCreateProject(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage("Écris le nom de ton projet.");
      return;
    }

    try {
      setErrorMessage("");
      setIsCreating(true);

      const newProject = await createProject({
        title,
        description: "Projet créé depuis la page de test VeyraOS.",
        status: "not_started",
        priority: "medium",
        progress: 0,
      });

      setProjects((currentProjects) => [
        newProject,
        ...currentProjects,
      ]);

      setTitle("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de créer le projet."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    try {
      setErrorMessage("");

      await deleteProject(projectId);

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== projectId
        )
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le projet."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
            Test Supabase
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Projets VeyraOS
          </h1>

          <p className="mt-3 text-slate-400">
            Cette page vérifie la création, la lecture et la
            suppression des projets dans Supabase.
          </p>
        </div>

        <form
          onSubmit={handleCreateProject}
          className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row"
        >
          <input
            type="text"
            placeholder="Nom du nouveau projet"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Création..." : "Créer le projet"}
          </button>
        </form>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <p className="text-slate-400">
            Chargement des projets...
          </p>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center text-slate-400">
            Aucun projet enregistré dans Supabase.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <article
                key={project.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div>
                  <h2 className="text-lg font-bold">
                    {project.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {project.description || "Aucune description"}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Progression : {project.progress} %
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleDeleteProject(project.id)
                  }
                  className="shrink-0 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  Supprimer
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}