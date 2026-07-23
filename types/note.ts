export type NoteCategory =
  | "Général"
  | "Idées"
  | "Urgent"
  | "Procédures";

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: NoteCategory;
  created_at: string;
  updated_at: string;
};

export type CreateNoteInput = {
  title: string;
  content: string;
  category: NoteCategory;
};

export type UpdateNoteInput =
  Partial<CreateNoteInput>;