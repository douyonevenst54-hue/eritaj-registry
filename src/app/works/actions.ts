"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireVerifiedArtist } from "@/lib/guards";
import { GENESIS_HASH, sha256Hex } from "@/lib/canonical";
import {
  buildStatement,
  normalizeName,
  STATEMENT_LOCALES,
  type StatementLocale,
} from "@/lib/declaration";
import {
  IMAGE_KINDS,
  MAX_DETAIL_IMAGES,
  MEDIUMS,
  REQUIRED_KINDS,
  type ImageKindName,
} from "@/lib/labels";
import {
  computeContentHash,
  computeDeclarationHash,
  computeEventHash,
  type EventForHash,
} from "@/lib/provenance";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export type FormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

// ───────────────────────── helpers ─────────────────────────

function str(formData: FormData, key: string, max: number): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v ? v.slice(0, max) : null;
}

function parseDims(raw: string | null): number | null | "bad" {
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 10000) return "bad";
  return Math.round(n * 10) / 10;
}

type Details = {
  title: string;
  titleHt: string | null;
  yearCreated: number | null;
  medium: (typeof MEDIUMS)[number];
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  description: string | null;
};

function parseDetails(formData: FormData): { ok: true; data: Details } | { ok: false; message: string } {
  const title = str(formData, "title", 150);
  if (!title) return { ok: false, message: "Bay zèv la yon tit." };

  const medium = String(formData.get("medium") ?? "");
  if (!(MEDIUMS as readonly string[]).includes(medium)) {
    return { ok: false, message: "Chwazi ki kalite zèv li ye." };
  }

  let yearCreated: number | null = null;
  const yearRaw = str(formData, "yearCreated", 4);
  if (yearRaw) {
    yearCreated = Number(yearRaw);
    if (!Number.isInteger(yearCreated) || yearCreated < 1900 || yearCreated > new Date().getFullYear()) {
      return { ok: false, message: "Ane a pa bon. Egzanp: 2019." };
    }
  }

  const widthCm = parseDims(str(formData, "widthCm", 10));
  const heightCm = parseDims(str(formData, "heightCm", 10));
  const depthCm = parseDims(str(formData, "depthCm", 10));
  if (widthCm === "bad" || heightCm === "bad" || depthCm === "bad") {
    return { ok: false, message: "Mezi yo dwe an santimèt, egzanp 60 oswa 45.5." };
  }

  return {
    ok: true,
    data: {
      title,
      titleHt: str(formData, "titleHt", 150),
      yearCreated,
      medium: medium as Details["medium"],
      widthCm,
      heightCm,
      depthCm,
      description: str(formData, "description", 3000),
    },
  };
}

async function loadOwnDraft(artworkId: string, artistId: string) {
  const artwork = await prisma.artwork.findUnique({
    where: { id: artworkId },
    include: { images: true },
  });
  if (!artwork || artwork.artistId !== artistId || artwork.status !== "DRAFT") return null;
  return artwork;
}

async function deleteBlobs(urls: string[]) {
  if (urls.length === 0) return;
  try {
    await del(urls);
  } catch (err) {
    console.error("Blob delete failed", err); // orphaned files are harmless; don't block the user
  }
}

// ───────────────────────── drafts ─────────────────────────

export async function createDraft(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, artist } = await requireVerifiedArtist();
  const parsed = parseDetails(formData);
  if (!parsed.ok) return { status: "error", message: parsed.message };

  const artwork = await prisma.artwork.create({
    data: { ...parsed.data, artistId: artist.id, currentOwnerId: user.id },
  });
  redirect(`/works/${artwork.id}`);
}

