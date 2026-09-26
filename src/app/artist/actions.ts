"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";

export type ArtistFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

function text(formData: FormData, key: string, max: number): string | null {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  return value.slice(0, max);
}

export async function saveArtistProfile(
  _prev: ArtistFormState,
  formData: FormData,
): Promise<ArtistFormState> {
  const user = await requireUser();

  const fullName = text(formData, "fullName", 120);
  const displayName = text(formData, "displayName", 80);
  const hometown = text(formData, "hometown", 80);
  const bioHt = text(formData, "bioHt", 2000);
  const bioFr = text(formData, "bioFr", 2000);
  const bioEn = text(formData, "bioEn", 2000);
  const yearRaw = text(formData, "birthYear", 4);

  if (!fullName || fullName.length < 2) {
    return { status: "error", message: "Ekri non konplè ou." };
  }

  let birthYear: number | null = null;
  if (yearRaw) {
    birthYear = Number(yearRaw);
    const thisYear = new Date().getFullYear();
    if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > thisYear - 10) {
      return { status: "error", message: "Ane ou fèt la pa bon. Egzanp: 1975." };
    }
  }

  const existing = await prisma.artist.findUnique({ where: { userId: user.id } });

  if (existing?.status === "SUSPENDED") {
    return { status: "error", message: "Pwofil sa a sispann. Kontakte KHADA." };
  }

  // Once verified, the signing name is locked: changing it would defeat verification.
  const locked = existing?.status === "VERIFIED";
  if (!locked && (!displayName || displayName.length < 2)) {
    return { status: "error", message: "Ekri non ou siyen zèv ou yo." };
  }

  const shared = { hometown, bioHt, bioFr, bioEn, birthYear };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        name: fullName,
        // Don't downgrade reviewers or admins who are also artists.
        ...(user.role === "COLLECTOR" ? { role: "ARTIST" as const } : {}),
      },
    });

    if (existing) {
      await tx.artist.update({
        where: { id: existing.id },
        data: locked ? shared : { ...shared, displayName: displayName! },
      });
    } else {
      await tx.artist.create({
        data: { userId: user.id, displayName: displayName!, ...shared },
      });
    }
  });

  revalidatePath("/artist");
  revalidatePath("/dashboard");
  return { status: "saved" };
}
