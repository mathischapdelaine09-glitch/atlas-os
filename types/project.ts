export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "archived";

export type ProjectPriority =
  | "low"
  | "medium"
  | "high";

export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  budget: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateProjectInput = {
  title: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  progress?: number;
  budget?: number | null;
  due_date?: string | null;
};

export type UpdateProjectInput =
  Partial<CreateProjectInput>;