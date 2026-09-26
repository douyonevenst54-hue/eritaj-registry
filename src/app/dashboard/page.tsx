import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { artistStatusLabel, requireUser, roleLabel } from "@/lib/guards";
import { logout } from "./actions";

const linkClass = "block bg-ink text-white px-6 py-4 rounded-md font-bold";

export default async function DashboardPage() {
  const user = await requireUser();
  const canReview = user.role === "REVIEWER" || user.role === "ADMIN";

  const [artist, pendingCount] = await Promise.all([
    prisma.artist.findUnique({ where: { userId: user.id } }),
    canReview ? prisma.artist.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
  ]);

  return (
    <section>
      <h1 className="font-display text-3xl">Byenvini{user.name ? `, ${user.name}` : ""}</h1>
      <p className="mt-4">
        Ou konekte kòm <strong className="break-all">{user.email}</strong>.
      </p>
      <p className="mt-1 text-muted">Wòl: {roleLabel[user.role] ?? user.role}</p>

      <div className="mt-10 space-y-4">
        {artist ? (
          <Link href="/artist" className={linkClass}>
            Pwofil atis ou
            <span className="block font-normal text-base opacity-80">
              {artistStatusLabel[artist.status]}
            </span>
          </Link>
        ) : (
          <Link href="/artist" className={linkClass}>
            Ou se yon atis? Kreye pwofil ou
          </Link>
        )}

        {canReview && (
          <Link href="/review" className={linkClass}>
            Verifikasyon atis
            <span className="block font-normal text-base opacity-80">
              {pendingCount === 0 ? "Pa gen pesonn k ap tann" : `${pendingCount} k ap tann`}
            </span>
          </Link>
        )}

        {user.role === "ADMIN" && (
          <Link href="/admin/users" className={linkClass}>
            Jere itilizatè yo
          </Link>
        )}
      </div>

      <form action={logout} className="mt-12">
        <button type="submit" className="underline text-muted">Dekonekte</button>
      </form>
    </section>
  );
}
