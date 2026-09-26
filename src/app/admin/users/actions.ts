"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

/** Admins can grant or remove the REVIEWER role. ADMIN comes only from ADMIN_EMAILS. */
export async function setReviewer(formData: FormData): Promise<void> {
  const admin = await requireRole(["ADMIN"]);
  const userId = String(formData.get("userId") ?? "");
  const makeReviewer = formData.get("makeReviewer") === "yes";

  if (!userId || userId === admin.id) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { artist: true },
  });
  if (!target || target.role === "ADMIN") return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: makeReviewer ? "REVIEWER" : target.artist ? "ARTIST" : "COLLECTOR" },
  });

  revalidatePath("/admin/users");
}
