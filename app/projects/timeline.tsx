"use client";

import { useState } from "react";

type Project = {
  id: string;
  title: string;
  status: string;
  color: string;
  startDate: Date;
  endDate: Date | null;
};

export default function Timeline({ projects }: { projects: Project[] }) {
  const [monthOffset, setMonthOffset] = useState(0);

  // Calcul des mois affichés
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);

  const months = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - 3 + i, 1);
    return {
      name: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      dateObj: d,
    };
  });

  const today = new Date();

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-6">
      {/* Boutons de navigation dans le temps */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⏳</span> Timeline interactive
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Fais défiler les mois pour voir le positionnement de tes projets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonthOffset((prev) => prev - 1)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition text-white"
          >
            ◀ Précédent
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset(0)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset((prev) => prev + 1)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition text-white"
          >
            Suivant ▶
          </button>
        </div>
      </div>

      {/* Grille de la frise */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 border-b border-slate-700 pb-3 text-center">
            {months.map((m, idx) => {
              const isCurrentMonth =
                today.getMonth() === m.month && today.getFullYear() === m.year;
              return (
                <div
                  key={idx}
                  className={`text-sm font-semibold capitalize ${
                    isCurrentMonth ? "text-indigo-400" : "text-slate-400"
                  }`}
                >
                  {m.name}
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-3 relative min-h-[100px]">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Aucun projet à afficher sur cette période.
              </div>
            ) : (
              projects.map((project) => {
                const start = new Date(project.startDate);
                const end = project.endDate ? new Date(project.endDate) : start;

                const minTime = months[0].dateObj.getTime();
                const maxTime = new Date(
                  months[6].dateObj.getFullYear(),
                  months[6].dateObj.getMonth() + 1,
                  0
                ).getTime();

                const totalDuration = maxTime - minTime;
                let leftPercent = ((start.getTime() - minTime) / totalDuration) * 100;
                let widthPercent = ((end.getTime() - start.getTime()) / totalDuration) * 100;

                leftPercent = Math.max(0, Math.min(100, leftPercent));
                widthPercent = Math.max(6, Math.min(100 - leftPercent, widthPercent));

                return (
                  <div key={project.id} className="relative h-10 flex items-center">
                    <div
                      className="absolute h-8 rounded-lg px-3 flex items-center justify-between text-xs font-semibold text-white shadow-md transition-all"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: project.color,
                      }}
                    >
                      <span className="truncate">{project.title}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}