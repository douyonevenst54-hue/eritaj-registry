import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/auth";
import { verifyIntegrity } from "@/lib/provenance";
import { eventLabel, imageKindLabel, mediumLabel } from "@/lib/labels";

// Public record page. Anyone with the link (or the QR code on the back of the
// work) can see it. No emails, legal names, prices, or private notes appear here.

async function loadWork(registryNumber: string) {
  return prisma.artwork.findUnique({
    where: { registryNumber },
    include: {
      artist: true,
      images: { orderBy: { createdAt: "asc" } },
      declaration: true,
      events: { orderBy: { seq: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ registryNumber: string }>;
}): Promise<Metadata> {
  const { registryNumber } = await params;
  const work = await loadWork(registryNumber);
  if (!work || work.status === "DRAFT") return { title: "Eritaj Registry" };
  return {
    title: `${work.title} (${work.artist.displayName}) · ${registryNumber}`,
    description: `Dosye piblik Eritaj Registry pou «${work.title}» pa ${work.artist.displayName}.`,
  };
}

const kindOrder = ["FRONT", "DETAIL", "SIGNATURE", "BACK", "ARTIST_WITH_WORK"];

export default async function PublicWorkPage({
  params,
}: {
  params: Promise<{ registryNumber: string }>;
}) {
  const { registryNumber } = await params;
  const work = await loadWork(registryNumber);
  if (!work || work.status === "DRAFT") notFound();

  const integrity = verifyIntegrity({
    artwork: work,
    declaration: work.declaration,
    events: work.events,
  });

  const pageUrl = `${appUrl()}/w/${registryNumber}`;
  const qrSvg = await QRCode.toString(pageUrl, {
    type: "svg",
    margin: 1,
    color: { dark: "#1d2451", light: "#ffffff" },
  });

  const images = [...work.images].sort(
    (a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind),
  );
  const [hero, ...rest] = images;

  const dims = [work.widthCm, work.heightCm, work.depthCm]
    .filter((v) => v != null)
    .map((v) => Number(v).toString());

  const owner =
    work.currentOwnerId === work.artist.userId
      ? "Atis la kenbe l"
      : "Nan men yon kolektè prive";

  return (
    <article>
      <p className="font-mono text-base text-muted">{registryNumber}</p>
      <h1 className="font-display text-4xl mt-2 leading-tight">{work.title}</h1>
      {work.titleHt && work.titleHt !== work.title && (
        <p className="mt-1 text-xl text-muted">{work.titleHt}</p>
      )}
      <p className="mt-3 text-xl">
        {work.artist.displayName}
        {work.artist.hometown ? `, ${work.artist.hometown}` : ""}
      </p>

      {work.status === "DISPUTED" && (
        <p role="alert" className="mt-6 border-l-4 border-hibiscus pl-4 text-hibiscus">
          Gen yon kontestasyon louvri sou dosye sa a. KHADA ap egzamine l.
        </p>
      )}

      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero.url} alt={`${work.title}, ${imageKindLabel[hero.kind].label}`}
          className="mt-8 w-full rounded-md bg-ink/10" />
      )}
      {rest.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3">
          {rest.map((img) => (
            <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={imageKindLabel[img.kind].label}
                className="w-full aspect-square object-cover rounded-md bg-ink/10" />
            </a>
          ))}
        </div>
      )}

      <dl className="mt-10 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="text-muted">Kalite</dt>
        <dd>{mediumLabel[work.medium]}</dd>
        {work.yearCreated && (<><dt className="text-muted">Ane</dt><dd>{work.yearCreated}</dd></>)}
        {dims.length > 0 && (<><dt className="text-muted">Mezi</dt><dd>{dims.join(" × ")} cm</dd></>)}
        <dt className="text-muted">Kote li ye</dt>
        <dd>{owner}</dd>
        {work.registeredAt && (
          <><dt className="text-muted">Anrejistre</dt><dd>{work.registeredAt.toLocaleDateString("fr-HT")}</dd></>
        )}
      </dl>

      {work.description && <p className="mt-8 max-w-prose whitespace-pre-line">{work.description}</p>}

      {work.declaration && (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Deklarasyon atis la</h2>
          <blockquote className="mt-4 border-l-4 border-sun bg-white px-5 py-4 rounded-r-md">
            {work.declaration.statementText}
          </blockquote>
          <p className="mt-2 text-base text-muted">
            Siyen {work.declaration.signedAt.toLocaleDateString("fr-HT")}
          </p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl">Istwa zèv la</h2>
        <ol className="mt-4 space-y-3">
          {work.events.map((e) => (
            <li key={e.id} className="border-l-4 border-sea pl-4">
              <p className="font-bold">{eventLabel[e.type] ?? e.type}</p>
              <p className="text-muted text-base">
                {e.type === "CREATED"
                  ? e.occurredAt.getUTCFullYear()
                  : e.occurredAt.toLocaleDateString("fr-HT")}
                {e.location ? `, ${e.location}` : ""}
              </p>
              {e.publicNote && <p className="mt-1">{e.publicNote}</p>}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Entegrite dosye a</h2>
        {integrity.ok ? (
          <p className="mt-4 border-l-4 border-sea pl-4">
            ✓ Foto yo, deklarasyon an ak istwa a koresponn egzakteman ak anprent ki te anrejistre yo.
          </p>
        ) : (
          <p role="alert" className="mt-4 border-l-4 border-hibiscus pl-4 text-hibiscus">
            Atansyon: dosye sa a pa koresponn ak anprent orijinal li. Kontakte KHADA.
          </p>
        )}
        {work.contentHash && (
          <p className="mt-3 font-mono text-sm text-muted break-all">
            Anprent: {work.contentHash}
          </p>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">QR kòd</h2>
        <p className="mt-2 text-muted">
          Enprime l epi kole l dèyè zèv la. Nenpòt moun ka eskane l pou wè dosye sa a.
        </p>
        <div
          className="mt-4 w-48 h-48 bg-white p-2 rounded-md"
          aria-label={`QR kòd pou ${pageUrl}`}
          role="img"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </section>

      <p className="mt-14 text-base text-muted max-w-prose">
        Eritaj Registry anrejistre sa atis la deklare. Li pa sètifye otantisite zèv la.
        <br />
        Eritaj Registry records what the artist declared. It does not certify authenticity.
      </p>
    </article>
  );
}
