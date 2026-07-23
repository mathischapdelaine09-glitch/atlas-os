import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "@/types/project";

import { createClient } from "@/lib/supabase/client";

/**
 * Récupère tous les projets de l'utilisateur connecté.
 */
export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Tu dois être connecté pour récupérer tes projets.");
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
        id,
        user_id,
        title,
        description,
        status,
        priority,
        progress,
        due_date,
        created_at,
        updated_at
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Project[];
}

/**
 * Crée un nouveau projet pour l'utilisateur connecté.
 */
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Tu dois être connecté pour créer un projet.");
  }

  const title = input.title.trim();

  if (!title) {
    throw new Error("Le titre du projet est obligatoire.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title,
      description: input.description?.trim() ?? "",
      status: input.status ?? "not_started",
      priority: input.priority ?? "medium",
      progress: input.progress ?? 0,
      due_date: input.due_date ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Project;
}

/**
 * Modifie un projet.
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Tu dois être connecté pour modifier un projet.");
  }

  const changes: UpdateProjectInput = {
    ...input,
  };

  if (typeof input.title === "string") {
    const title = input.title.trim();

    if (!title) {
      throw new Error("Le titre du projet ne peut pas être vide.");
    }

    changes.title = title;
  }

  if (typeof input.description === "string") {
    changes.description = input.description.trim();
  }

  const { data, error } = await supabase
    .from("projects")
    .update(changes)
    .eq("id", projectId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Project;
}

/**
 * Supprime un projet.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Tu dois être connecté pour supprimer un projet.");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}