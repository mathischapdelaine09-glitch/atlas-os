import TimelineAgenda from "@/components/TimelineAgenda";

export default function AgendaPage() {
  return (
    <div className="space-y-8 text-white max-w-6xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">📅 Agenda & Planning</h1>
        <p className="text-slate-400 text-sm mt-1">
          Gère ton emploi du temps de semaine en semaine.
        </p>
      </div>

      {/* Intégration de la Timeline */}
      <TimelineAgenda />
    </div>
  );
}