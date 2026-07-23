import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type {
  Note,
  NoteCategory,
} from "@/types/note";

// =========================================================
// OUTILS
// =========================================================

function isNoteCategory(
  value: FormDataEntryValue | null
): value is NoteCategory {
  return (
    value === "Général" ||
    value === "Idées" ||
    value === "Urgent" ||
    value === "Procédures"
  );
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

export async function addNoteAction(
  formData: FormData
) {
  "use server";

  const { supabase, user } =
    await getAuthenticatedUser();

  const rawTitle = formData.get("title");
  const rawContent = formData.get("content");
  const rawCategory =
    formData.get("category");

  const title =
    typeof rawTitle === "string"
      ? rawTitle.trim()
      : "";

  const content =
    typeof rawContent === "string"
      ? rawContent.trim()
      : "";

  if (!title) {
    throw new Error(
      "Le titre de la note est obligatoire."
    );
  }

  if (title.length > 150) {
    throw new Error(
      "Le titre ne peut pas dépasser 150 caractères."
    );
  }

  if (!content) {
    throw new Error(
      "Le contenu de la note est obligatoire."
    );
  }

  if (!isNoteCategory(rawCategory)) {
    throw new Error(
      "La catégorie sélectionnée est invalide."
    );
  }

  const { error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title,
      content,
      category: rawCategory,
    });

  if (error) {
    throw new Error(
      `Impossible d’ajouter la note : ${error.message}`
    );
  }

  revalidatePath("/notes");
  revalidatePath("/dashboard");
}

export async function updateNoteAction(
  formData: FormData
) {
  "use server";

  const { supabase, user } =
    await getAuthenticatedUser();

  const rawId = formData.get("id");
  const rawTitle = formData.get("title");
  const rawContent = formData.get("content");
  const rawCategory =
    formData.get("category");

  const id =
    typeof rawId === "string"
      ? rawId
      : "";

  const title =
    typeof rawTitle === "string"
      ? rawTitle.trim()
      : "";

  const content =
    typeof rawContent === "string"
      ? rawContent.trim()
      : "";

  if (!id) {
    throw new Error(
      "Identifiant de note manquant."
    );
  }

  if (!title) {
    throw new Error(
      "Le titre de la note est obligatoire."
    );
  }

  if (title.length > 150) {
    throw new Error(
      "Le titre ne peut pas dépasser 150 caractères."
    );
  }

  if (!content) {
    throw new Error(
      "Le contenu de la note est obligatoire."
    );
  }

  if (!isNoteCategory(rawCategory)) {
    throw new Error(
      "La catégorie sélectionnée est invalide."
    );
  }

  const { error } = await supabase
    .from("notes")
    .update({
      title,
      content,
      category: rawCategory,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(
      `Impossible de modifier la note : ${error.message}`
    );
  }

  revalidatePath("/notes");
  revalidatePath("/dashboard");

  redirect("/notes");
}

export async function deleteNoteAction(
  formData: FormData
) {
  "use server";

  const { supabase, user } =
    await getAuthenticatedUser();

  const rawId = formData.get("id");

  const id =
    typeof rawId === "string"
      ? rawId
      : "";

  if (!id) {
    throw new Error(
      "Identifiant de note manquant."
    );
  }

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(
      `Impossible de supprimer la note : ${error.message}`
    );
  }

  revalidatePath("/notes");
  revalidatePath("/dashboard");
}

