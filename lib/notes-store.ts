export interface Note {
  id: string;
  title: string;
  content: string;
  category: "Général" | "Idées" | "Urgent" | "Procédures";
  updatedAt: string;
}

export const notesStore: Note[] = [
  {
    id: "1",
    title: "Bienvenue sur Veyra Notes",
    content: "Utilise cet espace pour noter tes idées, objectifs rapides ou mémo importants.",
    category: "Général",
    updatedAt: new Date().toLocaleDateString("fr-FR"),
  },
];