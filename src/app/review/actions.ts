"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

const METHODS = ["IN_PERSON", "VIDEO"] as const;
type Method = (typeof METHODS)[number];

export async function verifyArtist(formData: FormData): Promise<void> {
  const reviewer = await requireRole(["REVIEWER", "ADMIN"]);

  const artistId = String(formData.get("artistId") ?? "");
  const method = String(formData.get("method") ?? "") as Method;
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;
  const confirmed = formData.get("confirm") === "yes";

  if (!artistId || !METHODS.includes(method) || !confirmed) {
    redirect("/review?error=incomplete");
  }

  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) redirect("/review?error=notfound");

  // Nobody verifies themselves.
  if (artist.userId === reviewer.id) redirect("/review?error=self");

  // Only a PENDING artist can be verified; guards against double submits.
  await prisma.artist.updateMany({
    where: { id: artistId, status: "PENDING" },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verifiedById: reviewer.id,
      verificationMethod: method,
      verificationNote: note,
    },
  });

  revalidatePath("/review");
  redirect("/review?done=verified");
}

export async function suspendArtist(formData: FormData): Promise<void> {
  const reviewer = await requireRole(["REVIEWER", "ADMIN"]);

  const artistId = String(formData.get("artistId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000);

  if (!artistId || !note) redirect("/review?error=reason");

  const artist = await prisma.artist.findUnique({ where: { id: artistId } });
  if (!artist) redirect("/review?error=notfound");
  if (artist.userId === reviewer.id) redirect("/review?error=self");

  await prisma.artist.update({
    where: { id: artistId },
    data: { status: "SUSPENDED", verificationNote: note, verifiedById: reviewer.id },
  });

  revalidatePath("/review");
  redirect("/review?done=suspended");
}
