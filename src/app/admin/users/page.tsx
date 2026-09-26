import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { artistStatusLabel, requireRole, roleLabel } from "@/lib/guards";
import { setReviewer } from "./actions";

export default async function AdminUsersPage() {
  const admin = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    include: { artist: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <section>
      <Link href="/dashboard" className="text-muted underline">Tounen</Link>
      <h1 className="font-display text-3xl mt-4">Itilizatè yo</h1>
      <p className="mt-4 text-muted">
        Bay wòl revizè sèlman a moun KHADA fè konfyans. Yon revizè ka verifye atis yo.
      </p>

      <ul className="mt-8 space-y-6">
        {users.map((u) => (
          <li key={u.id} className="border-t-2 border-ink/15 pt-4">
            <p className="font-bold">{u.name ?? "San non"}</p>
            <p className="text-muted break-all">{u.email}</p>
            <p className="mt-1">
              {roleLabel[u.role]}
              {u.artist ? `, pwofil atis: ${artistStatusLabel[u.artist.status]}` : ""}
            </p>

            {u.id !== admin.id && u.role !== "ADMIN" && (
              <form action={setReviewer} className="mt-3">
                <input type="hidden" name="userId" value={u.id} />
                <input type="hidden" name="makeReviewer" value={u.role === "REVIEWER" ? "no" : "yes"} />
                <button type="submit" className="underline">
                  {u.role === "REVIEWER" ? "Retire wòl revizè" : "Fè l revizè"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
