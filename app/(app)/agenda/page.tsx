import TimelineAgenda from "@/components/TimelineAgenda";

export default function AgendaPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 text-white md:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-7 md:p-9">
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            AtlasOS Agenda
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Agenda & planning
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Organise ta semaine, visualise tes rendez-vous et garde une vue claire
            sur tes prochaines échéances.
          </p>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      </section>

      <TimelineAgenda />
    </div>
  );
}
