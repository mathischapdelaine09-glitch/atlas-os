import type { ReactNode } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";

import LogoutButton from "@/components/auth/LogoutButton";
import MobileBottomNavigation from "@/components/navigation/MobileBottomNavigation";
import { InstallAtlasButton } from "@/components/pwa/install-veyra-button";
import { createClient } from "@/lib/supabase/server";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    name: "To-do",
    href: "/todo",
    icon: "✓",
  },
  {
    name: "Habitudes",
    href: "/habits",
    icon: "◎",
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

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* SIDEBAR ORDINATEUR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 lg:flex">
        {/* LOGO */}
        <div className="shrink-0 border-b border-slate-800 px-7 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            Personal OS
          </p>

          <h1 className="mt-1 text-xl font-black tracking-wider text-indigo-400">
            VEYRA OS
          </h1>
        </div>

        {/* NAVIGATION DÉFILANTE */}
        <nav
          className="
            min-h-0
            flex-1
            space-y-2
            overflow-y-auto
            px-4
            py-5
            [scrollbar-width:none]
            [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="
                group
                flex
                min-h-12
                items-center
                gap-3.5
                rounded-xl
                px-3
                py-3
                text-sm
                font-medium
                text-slate-400
                transition-all
                duration-200
                hover:bg-slate-800
                hover:text-white
              "
            >
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-900
                  text-sm
                  text-slate-500
                  transition-all
                  duration-200
                  group-hover:bg-indigo-500/10
                  group-hover:text-indigo-400
                "
              >
                {item.icon}
              </span>

              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* BAS DE LA SIDEBAR */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-950 px-4 pb-4 pt-4">
          <div className="space-y-3">
            <InstallAtlasButton />

            <LogoutButton />

            <div className="px-3 pt-1 text-center text-[10px] uppercase tracking-wider text-slate-600">
              VeyraOS • Version 1.2
            </div>
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
            VeyraOS
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