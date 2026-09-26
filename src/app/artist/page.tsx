import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { artistStatusLabel, requireUser } from "@/lib/guards";
import { ArtistForm } from "./artist-form";

export default async function ArtistPage() {
  const user = await requireUser();
  const artist = await prisma.artist.findUnique({ where: { userId: user.id } });

  return (
    <section>
      <Link href="/dashboard" className="text-muted underline">Tounen</Link>
      <h1 className="font-display text-3xl mt-4">Pwofil atis</h1>

      {artist ? (
        <p className="mt-4">
          Estati: <strong>{artistStatusLabel[artist.status]}</strong>
        </p>
      ) : null}

      <p className="mt-4 text-muted">
        {artist?.status === "VERIFIED"
          ? "Idantite w konfime. Ou ka anrejistre zèv ou yo."
          : "Ranpli pwofil ou. Yon revizè KHADA ap kontakte w pou konfime idantite w, an pèsòn oswa pa videyo. Apre sa, w ap ka anrejistre zèv ou yo."}
      </p>

      {artist?.status === "SUSPENDED" ? (
        <p className="mt-6 text-hibiscus">Pwofil sa a sispann. Kontakte KHADA pou plis enfòmasyon.</p>
      ) : (
        <ArtistForm
          initial={{
            fullName: user.name ?? "",
            displayName: artist?.displayName ?? "",
            birthYear: artist?.birthYear ? String(artist.birthYear) : "",
            hometown: artist?.hometown ?? "",
            bioHt: artist?.bioHt ?? "",
            bioFr: artist?.bioFr ?? "",
            bioEn: artist?.bioEn ?? "",
            nameLocked: artist?.status === "VERIFIED",
            isNew: !artist,
          }}
        />
      )}
    </section>
  );
}
