import type { ReactNode } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

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
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-950 p-4">
        <div className="border-b border-slate-800 px-3 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            Personal OS
          </p>

          <h1 className="mt-1 text-xl font-black tracking-wider text-indigo-400">
            ATLAS OS
          </h1>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs text-slate-500 transition group-hover:bg-indigo-500/10 group-hover:text-indigo-400">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="space-y-4 border-t border-slate-800 pt-4">
          <LogoutButton />

          <div className="px-3 text-center text-[10px] uppercase tracking-wider text-slate-600">
            AtlasOS • Version 1.0
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}