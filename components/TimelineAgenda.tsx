"use client";

import { useEffect, useMemo, useState } from "react";

type EventCategory = "Santé" | "Pro" | "Perso" | "Finance";

interface EventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  category: EventCategory;
}

const STORAGE_KEY = "veyra_events";

const initialEvents: EventItem[] = [
  {
    id: "1",
    title: "RDV Médecin",
    date: "2026-07-24",
    time: "14:00",
    category: "Santé",
  },
  {
    id: "2",
    title: "Livraison projet client",
    date: "2026-07-26",
    time: "10:30",
    category: "Pro",
  },
  {
    id: "3",
    title: "Sport / Course",
    date: "2026-07-27",
    time: "18:00",
    category: "Perso",
  },
];

const categories: EventCategory[] = [
  "Perso",
  "Pro",
  "Santé",
  "Finance",
];

export default function TimelineAgenda() {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newCategory, setNewCategory] =
    useState<EventCategory>("Perso");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setEvents(JSON.parse(saved) as EventItem[]);
      } catch (error) {
        console.error("Erreur parsing localStorage events", error);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(events)
    );
  }, [events, hydrated]);

  const weekDays = useMemo(
    () => getDaysOfWeek(currentDate),
    [currentDate]
  );

  const weekLabel = useMemo(() => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];

    return `${formatShortDate(firstDay)} — ${formatShortDate(lastDay)}`;
  }, [weekDays]);

  const weekEventsCount = useMemo(() => {
    const dates = new Set(weekDays.map(formatDateString));

    return events.filter((event) => dates.has(event.date)).length;
  }, [events, weekDays]);

  function moveWeek(offset: number) {
    setCurrentDate((date) => {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + offset * 7);
      return nextDate;
    });
  }

  function handleAddEvent(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanTitle = newTitle.trim();

    if (!cleanTitle || !newDate) return;

    setEvents((currentEvents) => [
      ...currentEvents,
      {
        id: crypto.randomUUID(),
        title: cleanTitle,
        date: newDate,
        time: newTime || undefined,
        category: newCategory,
      },
    ]);

    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setNewCategory("Perso");
    setShowAdd(false);
  }

  function deleteEvent(id: string) {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== id)
    );
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-700/60 bg-slate-900/60 p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Vue hebdomadaire
          </p>

          <h2 className="mt-2 text-xl font-bold">
            {weekLabel}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {weekEventsCount} événement
            {weekEventsCount > 1 ? "s" : ""} prévu
            {weekEventsCount > 1 ? "s" : ""} cette semaine
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 p-1">
            <button
              type="button"
              onClick={() => moveWeek(-1)}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              ← Précédente
            </button>

            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-indigo-400 transition hover:bg-indigo-500/10"
            >
              Aujourd’hui
            </button>

            <button
              type="button"
              onClick={() => moveWeek(1)}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Suivante →
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd((current) => !current)}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
          >
            {showAdd ? "Fermer" : "+ Ajouter un événement"}
          </button>
        </div>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddEvent}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 md:grid-cols-2 xl:grid-cols-6"
        >
          <Field label="Titre" className="xl:col-span-2">
            <input
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Ex. Rendez-vous, réunion..."
              required
              className={inputClasses}
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
              required
              className={inputClasses}
            />
          </Field>

          <Field label="Heure">
            <input
              type="time"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
              className={inputClasses}
            />
          </Field>

          <Field label="Catégorie">
            <select
              value={newCategory}
              onChange={(event) =>
                setNewCategory(
                  event.target.value as EventCategory
                )
              }
              className={inputClasses}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {category}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {weekDays.map((day) => {
          const date = formatDateString(day);

          const dayEvents = events
            .filter((event) => event.date === date)
            .sort((firstEvent, secondEvent) =>
              (firstEvent.time || "99:99").localeCompare(
                secondEvent.time || "99:99"
              )
            );

          const isToday =
            formatDateString(new Date()) === date;

          return (
            <article
              key={date}
              className={`min-h-56 rounded-2xl border p-4 transition ${
                isToday
                  ? "border-indigo-500/50 bg-indigo-500/10"
                  : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2 xl:block">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isToday
                        ? "text-indigo-300"
                        : "text-slate-500"
                    }`}
                  >
                    {day.toLocaleDateString("fr-FR", {
                      weekday: "long",
                    })}
                  </p>

                  <p className="mt-1 text-lg font-black text-white">
                    {day.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </div>

                {isToday && (
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2 py-1 text-[10px] font-bold text-indigo-300">
                    Aujourd’hui
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-700/70 bg-slate-900/90 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getCategoryClasses(
                            event.category
                          )}`}
                        >
                          {getCategoryIcon(event.category)}{" "}
                          {event.category}
                        </span>

                        <button
                          type="button"
                          onClick={() => deleteEvent(event.id)}
                          aria-label={`Supprimer ${event.title}`}
                          className="text-sm leading-none text-slate-500 transition hover:text-rose-400"
                        >
                          ×
                        </button>
                      </div>

                      <p className="mt-3 text-xs font-semibold leading-5 text-white">
                        {event.title}
                      </p>

                      <p className="mt-2 text-[10px] text-slate-500">
                        {event.time || "Toute la journée"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-800 px-3 py-5 text-center text-[11px] text-slate-600">
                    Rien de prévu
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function getDaysOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const difference =
    start.getDate() - day + (day === 0 ? -6 : 1);

  start.setDate(difference);

  return Array.from({ length: 7 }, (_, index) => {
    const result = new Date(start);
    result.setDate(start.getDate() + index);
    return result;
  });
}

function formatDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function getCategoryIcon(category: EventCategory) {
  return {
    Santé: "🩺",
    Pro: "💼",
    Perso: "👤",
    Finance: "💰",
  }[category];
}

function getCategoryClasses(category: EventCategory) {
  return {
    Santé:
      "border-rose-500/30 bg-rose-500/10 text-rose-300",
    Pro:
      "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
    Perso:
      "border-violet-500/30 bg-violet-500/10 text-violet-300",
    Finance:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  }[category];
}

const inputClasses =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500";
