"use client";

import { useState, useEffect } from "react";

interface GradeItem {
  id: string;
  subject: string;
  title: string;
  grade: number; // sur 20 par exemple
  coefficient: number;
}

interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  priority: "Haute" | "Moyenne" | "Basse";
}

export default function StudiesPage() {
  // États initiaux chargés depuis le localStorage (ou valeurs par défaut)
  const [grades, setGrades] = useState<GradeItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("studies_grades");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [
      { id: "1", subject: "Mathématiques", title: "Interro intégrales", grade: 14, coefficient: 3 },
      { id: "2", subject: "Informatique", title: "Projet Next.js", grade: 18, coefficient: 4 },
    ];
  });

  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("studies_homeworks");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [
      { id: "1", subject: "Mathématiques", title: "Exercices page 42", dueDate: "2026-07-28", priority: "Haute" },
      { id: "2", subject: "Anglais", title: "Rédiger l'essai vocabulaire", dueDate: "2026-07-30", priority: "Moyenne" },
    ];
  });

  // Sauvegarde automatique dans le localStorage
  useEffect(() => {
    localStorage.setItem("studies_grades", JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem("studies_homeworks", JSON.stringify(homeworks));
  }, [homeworks]);

  // Form states notes
  const [newGradeSubject, setNewGradeSubject] = useState("");
  const [newGradeTitle, setNewGradeTitle] = useState("");
  const [newGradeValue, setNewGradeValue] = useState("");
  const [newGradeCoef, setNewGradeCoef] = useState("1");

  // Form states devoirs
  const [newHwSubject, setNewHwSubject] = useState("");
  const [newHwTitle, setNewHwTitle] = useState("");
  const [newHwDate, setNewHwDate] = useState("");
  const [newHwPriority, setNewHwPriority] = useState<HomeworkItem["priority"]>("Moyenne");

  // Calcul de la moyenne générale pondérée
  const totalPoints = grades.reduce((acc, curr) => acc + curr.grade * curr.coefficient, 0);
  const totalCoefs = grades.reduce((acc, curr) => acc + curr.coefficient, 0);
  const generalAverage = totalCoefs > 0 ? (totalPoints / totalCoefs).toFixed(2) : "0.00";

  // Calcul des moyennes par matière (regroupement automatique)
  const subjectsList = Array.from(new Set(grades.map((g) => g.subject)));
  const subjectAverages = subjectsList.map((subject) => {
    const subjectGrades = grades.filter((g) => g.subject === subject);
    const subPoints = subjectGrades.reduce((acc, curr) => acc + curr.grade * curr.coefficient, 0);
    const subCoefs = subjectGrades.reduce((acc, curr) => acc + curr.coefficient, 0);
    const average = subCoefs > 0 ? (subPoints / subCoefs).toFixed(2) : "0.00";
    return { subject, average, count: subjectGrades.length };
  });

  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeSubject || !newGradeTitle || !newGradeValue) return;

    setGrades([
      ...grades,
      {
        id: Date.now().toString(),
        subject: newGradeSubject.trim(),
        title: newGradeTitle,
        grade: parseFloat(newGradeValue),
        coefficient: parseFloat(newGradeCoef) || 1,
      },
    ]);
    setNewGradeSubject("");
    setNewGradeTitle("");
    setNewGradeValue("");
    setNewGradeCoef("1");
  };

  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHwSubject || !newHwTitle || !newHwDate) return;

    setHomeworks([
      ...homeworks,
      {
        id: Date.now().toString(),
        subject: newHwSubject.trim(),
        title: newHwTitle,
        dueDate: newHwDate,
        priority: newHwPriority,
      },
    ]);
    setNewHwSubject("");
    setNewHwTitle("");
    setNewHwDate("");
  };

  const getPriorityColor = (priority: HomeworkItem["priority"]) => {
    switch (priority) {
      case "Haute": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Moyenne": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Basse": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-8 text-white max-w-6xl mx-auto p-4">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            🎓 Espace Études & Suivi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gère tes notes par matière, suis ta moyenne pondérée et organise tes devoirs par priorité.
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-xs text-slate-300">
          Moyenne générale : <span className="font-bold text-indigo-400 text-sm">{generalAverage} / 20</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* SECTION 1 : NOTES & COEFFICIENTS */}
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-4">
            <h2 className="font-bold text-sm text-slate-300">➕ Ajouter une note</h2>
            <form onSubmit={handleAddGrade} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Matière (ex: Math)"
                  value={newGradeSubject}
                  onChange={(e) => setNewGradeSubject(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Intitulé (ex: Examen partiel)"
                  value={newGradeTitle}
                  onChange={(e) => setNewGradeTitle(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Note (/20)"
                  value={newGradeValue}
                  onChange={(e) => setNewGradeValue(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Coefficient"
                  value={newGradeCoef}
                  onChange={(e) => setNewGradeCoef(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Enregistrer la note
              </button>
            </form>
          </div>

          {/* Section Moyennes par matière */}
          {subjectAverages.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl space-y-3">
              <h2 className="font-bold text-sm text-slate-300">📈 Moyennes par matière</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subjectAverages.map((sub) => (
                  <div key={sub.subject} className="bg-slate-900/60 border border-slate-700/50 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white">{sub.subject}</span>
                      <span className="block text-[10px] text-slate-400">{sub.count} note(s)</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-400">{sub.average} / 20</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste des notes */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-sm text-slate-300">📊 Historique des notes</h2>
            <div className="space-y-2">
              {grades.length > 0 ? (
                grades.map((g) => (
                  <div key={g.id} className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {g.subject} (Coeff. {g.coefficient})
                      </span>
                      <p className="text-xs font-semibold text-white mt-1">{g.title}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-white">{g.grade}</span>
                      <span className="text-xs text-slate-400"> / 20</span>
                      <button
                        onClick={() => setGrades(grades.filter(item => item.id !== g.id))}
                        className="block text-[10px] text-rose-400 hover:underline mt-1 ml-auto cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Aucune note enregistrée.</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2 : DEVOIRS PAR PRIORITÉ */}
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-4">
            <h2 className="font-bold text-sm text-slate-300">➕ Ajouter un devoir</h2>
            <form onSubmit={handleAddHomework} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Matière"
                  value={newHwSubject}
                  onChange={(e) => setNewHwSubject(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="date"
                  value={newHwDate}
                  onChange={(e) => setNewHwDate(e.target.value)}
                  required
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Intitulé du devoir"
                value={newHwTitle}
                onChange={(e) => setNewHwTitle(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <select
                value={newHwPriority}
                onChange={(e) => setNewHwPriority(e.target.value as HomeworkItem["priority"])}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Haute">🔴 Priorité Haute</option>
                <option value="Moyenne">🟠 Priorité Moyenne</option>
                <option value="Basse">🟢 Priorité Basse</option>
              </select>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl transition cursor-pointer"
              >
                Planifier le devoir
              </button>
            </form>
          </div>

          {/* Liste des devoirs */}
          <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-sm text-slate-300">📚 Liste des devoirs à rendre</h2>
            <div className="space-y-2">
              {homeworks.length > 0 ? (
                homeworks.map((hw) => (
                  <div key={hw.id} className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          {hw.subject}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getPriorityColor(hw.priority)}`}>
                          {hw.priority}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-white">{hw.title}</p>
                      <p className="text-[10px] text-slate-400">Pour le : {hw.dueDate}</p>
                    </div>
                    <button
                      onClick={() => setHomeworks(homeworks.filter(item => item.id !== hw.id))}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Fait ✓
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Aucun devoir en cours.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}