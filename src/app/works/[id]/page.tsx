import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireVerifiedArtist } from "@/lib/guards";
import { IMAGE_KINDS, imageKindLabel, MAX_DETAIL_IMAGES, REQUIRED_KINDS } from "@/lib/labels";
import { deleteDraft, removeImage } from "../actions";
import { WorkDetailsForm } from "../work-details-form";
import { PhotoSlot } from "./photo-slot";
import { RegisterForm } from "./register-form";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { artist } = await requireVerifiedArtist();

  const artwork = await prisma.artwork.findUnique({
    where: { id },
    include: { images: { orderBy: { createdAt: "asc" } } },
  });
  if (!artwork || artwork.artistId !== artist.id) notFound();
  if (artwork.status !== "DRAFT") {
    redirect(artwork.registryNumber ? `/w/${artwork.registryNumber}` : "/works");
  }

  const ready = REQUIRED_KINDS.every((k) => artwork.images.some((i) => i.kind === k));
  const d = (v: unknown) => (v == null ? "" : String(v));

  return (
    <section>
      <Link href="/works" className="text-muted underline">Tounen</Link>
      <h1 className="font-display text-3xl mt-4">{artwork.title}</h1>
      <p className="mt-2 text-muted">Bouyon: anyen pa piblik toutotan ou pa anrejistre l.</p>

      {/* 1. Details */}
      <details className="mt-10">
        <summary className="font-display text-2xl cursor-pointer">1. Detay zèv la</summary>
        <div className="mt-6">
          <WorkDetailsForm
            initial={{
              artworkId: artwork.id,
              title: artwork.title,
              titleHt: d(artwork.titleHt),
              yearCreated: d(artwork.yearCreated),
              medium: artwork.medium,
              widthCm: d(artwork.widthCm),
              heightCm: d(artwork.heightCm),
              depthCm: d(artwork.depthCm),
              description: d(artwork.description),
            }}
          />
        </div>
      </details>

      {/* 2. Photos */}
      <h2 className="font-display text-2xl mt-12">2. Foto yo</h2>
      <ul className="mt-6 space-y-10">
        {IMAGE_KINDS.map((kind) => {
          const imgs = artwork.images.filter((i) => i.kind === kind);
          const required = REQUIRED_KINDS.includes(kind);
          const canAdd = kind === "DETAIL" ? imgs.length < MAX_DETAIL_IMAGES : true;
          return (
            <li key={kind}>
              <p className="font-bold">
                {imageKindLabel[kind].label}
                {required && <span className="text-hibiscus"> (obligatwa)</span>}
              </p>
              <p className="text-base text-muted">{imageKindLabel[kind].hint}</p>

              {imgs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {imgs.map((img) => (
                    <div key={img.id} className="w-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={imageKindLabel[kind].label}
                        className="w-36 h-36 object-cover rounded-md bg-ink/10" />
                      <form action={removeImage}>
                        <input type="hidden" name="imageId" value={img.id} />
                        <button type="submit" className="mt-1 text-base text-muted underline">Retire</button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {canAdd && (
                <PhotoSlot
                  artworkId={artwork.id}
                  kind={kind}
                  buttonLabel={imgs.length > 0 && kind !== "DETAIL" ? "Ranplase foto a" : "Ajoute yon foto"}
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* 3. Declaration */}
      <h2 className="font-display text-2xl mt-14">3. Deklarasyon ak siyati</h2>
      <p className="mt-2 text-muted">
        Eritaj anrejistre sa ou deklare. Li pa sètifye otantisite zèv la, men li kenbe yon dosye ki
        pa ka chanje an kachèt.
      </p>
      <div className="mt-6">
        <RegisterForm
          artworkId={artwork.id}
          displayName={artist.displayName}
          title={artwork.title}
          year={artwork.yearCreated}
          ready={ready}
        />
      </div>

      <form action={deleteDraft} className="mt-16 border-t-2 border-ink/15 pt-6">
        <input type="hidden" name="artworkId" value={artwork.id} />
        <button type="submit" className="text-hibiscus underline">Efase bouyon sa a</button>
      </form>
    </section>
  );
}
