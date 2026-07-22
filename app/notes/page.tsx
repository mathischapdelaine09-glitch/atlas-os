import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notesStore, Note } from "@/lib/notes-store";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ editId?: string }>;
}) {
  const { editId } = await searchParams;

  // Action : Ajouter une note
  async function addNoteAction(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = (formData.get("category") as Note["category"]) || "Général";

    if (!title || !content) return;

    notesStore.unshift({
      id: Date.now().toString(),
      title,
      content,
      category,
      updatedAt: new Date().toLocaleDateString("fr-FR"),
    });

    revalidatePath("/notes");
    revalidatePath("/dashboard");
  }

  // Action : Modifier une note existante
  async function updateNoteAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = (formData.get("category") as Note["category"]) || "Général";

    const note = notesStore.find((n) => n.id === id);
    if (note) {
      note.title = title;
      note.content = content;
      note.category = category;
      note.updatedAt = new Date().toLocaleDateString("fr-FR");
    }

    revalidatePath("/notes");
    revalidatePath("/dashboard");
    redirect("/notes"); // ⚡ Nettoie le paramètre de l'URL pour fermer le formulaire d'édition
  }

  // Action : Supprimer une note
  async function deleteNoteAction(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const index = notesStore.findIndex((n) => n.id === id);
    if (index !== -1) {
      notesStore.splice(index, 1);
    }

    revalidatePath("/notes");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-8 text-white max-w-5xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">📝 Bloc-Notes & Docs</h1>
        <p className="text-slate-400 text-sm mt-1">
          Capture tes idées, procédures et rappels au même endroit.
        </p>
      </div>

      {/* Formulaire de création */}
      <form
        action={addNoteAction}
        className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-4"
      >
        <h2 className="font-bold text-sm text-slate-300">➕ Nouvelle Note</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            name="title"
            placeholder="Titre de la note..."
            required
            className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <select
            name="category"
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value="Général">📌 Général</option>
            <option value="Idées">💡 Idées</option>
            <option value="Urgent">🚨 Urgent</option>
            <option value="Procédures">🛠️ Procédures</option>
          </select>
        </div>
        <textarea
          name="content"
          rows={3}
          placeholder="Écris ton contenu ici..."
          required
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
        >
          Enregistrer la note
        </button>
      </form>

      {/* Grille des Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notesStore.length > 0 ? (
          notesStore.map((note) => {
            const isEditing = editId === note.id;

            return (
              <div
                key={note.id}
                className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl flex flex-col justify-between space-y-3"
              >
                {isEditing ? (
                  /* Formulaire d'édition */
                  <form action={updateNoteAction} className="space-y-3">
                    <input type="hidden" name="id" value={note.id} />

                    <input
                      name="title"
                      defaultValue={note.title}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold"
                    />

                    <select
                      name="category"
                      defaultValue={note.category}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      <option value="Général">📌 Général</option>
                      <option value="Idées">💡 Idées</option>
                      <option value="Urgent">🚨 Urgent</option>
                      <option value="Procédures">🛠️ Procédures</option>
                    </select>

                    <textarea
                      name="content"
                      rows={4}
                      defaultValue={note.content}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-1.5 rounded-lg transition cursor-pointer"
                      >
                        💾 Sauvegarder
                      </button>
                      <a
                        href="/notes"
                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition flex items-center justify-center"
                      >
                        Annuler
                      </a>
                    </div>
                  </form>
                ) : (
                  /* Vue standard */
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base text-white">{note.title}</h3>
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          {note.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-line line-clamp-4">
                        {note.content}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-700/40">
                      <span className="text-[10px] text-slate-500">{note.updatedAt}</span>

                      <div className="flex items-center gap-3">
                        <a
                          href={`/notes?editId=${note.id}`}
                          className="text-[11px] text-indigo-400 hover:underline"
                        >
                          ✏️ Modifier
                        </a>
                        <form action={deleteNoteAction}>
                          <input type="hidden" name="id" value={note.id} />
                          <button
                            type="submit"
                            className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500 col-span-full py-8 text-center">
            Aucune note enregistrée pour l'instant.
          </p>
        )}
      </div>
    </div>
  );
}