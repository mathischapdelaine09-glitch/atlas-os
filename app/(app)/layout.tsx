import type { ReactNode } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";
import { InstallAtlasButton } from "@/components/pwa/install-atlas-button";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import MobileBottomNavigation from "@/components/navigation/MobileBottomNavigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    name: "Finance",
    href: "/finance",
    icon: "€",
  },
  {
    name: "Documents",
    href: "/documents",
    icon: "▤",
  },
  {
    name: "Projets",
    href: "/projects",
    icon: "◆",
  },
  {
    name: "Notes",
    href: "/notes",
    icon: "✎",
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: "◫",
  },
  {
    name: "Études",
    href: "/etudes",
    icon: "◇",
  },
];

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* SIDEBAR ORDINATEUR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 p-4 lg:flex">
        <div className="border-b border-slate-800 px-3 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            Personal OS
          </p>

          <h1 className="mt-1 text-xl font-black tracking-wider text-indigo-400">
            ATLAS OS
          </h1>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs text-slate-500 transition group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="space-y-3 border-t border-slate-800 pt-4">
  <InstallAtlasButton />

  <LogoutButton />

  <div className="px-3 text-center text-[10px] uppercase tracking-wider text-slate-600">
    AtlasOS • Version 1.0
  </div>
</div>
      </aside>

      {/* EN-TÊTE MOBILE */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-600">
            Personal OS
          </p>

          <p className="truncate text-base font-black tracking-wider text-indigo-400">
            ATLAS OS
          </p>
        </Link>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-sm font-black text-indigo-400">
          A
        </div>
      </header>

      {/* CONTENU DES PAGES */}
            <main className="min-h-screen min-w-0 overflow-x-hidden px-4 pb-24 pt-20 sm:px-6 lg:ml-64 lg:px-8 lg:pb-8 lg:pt-8">
        {children}
      </main>

      <MobileBottomNavigation />
    </div>
  );
}