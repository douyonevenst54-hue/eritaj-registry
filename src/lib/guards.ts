import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { prisma } from "./prisma";

export type RoleName = "ARTIST" | "COLLECTOR" | "REVIEWER" | "ADMIN";

/** Returns the logged-in user or sends them to /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Returns the user if their role is allowed, otherwise back to the dashboard. */
export async function requireRole(allowed: RoleName[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role as RoleName)) redirect("/dashboard");
  return user;
}

/** Only verified artists can register works. Others go to their profile page. */
export async function requireVerifiedArtist() {
  const user = await requireUser();
  const artist = await prisma.artist.findUnique({ where: { userId: user.id } });
  if (!artist || artist.status !== "VERIFIED") redirect("/artist");
  return { user, artist };
}

export const artistStatusLabel: Record<string, string> = {
  PENDING: "Ap tann verifikasyon",
  VERIFIED: "Verifye",
  SUSPENDED: "Sispann",
};

export const roleLabel: Record<string, string> = {
  ARTIST: "Atis",
  COLLECTOR: "Kolektè",
  REVIEWER: "Revizè",
  ADMIN: "Administratè",
};
