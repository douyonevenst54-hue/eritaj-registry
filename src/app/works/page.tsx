import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireVerifiedArtist } from "@/lib/guards";
import { artworkStatusLabel, mediumLabel } from "@/lib/labels";

export default async function MyWorksPage() {
  const { artist } = await requireVerifiedArtist();

  const works = await prisma.artwork.findMany({
    where: { artistId: artist.id },
    include: { images: { where: { kind: "FRONT" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section>
      <Link href="/dashboard" className="text-muted underline">Tounen</Link>
      <h1 className="font-display text-3xl mt-4">Zèv mwen yo</h1>

      <Link href="/works/new" className="block mt-8 bg-ink text-white px-6 py-4 rounded-md font-bold">
        Anrejistre yon nouvo zèv
      </Link>

      {works.length === 0 ? (
        <p className="mt-8 text-muted">Ou poko anrejistre okenn zèv.</p>
      ) : (
        <ul className="mt-10 space-y-6">
          {works.map((w) => {
            const href = w.status === "DRAFT" ? `/works/${w.id}` : `/w/${w.registryNumber}`;
            const thumb = w.images[0]?.url;
            return (
              <li key={w.id}>
                <Link href={href} className="flex gap-4 items-center group">
                  <div className="w-20 h-20 shrink-0 rounded-md bg-ink/10 overflow-hidden">
                    {thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold group-hover:underline">{w.title}</p>
                    <p className="text-muted text-base">
                      {mediumLabel[w.medium]}
                      {w.yearCreated ? `, ${w.yearCreated}` : ""}
                    </p>
                    <p className="text-base">
                      {w.registryNumber ?? artworkStatusLabel[w.status]}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
