import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

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