export async function updateDraft(_prev: FormState, formData: FormData): Promise<FormState> {
  const { artist } = await requireVerifiedArtist();
  const artworkId = String(formData.get("artworkId") ?? "");
  const draft = await loadOwnDraft(artworkId, artist.id);
  if (!draft) return { status: "error", message: "Nou pa jwenn bouyon sa a." };

  const parsed = parseDetails(formData);
  if (!parsed.ok) return { status: "error", message: parsed.message };

  await prisma.artwork.update({ where: { id: draft.id }, data: parsed.data });
  revalidatePath(`/works/${draft.id}`);
  return { status: "saved" };
}

export async function deleteDraft(formData: FormData): Promise<void> {
  const { artist } = await requireVerifiedArtist();
  const draft = await loadOwnDraft(String(formData.get("artworkId") ?? ""), artist.id);
  if (draft) {
    await prisma.artwork.delete({ where: { id: draft.id } });
    await deleteBlobs(draft.images.map((i) => i.url));
  }
  revalidatePath("/works");
  redirect("/works");
}

// ───────────────────────── photos ─────────────────────────

export async function attachImage(input: {
  artworkId: string;
  kind: string;
  url: string;
  clientSha256: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { artist } = await requireVerifiedArtist();

  const reject = async (message: string) => {
    await deleteBlobs([input.url]);
    return { ok: false as const, message };
  };

  if (!(IMAGE_KINDS as readonly string[]).includes(input.kind)) return reject("Kalite foto a pa bon.");
  const kind = input.kind as ImageKindName;

  // Only accept files from our own Blob store, uploaded under this artwork's folder.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.url);
  } catch {
    return { ok: false, message: "Lyen foto a pa bon." };
  }
  if (
    parsedUrl.protocol !== "https:" ||
    !parsedUrl.hostname.endsWith(".blob.vercel-storage.com") ||
    !parsedUrl.pathname.startsWith(`/artworks/${input.artworkId}/`)
  ) {
    return { ok: false, message: "Lyen foto a pa bon." };
  }

  const draft = await loadOwnDraft(input.artworkId, artist.id);
  if (!draft) return reject("Nou pa jwenn bouyon sa a.");

  // Hash the file ourselves: the stored fingerprint must come from the server.
  const res = await fetch(input.url, { cache: "no-store" });
  if (!res.ok) return reject("Nou pa t ka li foto a. Eseye ankò.");
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_PHOTO_BYTES) return reject("Foto a twò gwo (maksimòm 15 MB).");

  const sha256 = sha256Hex(bytes);
  if (sha256 !== input.clientSha256.toLowerCase()) {
    return reject("Foto a pa rive byen. Eseye voye l ankò.");
  }

  const sameKind = draft.images.filter((i) => i.kind === kind);
  if (kind === "DETAIL") {
    if (sameKind.length >= MAX_DETAIL_IMAGES) {
      return reject(`Ou ka mete jiska ${MAX_DETAIL_IMAGES} foto detay.`);
    }
    if (sameKind.some((i) => i.sha256 === sha256)) return reject("Foto sa a deja la.");
  } else if (sameKind.length > 0) {
    // One photo per kind: the new one replaces the old one.
    await prisma.artworkImage.deleteMany({ where: { id: { in: sameKind.map((i) => i.id) } } });
    await deleteBlobs(sameKind.map((i) => i.url));
  }

  await prisma.artworkImage.create({
    data: { artworkId: draft.id, kind, url: input.url, sha256 },
  });

  revalidatePath(`/works/${draft.id}`);
  return { ok: true };
}

export async function removeImage(formData: FormData): Promise<void> {
  const { artist } = await requireVerifiedArtist();
  const imageId = String(formData.get("imageId") ?? "");

  const image = await prisma.artworkImage.findUnique({
    where: { id: imageId },
    include: { artwork: true },
  });
  if (!image || image.artwork.artistId !== artist.id || image.artwork.status !== "DRAFT") return;

  await prisma.artworkImage.delete({ where: { id: image.id } });
  await deleteBlobs([image.url]);
  revalidatePath(`/works/${image.artworkId}`);
}

// ───────────────────────── registration ─────────────────────────