// =========================================================
// PAGE
// =========================================================

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{
    editId?: string;
    category?: string;
  }>;
}) {
  const { editId, category } =
    await searchParams;

  const { supabase, user } =
    await getAuthenticatedUser();

  let notesQuery = supabase
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
    });

  if (
    category &&
    isNoteCategory(category)
  ) {
    notesQuery = notesQuery.eq(
      "category",
      category
    );
  }

  const { data, error } =
    await notesQuery;

  if (error) {
    throw new Error(
      `Impossible de récupérer les notes : ${error.message}`
    );
  }

  const notes =
    (data ?? []) as Note[];

  const activeCategory =
    category && isNoteCategory(category)
      ? category
      : null;

  const editedNote =
    editId
      ? notes.find(
          (note) => note.id === editId
        )
      : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 text-white md:p-6">
      {/* EN-TÊTE */}

      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-7 md:p-9">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            AtlasOS Notes
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Bloc-notes et documentation
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Capture tes idées, tes procédures,
            tes rappels et toutes les informations
            que tu veux retrouver rapidement.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-2 text-xs text-slate-400">
              <span className="font-bold text-white">
                {notes.length}
              </span>{" "}
              note
              {notes.length > 1 ? "s" : ""}
              {activeCategory
                ? ` dans ${activeCategory}`
                : ""}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </section>

      {/* FORMULAIRE */}

      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Nouvelle note
          </p>

          <h2 className="mt-2 text-xl font-bold">
            Capture une information
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            La note sera enregistrée dans ton
            espace Supabase personnel.
          </p>
        </div>

        <form
          action={addNoteAction}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label
                htmlFor="note-title"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Titre
              </label>

              <input
                id="note-title"
                name="title"
                required
                maxLength={150}
                placeholder="Titre de la note..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="note-category"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Catégorie
              </label>

              <select
                id="note-category"
                name="category"
                defaultValue="Général"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500"
              >
                <option value="Général">
                  📌 Général
                </option>

                <option value="Idées">
                  💡 Idées
                </option>

                <option value="Urgent">
                  🚨 Urgent
                </option>

                <option value="Procédures">
                  🛠️ Procédures
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="note-content"
              className="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Contenu
            </label>

            <textarea
              id="note-content"
              name="content"
              rows={5}
              required
              placeholder="Écris ton contenu ici..."
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Enregistrer la note
          </button>
        </form>
      </section>

      {/* FILTRES */}

      <section className="flex flex-wrap gap-2">
        <CategoryFilterLink
          href="/notes"
          label="Toutes"
          active={!activeCategory}
        />

        <CategoryFilterLink
          href="/notes?category=Général"
          label="📌 Général"
          active={
            activeCategory === "Général"
          }
        />

        <CategoryFilterLink
          href="/notes?category=Idées"
          label="💡 Idées"
          active={
            activeCategory === "Idées"
          }
        />

        <CategoryFilterLink
          href="/notes?category=Urgent"
          label="🚨 Urgent"
          active={
            activeCategory === "Urgent"
          }
        />

        <CategoryFilterLink
          href="/notes?category=Procédures"
          label="🛠️ Procédures"
          active={
            activeCategory === "Procédures"
          }
        />
      </section>

      {/* FORMULAIRE D’ÉDITION */}

      {editId && editedNote && (
        <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Modification
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Modifier la note
              </h2>
            </div>

            <Link
              href="/notes"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:text-white"
            >
              Fermer
            </Link>
          </div>

          <form
            action={updateNoteAction}
            className="space-y-4"
          >
            <input
              type="hidden"
              name="id"
              value={editedNote.id}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label
                  htmlFor="edit-note-title"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Titre
                </label>

                <input
                  id="edit-note-title"
                  name="title"
                  defaultValue={
                    editedNote.title
                  }
                  required
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-note-category"
                  className="mb-1.5 block text-xs font-medium text-slate-400"
                >
                  Catégorie
                </label>

                <select
                  id="edit-note-category"
                  name="category"
                  defaultValue={
                    editedNote.category
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="Général">
                    📌 Général
                  </option>

                  <option value="Idées">
                    💡 Idées
                  </option>

                  <option value="Urgent">
                    🚨 Urgent
                  </option>

                  <option value="Procédures">
                    🛠️ Procédures
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-note-content"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Contenu
              </label>

              <textarea
                id="edit-note-content"
                name="content"
                rows={7}
                defaultValue={
                  editedNote.content
                }
                required
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Sauvegarder
              </button>

              <Link
                href="/notes"
                className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Annuler
              </Link>
            </div>
          </form>
        </section>
      )}

      {editId && !editedNote && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          Cette note est introuvable ou ne
          t’appartient pas.
        </div>
      )}

      {/* LISTE */}

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bibliothèque
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Tes notes
            </h2>
          </div>
        </div>

        {notes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <article
                key={note.id}
                className="group flex min-h-64 flex-col justify-between rounded-3xl border border-slate-700/60 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-slate-600"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <CategoryBadge
                      category={note.category}
                    />

                    <span className="text-[10px] text-slate-600">
                      {formatDate(
                        note.updated_at
                      )}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-white">
                    {note.title}
                  </h3>

                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-400 line-clamp-6">
                    {note.content}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                  <Link
                    href={`/notes?editId=${note.id}`}
                    className="text-xs font-semibold text-indigo-400 transition hover:text-indigo-300"
                  >
                    Modifier
                  </Link>

                  <form
                    action={deleteNoteAction}
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={note.id}
                    />

                    <button
                      type="submit"
                      className="cursor-pointer text-xs font-semibold text-rose-400 transition hover:text-rose-300"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-white">
              Aucune note
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Crée ta première note avec le
              formulaire situé au-dessus.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// =========================================================
// COMPOSANTS
// =========================================================

function CategoryFilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
        active
          ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
          : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

function CategoryBadge({
  category,
}: {
  category: NoteCategory;
}) {
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

  const icons = {
    Général: "📌",
    Idées: "💡",
    Urgent: "🚨",
    Procédures: "🛠️",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${styles[category]}`}
    >
      {icons[category]} {category}
    </span>
  );
}

// =========================================================
// FORMATAGE
// =========================================================

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}