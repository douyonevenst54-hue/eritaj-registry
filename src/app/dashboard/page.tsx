import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./actions";

const roleLabel: Record<string, string> = {
  ARTIST: "Atis",
  COLLECTOR: "Kolektè",
  REVIEWER: "Revizè",
  ADMIN: "Administratè",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <section>
      <h1 className="font-display text-3xl">Byenvini</h1>
      <p className="mt-4">
        Ou konekte kòm <strong>{user.email}</strong>.
      </p>
      <p className="mt-1 text-muted">Wòl: {roleLabel[user.role] ?? user.role}</p>

      <form action={logout} className="mt-10">
        <button type="submit" className="underline text-muted">
          Dekonekte
        </button>
      </form>
    </section>
  );
}
