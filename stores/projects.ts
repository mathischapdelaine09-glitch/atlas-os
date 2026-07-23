"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Project = {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  budget?: number;
};

type ProjectsStore = {
  projects: Project[];

  addProject: (project: Project) => void;

  deleteProject: (id: string) => void;

  updateProjectStatus: (
    id: string,
    status: "TODO" | "IN_PROGRESS" | "DONE"
  ) => void;
};

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set) => ({
      projects: [],

      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects],
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      updateProjectStatus: (id, status) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  status,
                }
              : project
          ),
        })),
    }),

    {
      name: "veyra-projects",
    }
  )
);