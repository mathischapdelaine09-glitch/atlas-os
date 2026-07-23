"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const status = (formData.get("status") as string) || "IN_PROGRESS";

  if (!title) return;

  await prisma.project.create({
    data: {
      title,
      description: description || "",
      status,
      color: "#6366f1",
      startDate: new Date(),
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({
    where: { id },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}