"use client";

import { useEffect, useMemo, useState } from "react";

interface GradeItem {
  id: string;
  subject: string;
  title: string;
  grade: number;
  coefficient: number;
}

interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  priority: "Haute" | "Moyenne" | "Basse";
}

const GRADES_STORAGE_KEY = "studies_grades";
const HOMEWORKS_STORAGE_KEY = "studies_homeworks";

const initialGrades: GradeItem[] = [
  {
    id: "1",
    subject: "Mathématiques",
    title: "Interro intégrales",
    grade: 14,
    coefficient: 3,
  },
  {
    id: "2",
    subject: "Informatique",
    title: "Projet Next.js",
    grade: 18,
    coefficient: 4,
  },
];

const initialHomeworks: HomeworkItem[] = [
  {
    id: "1",
    subject: "Mathématiques",
    title: "Exercices page 42",
    dueDate: "2026-07-28",
    priority: "Haute",
  },
  {
    id: "2",
    subject: "Anglais",
    title: "Rédiger l'essai vocabulaire",
    dueDate: "2026-07-30",
    priority: "Moyenne",
  },
];

export default function StudiesPage() {
  const [grades, setGrades] = useState<GradeItem[]>(initialGrades);
  const [homeworks, setHomeworks] =
    useState<HomeworkItem[]>(initialHomeworks);
  const [hydrated, setHydrated] = useState(false);

  const [newGradeSubject, setNewGradeSubject] = useState("");
  const [newGradeTitle, setNewGradeTitle] = useState("");
  const [newGradeValue, setNewGradeValue] = useState("");
  const [newGradeCoefficient, setNewGradeCoefficient] =
    useState("1");

  const [newHomeworkSubject, setNewHomeworkSubject] =
    useState("");
  const [newHomeworkTitle, setNewHomeworkTitle] = useState("");
  const [newHomeworkDate, setNewHomeworkDate] = useState("");
  const [newHomeworkPriority, setNewHomeworkPriority] =
    useState<HomeworkItem["priority"]>("Moyenne");

  useEffect(() => {
    const savedGrades = window.localStorage.getItem(
      GRADES_STORAGE_KEY
    );
    const savedHomeworks = window.localStorage.getItem(
      HOMEWORKS_STORAGE_KEY
    );

    if (savedGrades) {
      try {
        setGrades(JSON.parse(savedGrades) as GradeItem[]);
      } catch (error) {
        console.error("Erreur parsing notes", error);
      }
    }

    if (savedHomeworks) {
      try {
        setHomeworks(
          JSON.parse(savedHomeworks) as HomeworkItem[]
        );
      } catch (error) {
        console.error("Erreur parsing devoirs", error);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      GRADES_STORAGE_KEY,
      JSON.stringify(grades)
    );
  }, [grades, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      HOMEWORKS_STORAGE_KEY,
      JSON.stringify(homeworks)
    );
  }, [homeworks, hydrated]);

  const generalAverage = useMemo(() => {
    const totalPoints = grades.reduce(
      (total, grade) =>
        total + grade.grade * grade.coefficient,
      0
    );

    const totalCoefficients = grades.reduce(
      (total, grade) => total + grade.coefficient,
      0
    );

    return totalCoefficients > 0
      ? totalPoints / totalCoefficients
      : 0;
  }, [grades]);

  const subjectAverages = useMemo(() => {
    const subjects = Array.from(
      new Set(grades.map((grade) => grade.subject))
    );

    return subjects
      .map((subject) => {
        const subjectGrades = grades.filter(
          (grade) => grade.subject === subject
        );

        const totalPoints = subjectGrades.reduce(
          (total, grade) =>
            total + grade.grade * grade.coefficient,
          0
        );

        const totalCoefficients = subjectGrades.reduce(
          (total, grade) => total + grade.coefficient,
          0
        );

        return {
          subject,
          average:
            totalCoefficients > 0
              ? totalPoints / totalCoefficients
              : 0,
          count: subjectGrades.length,
        };
      })
      .sort((first, second) => second.average - first.average);
  }, [grades]);

  const sortedHomeworks = useMemo(() => {
    const priorityOrder: Record<
      HomeworkItem["priority"],
      number
    > = {
      Haute: 0,
      Moyenne: 1,
      Basse: 2,
    };

    return [...homeworks].sort((first, second) => {
      const dateComparison = first.dueDate.localeCompare(
        second.dueDate
      );

      if (dateComparison !== 0) return dateComparison;

      return (
        priorityOrder[first.priority] -
        priorityOrder[second.priority]
      );
    });
  }, [homeworks]);

  const highPriorityCount = homeworks.filter(
    (homework) => homework.priority === "Haute"
  ).length;

  function handleAddGrade(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const subject = newGradeSubject.trim();
    const title = newGradeTitle.trim();
    const grade = Number(newGradeValue);
    const coefficient = Number(newGradeCoefficient);

    if (
      !subject ||
      !title ||
      !Number.isFinite(grade) ||
      grade < 0 ||
      grade > 20 ||
      !Number.isFinite(coefficient) ||
      coefficient <= 0
    ) {
      return;
    }

    setGrades((currentGrades) => [
      {
        id: crypto.randomUUID(),
        subject,
        title,
        grade,
        coefficient,
      },
      ...currentGrades,
    ]);

    setNewGradeSubject("");
    setNewGradeTitle("");
    setNewGradeValue("");
    setNewGradeCoefficient("1");
  }

  function handleAddHomework(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const subject = newHomeworkSubject.trim();
    const title = newHomeworkTitle.trim();

    if (!subject || !title || !newHomeworkDate) return;

    setHomeworks((currentHomeworks) => [
      ...currentHomeworks,
      {
        id: crypto.randomUUID(),
        subject,
        title,
        dueDate: newHomeworkDate,
        priority: newHomeworkPriority,
      },
    ]);

    setNewHomeworkSubject("");
    setNewHomeworkTitle("");
    setNewHomeworkDate("");
    setNewHomeworkPriority("Moyenne");
  }

  function deleteGrade(id: string) {
    setGrades((currentGrades) =>
      currentGrades.filter((grade) => grade.id !== id)
    );
  }

  function completeHomework(id: string) {
    setHomeworks((currentHomeworks) =>
      currentHomeworks.filter(
        (homework) => homework.id !== id
      )
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 text-white md:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-7 md:p-9">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Veyra Études
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Espace études & suivi
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Suis tes résultats, calcule tes moyennes pondérées
              et organise tes devoirs selon leur date et leur priorité.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetricCard
              label="Moyenne"
              value={`${generalAverage.toFixed(2)} / 20`}
              tone="indigo"
            />

            <MetricCard
              label="Notes"
              value={String(grades.length)}
              tone="violet"
            />

            <MetricCard
              label="Urgents"
              value={String(highPriorityCount)}
              tone="rose"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Panel
            eyebrow="Résultats"
            title="Ajouter une note"
            tone="indigo"
          >
            <form
              onSubmit={handleAddGrade}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Matière">
                  <input
                    type="text"
                    value={newGradeSubject}
                    onChange={(event) =>
                      setNewGradeSubject(event.target.value)
                    }
                    placeholder="Ex. HGGSP"
                    required
                    className={inputClasses}
                  />
                </Field>

                <Field label="Évaluation">
                  <input
                    type="text"
                    value={newGradeTitle}
                    onChange={(event) =>
                      setNewGradeTitle(event.target.value)
                    }
                    placeholder="Ex. Dissertation"
                    required
                    className={inputClasses}
                  />
                </Field>

                <Field label="Note sur 20">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={newGradeValue}
                    onChange={(event) =>
                      setNewGradeValue(event.target.value)
                    }
                    placeholder="14.5"
                    required
                    className={inputClasses}
                  />
                </Field>

                <Field label="Coefficient">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newGradeCoefficient}
                    onChange={(event) =>
                      setNewGradeCoefficient(
                        event.target.value
                      )
                    }
                    required
                    className={inputClasses}
                  />
                </Field>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Enregistrer la note
              </button>
            </form>
          </Panel>

          <Panel
            eyebrow="Analyse"
            title="Moyennes par matière"
            tone="violet"
          >
            {subjectAverages.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {subjectAverages.map((subject) => (
                  <div
                    key={subject.subject}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {subject.subject}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {subject.count} note
                          {subject.count > 1 ? "s" : ""}
                        </p>
                      </div>

                      <p className="text-lg font-black text-indigo-400">
                        {subject.average.toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(
                            Math.max(subject.average * 5, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Aucune moyenne disponible." />
            )}
          </Panel>

          <Panel
            eyebrow="Historique"
            title="Toutes les notes"
            tone="slate"
          >
            {grades.length > 0 ? (
              <div className="space-y-3">
                {grades.map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="min-w-0">
                      <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-300">
                        {grade.subject} · coef.{" "}
                        {grade.coefficient}
                      </span>

                      <p className="mt-3 truncate text-sm font-semibold text-white">
                        {grade.title}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black text-white">
                        {grade.grade}
                        <span className="text-xs font-medium text-slate-500">
                          {" "}
                          / 20
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={() => deleteGrade(grade.id)}
                        className="mt-2 text-[10px] font-semibold text-rose-400 transition hover:text-rose-300"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Aucune note enregistrée." />
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            eyebrow="Organisation"
            title="Ajouter un devoir"
            tone="emerald"
          >
            <form
              onSubmit={handleAddHomework}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Matière">
                  <input
                    type="text"
                    value={newHomeworkSubject}
                    onChange={(event) =>
                      setNewHomeworkSubject(
                        event.target.value
                      )
                    }
                    placeholder="Ex. LLCE"
                    required
                    className={inputClasses}
                  />
                </Field>

                <Field label="Date limite">
                  <input
                    type="date"
                    value={newHomeworkDate}
                    onChange={(event) =>
                      setNewHomeworkDate(event.target.value)
                    }
                    required
                    className={inputClasses}
                  />
                </Field>
              </div>

              <Field label="Intitulé du devoir">
                <input
                  type="text"
                  value={newHomeworkTitle}
                  onChange={(event) =>
                    setNewHomeworkTitle(event.target.value)
                  }
                  placeholder="Ex. Préparer l’oral..."
                  required
                  className={inputClasses}
                />
              </Field>

              <Field label="Priorité">
                <select
                  value={newHomeworkPriority}
                  onChange={(event) =>
                    setNewHomeworkPriority(
                      event.target
                        .value as HomeworkItem["priority"]
                    )
                  }
                  className={inputClasses}
                >
                  <option value="Haute">🔴 Haute</option>
                  <option value="Moyenne">🟠 Moyenne</option>
                  <option value="Basse">🟢 Basse</option>
                </select>
              </Field>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Planifier le devoir
              </button>
            </form>
          </Panel>

          <Panel
            eyebrow="À faire"
            title="Devoirs à rendre"
            tone="amber"
          >
            {sortedHomeworks.length > 0 ? (
              <div className="space-y-3">
                {sortedHomeworks.map((homework) => {
                  const dueStatus = getDueStatus(
                    homework.dueDate
                  );

                  return (
                    <div
                      key={homework.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-300">
                              {homework.subject}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getPriorityClasses(
                                homework.priority
                              )}`}
                            >
                              {homework.priority}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${dueStatus.classes}`}
                            >
                              {dueStatus.label}
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-semibold text-white">
                            {homework.title}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            À rendre le{" "}
                            {formatHomeworkDate(
                              homework.dueDate
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            completeHomework(homework.id)
                          }
                          className="shrink-0 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          Fait ✓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="Aucun devoir en cours." />
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  className = "",
}: {
  label: string;
  value: string;
  tone: "indigo" | "violet" | "rose";
  className?: string;
}) {
  const toneClasses = {
    indigo: "text-indigo-400",
    violet: "text-violet-400",
    rose: "text-rose-400",
  };

  return (
    <div
      className={`min-w-32 rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3 ${className}`}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-black ${toneClasses[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  tone,
  children,
}: {
  eyebrow: string;
  title: string;
  tone:
    | "indigo"
    | "violet"
    | "emerald"
    | "amber"
    | "slate";
  children: React.ReactNode;
}) {
  const toneClasses = {
    indigo: "text-indigo-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    slate: "text-slate-500",
  };

  return (
    <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-5 md:p-6">
      <div className="mb-5 border-b border-slate-800 pb-4">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${toneClasses[tone]}`}
        >
          {eyebrow}
        </p>

        <h2 className="mt-2 text-xl font-bold">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      {children}
    </label>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 px-5 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function getPriorityClasses(
  priority: HomeworkItem["priority"]
) {
  return {
    Haute:
      "border-rose-500/30 bg-rose-500/10 text-rose-300",
    Moyenne:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
    Basse:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  }[priority];
}

function getDueStatus(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${date}T00:00:00`);
  const differenceInDays = Math.ceil(
    (dueDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (differenceInDays < 0) {
    return {
      label: "En retard",
      classes:
        "border-rose-500/30 bg-rose-500/10 text-rose-300",
    };
  }

  if (differenceInDays === 0) {
    return {
      label: "Aujourd’hui",
      classes:
        "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  }

  if (differenceInDays === 1) {
    return {
      label: "Demain",
      classes:
        "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  }

  if (differenceInDays <= 7) {
    return {
      label: `Dans ${differenceInDays} jours`,
      classes:
        "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    };
  }

  return {
    label: "À venir",
    classes:
      "border-slate-700 bg-slate-800/60 text-slate-400",
  };
}

function formatHomeworkDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "fr-FR",
    {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

const inputClasses =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500";