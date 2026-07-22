"use client";

import { useState, useEffect } from "react";

interface EventItem {
  id: string;
  title: string;
  date: string; // Format "YYYY-MM-DD"
  time?: string;
  category: "Santé" | "Pro" | "Perso" | "Finance";
}

// Données fictives par défaut si le localStorage est vide
const initialEvents: EventItem[] = [
  { id: "1", title: "RDV Médecin", date: "2026-07-24", time: "14:00", category: "Santé" },
  { id: "2", title: "Livraison projet client", date: "2026-07-26", time: "10:30", category: "Pro" },
  { id: "3", title: "Sport / Course", date: "2026-07-27", time: "18:00", category: "Perso" },
];

export default function TimelineAgenda() {
  // Initialisation sécurisée avec localStorage
  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas_events");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Erreur parsing localStorage events", e);
        }
      }
    }
    return initialEvents;
  });

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  
  // Modal ou form d'ajout rapide
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newCategory, setNewCategory] = useState<EventItem["category"]>("Perso");

  // Sauvegarde automatique dans le localStorage à chaque modification des événements
  useEffect(() => {
    localStorage.setItem("atlas_events", JSON.stringify(events));
  }, [events]);

  // Calculer les 7 jours de la semaine active (centrée sur currentDate)
  const getDaysOfWeek = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Lundi comme premier jour
    start.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getDaysOfWeek(currentDate);

  // Navigation semaines
  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDate) return;

    const updatedEvents = [...events, {
      id: Date.now().toString(),
      title: newTitle,
      date: newDate,
      time: newTime,
      category: newCategory,
    }];

    setEvents(updatedEvents);
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setShowAdd(false);
  };

  const formatDateString = (d: Date) => d.toISOString().split("T")[0];

  const formatDisplayDate = (d: Date) => {
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-6 text-white max-w-6xl mx-auto">
      
      {/* Header de la Timeline & Contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            📅 Timeline & Agenda
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Navigue de semaine en semaine et visualise tes échéances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
            <button
              onClick={prevWeek}
              className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              ← Précédent
            </button>
            <span className="text-xs font-semibold px-3 text-indigo-400">
              Semaine active
            </span>
            <button
              onClick={nextWeek}
              className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Suivant →
            </button>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition cursor-pointer"
          >
            {showAdd ? "Fermer" : "+ Ajouter un RDV"}
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout rapide */}
      {showAdd && (
        <form onSubmit={handleAddEvent} className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <input
            type="text"
            placeholder="Titre (ex: RDV Médecin)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            className="sm:col-span-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          />
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 rounded-lg transition cursor-pointer"
          >
            Enregistrer
          </button>
        </form>
      )}

      {/* TIMELINE HORIZONTALE */}
      <div className="relative pt-16 pb-20 overflow-x-auto">
        {/* Ligne horizontale principale de la timeline */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/25 -translate-y-1/2 z-0 min-w-[1050px]" />

        {/* Conteneur des 7 jours */}
        <div className="grid grid-cols-7 gap-8 relative z-10 min-w-[1050px] px-4">
          {weekDays.map((day, index) => {
            const dateStr = formatDateString(day);
            const dayEvents = events.filter((ev) => ev.date === dateStr);
            const isToday = formatDateString(new Date()) === dateStr;

            return (
              <div key={index} className="flex flex-col items-center relative group">
                
                {/* Pastille / Point central sur la ligne de la timeline */}
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  isToday 
                    ? "bg-indigo-500 border-white ring-4 ring-indigo-500/30" 
                    : "bg-slate-900 border-indigo-500 group-hover:scale-125"
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Étiquette de la date sous la ligne */}
                <div className={`mt-5 text-center text-xs px-3 py-2 rounded-xl border shadow-sm ${
                  isToday ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold" : "bg-slate-900/90 border-slate-700 text-slate-300"
                }`}>
                  {formatDisplayDate(day)}
                </div>

                {/* ÉVÉNEMENTS SUSPENDUS (Tige qui sort de la timeline vers le haut) */}
                <div className="absolute bottom-12 flex flex-col items-center space-y-3 w-full px-1">
                  {dayEvents.map((ev) => (
                    <div key={ev.id} className="relative group/card flex flex-col items-center w-full">
                      
                      {/* La "tige" verticale qui relie l'événement à la timeline */}
                      <div className="w-px h-10 bg-indigo-500/60" />

                      {/* La carte de l'événement */}
                      <div className="w-full bg-slate-900/95 border border-indigo-500/40 hover:border-indigo-400 p-3.5 rounded-xl shadow-xl backdrop-blur-md transition-all hover:-translate-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            {ev.time ? ev.time : "Toute la journée"}
                          </span>
                          <button
                            onClick={() => setEvents(events.filter(e => e.id !== ev.id))}
                            className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer ml-1"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-white mt-2 line-clamp-2">
                          {ev.title}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}