export async function registerArtwork(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, artist } = await requireVerifiedArtist();
  const draft = await loadOwnDraft(String(formData.get("artworkId") ?? ""), artist.id);
  if (!draft) return { status: "error", message: "Nou pa jwenn bouyon sa a." };

  const missing = REQUIRED_KINDS.filter((k) => !draft.images.some((i) => i.kind === k));
  if (missing.length > 0) {
    return { status: "error", message: "Ou bezwen foto devan zèv la ak foto ou menm ak zèv la." };
  }

  const locale = String(formData.get("locale") ?? "ht") as StatementLocale;
  if (!STATEMENT_LOCALES.includes(locale)) return { status: "error", message: "Chwazi yon lang." };

  if (!user.name) {
    return { status: "error", message: "Ajoute non konplè ou nan pwofil atis ou anvan." };
  }
  const signedName = String(formData.get("signedName") ?? "").trim().slice(0, 120);
  if (normalizeName(signedName) !== normalizeName(user.name)) {
    return {
      status: "error",
      message: "Non ou tape a pa menm ak non konplè ki nan pwofil ou. Tape l egzakteman.",
    };
  }
  if (formData.get("confirm") !== "yes") {
    return { status: "error", message: "Konfime ou konprann deklarasyon an piblik." };
  }

  const statementText = buildStatement(locale, artist.displayName, draft.title, draft.yearCreated);
  const now = new Date();
  const year = now.getUTCFullYear();

  let registryNumber: string;
  try {
    registryNumber = await prisma.$transaction(async (tx) => {
      const counter = await tx.registryCounter.upsert({
        where: { year },
        create: { year, last: 1 },
        update: { last: { increment: 1 } },
      });
      const number = `ERT-${year}-${String(counter.last).padStart(6, "0")}`;

      const declaration = { statementLocale: locale, statementText, signedName, signedAt: now };
      const declarationHash = computeDeclarationHash(declaration);

      const contentHash = computeContentHash({
        ...draft,
        registryNumber: number,
        images: draft.images,
        declarationHash,
      });

      // Guard against a double submit: only a DRAFT can become REGISTERED.
      const claimed = await tx.artwork.updateMany({
        where: { id: draft.id, status: "DRAFT" },
        data: { status: "REGISTERED", registryNumber: number, contentHash, registeredAt: now },
      });
      if (claimed.count !== 1) throw new Error("already registered");

      await tx.artistDeclaration.create({
        data: { artworkId: draft.id, ...declaration, declarationHash },
      });

      const events: Omit<EventForHash, "seq">[] = [];
      if (draft.yearCreated) {
        events.push({
          artworkId: draft.id,
          type: "CREATED",
          occurredAt: new Date(Date.UTC(draft.yearCreated, 0, 1)),
          location: artist.hometown,
          publicNote: null,
          privateNote: null,
          recordedById: user.id,
        });
      }
      events.push({
        artworkId: draft.id,
        type: "REGISTERED",
        occurredAt: now,
        location: null,
        publicNote: null,
        privateNote: null,
        recordedById: user.id,
      });

      let prevHash = GENESIS_HASH;
      for (const [seq, e] of events.entries()) {
        const rowHash = computeEventHash(prevHash, { ...e, seq }, contentHash);
        await tx.provenanceEvent.create({
          data: {
            artworkId: e.artworkId,
            type: e.type as "CREATED" | "REGISTERED",
            occurredAt: e.occurredAt,
            location: e.location,
            publicNote: e.publicNote,
            privateNote: e.privateNote,
            recordedById: e.recordedById,
            seq,
            prevHash,
            rowHash,
          },
        });
        prevHash = rowHash;
      }

      return number;
    });
  } catch (err) {
    console.error(err);
    return { status: "error", message: "Anrejistreman an pa pase. Eseye ankò nan yon moman." };
  }

  revalidatePath("/works");
  redirect(`/w/${registryNumber}`);
}
