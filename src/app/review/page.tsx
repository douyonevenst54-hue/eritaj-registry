import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";
import { suspendArtist, verifyArtist } from "./actions";

const messages: Record<string, string> = {
  incomplete: "Chwazi kijan ou verifye moun nan epi konfime anvan ou soumèt.",
  notfound: "Nou pa jwenn atis sa a.",
  self: "Ou pa ka verifye pwòp pwofil ou. Yon lòt revizè dwe fè l.",
  reason: "Ekri rezon an anvan ou sispann yon pwofil.",
  verified: "Atis la verifye.",
  suspended: "Pwofil la sispann.",
};

const methodLabel: Record<string, string> = { IN_PERSON: "an pèsòn", VIDEO: "pa videyo" };

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; done?: string }>;
}) {
  const reviewer = await requireRole(["REVIEWER", "ADMIN"]);
  const { error, done } = await searchParams;

  const [pending, recent] = await Promise.all([
    prisma.artist.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.artist.findMany({
      where: { status: { in: ["VERIFIED", "SUSPENDED"] } },
      include: { verifiedBy: true },
      orderBy: { verifiedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <section>
      <Link href="/dashboard" className="text-muted underline">Tounen</Link>
      <h1 className="font-display text-3xl mt-4">Verifikasyon atis</h1>
      <p className="mt-4 text-muted">
        Rankontre chak atis an pèsòn oswa pa videyo. Mande yon pyès idantite epi konpare non an
        ak pwofil la anvan ou verifye.
      </p>

      {error && messages[error] && <p role="alert" className="mt-6 text-hibiscus">{messages[error]}</p>}
      {done && messages[done] && (
        <p role="status" className="mt-6 border-l-4 border-sea pl-4">{messages[done]}</p>
      )}

      <h2 className="font-display text-2xl mt-10">Ap tann ({pending.length})</h2>

      {pending.length === 0 && (
        <p className="mt-4 text-muted">Pa gen okenn atis k ap tann kounye a.</p>
      )}

      <ul className="mt-6 space-y-10">
        {pending.map((a) => {
          const isSelf = a.userId === reviewer.id;
          return (
            <li key={a.id} className="border-t-2 border-ink/15 pt-6">
              <p className="font-display text-xl">{a.displayName}</p>
              <p className="mt-1">{a.user.name} &lt;{a.user.email}&gt;</p>
              <p className="mt-1 text-muted">
                {[a.hometown, a.birthYear ? `fèt ${a.birthYear}` : null].filter(Boolean).join(", ") ||
                  "Pa gen kote oswa ane"}
              </p>
              <p className="mt-1 text-muted text-base">
                Enskri {a.createdAt.toLocaleDateString("fr-HT")}
              </p>
              {(a.bioHt || a.bioFr || a.bioEn) && (
                <p className="mt-3 max-w-prose whitespace-pre-line">{a.bioHt || a.bioFr || a.bioEn}</p>
              )}

              {isSelf ? (
                <p className="mt-4 text-muted">Se pwofil pa w. Yon lòt revizè dwe verifye l.</p>
              ) : (
                <>
                  <form action={verifyArtist} className="mt-6 space-y-4">
                    <input type="hidden" name="artistId" value={a.id} />
                    <fieldset>
                      <legend className="font-bold">Kijan ou verifye moun nan?</legend>
                      <label className="flex items-center gap-3 mt-2">
                        <input type="radio" name="method" value="IN_PERSON" required /> An pèsòn
                      </label>
                      <label className="flex items-center gap-3 mt-1">
                        <input type="radio" name="method" value="VIDEO" /> Pa videyo
                      </label>
                    </fieldset>
                    <div>
                      <label htmlFor={`note-${a.id}`} className="block font-bold">Nòt (opsyonèl)</label>
                      <textarea id={`note-${a.id}`} name="note" rows={2} maxLength={1000}
                        className="mt-2 w-full rounded-md border-2 border-ink/30 bg-white px-4 py-3" />
                    </div>
                    <label className="flex items-start gap-3">
                      <input type="checkbox" name="confirm" value="yes" required className="mt-1.5" />
                      <span>Mwen te wè moun sa a, epi idantite l koresponn ak non ki sou pwofil la.</span>
                    </label>
                    <button type="submit" className="bg-ink text-white px-6 py-3 rounded-md font-bold">
                      Verifye atis la
                    </button>
                  </form>

                  <details className="mt-6">
                    <summary className="cursor-pointer text-muted underline">Sispann pwofil sa a</summary>
                    <form action={suspendArtist} className="mt-4 space-y-3">
                      <input type="hidden" name="artistId" value={a.id} />
                      <label htmlFor={`reason-${a.id}`} className="block font-bold">Rezon</label>
                      <textarea id={`reason-${a.id}`} name="note" rows={2} required maxLength={1000}
                        className="w-full rounded-md border-2 border-ink/30 bg-white px-4 py-3" />
                      <button type="submit"
                        className="border-2 border-hibiscus text-hibiscus px-6 py-3 rounded-md font-bold">
                        Sispann pwofil la
                      </button>
                    </form>
                  </details>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {recent.length > 0 && (
        <>
          <h2 className="font-display text-2xl mt-14">Dènye desizyon</h2>
          <ul className="mt-4 space-y-2">
            {recent.map((a) => (
              <li key={a.id}>
                <strong>{a.displayName}</strong>:{" "}
                {a.status === "VERIFIED"
                  ? `verifye ${a.verificationMethod ? methodLabel[a.verificationMethod] : ""}`
                  : "sispann"}
                {a.verifiedBy ? ` pa ${a.verifiedBy.name ?? a.verifiedBy.email}` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
