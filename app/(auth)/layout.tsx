import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.getClaims();

  if (!error && data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {children}
    </main>
  );
}