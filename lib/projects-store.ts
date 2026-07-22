export type Project = {
  id: string;
  title: string;
  description: string;
  status: string;
};

const globalForProjects = globalThis as unknown as {
  projects: Project[] | undefined;
};

export const projectsStore: Project[] =
  globalForProjects.projects ?? [
    { id: "1", title: "Projet Exemple 1", description: "Projet de test", status: "TODO" },
    { id: "2", title: "Projet Exemple 2", description: "En cours de dev", status: "IN_PROGRESS" },
  ];

if (process.env.NODE_ENV !== "production") {
  globalForProjects.projects = projectsStore;
}