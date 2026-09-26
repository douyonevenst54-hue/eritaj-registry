import { canonical, GENESIS_HASH, sha256Hex } from "./canonical";

// ── Shapes used for hashing (kept structural so any Prisma result fits) ──

type Dim = { toString(): string } | number | null;

export type ArtworkForHash = {
  registryNumber: string | null;
  artistId: string;
  title: string;
  titleHt: string | null;
  yearCreated: number | null;
  medium: string;
  widthCm: Dim;
  heightCm: Dim;
  depthCm: Dim;
  description: string | null;
  images: { kind: string; sha256: string }[];
  declarationHash: string | null;
};

export type DeclarationForHash = {
  statementLocale: string;
  statementText: string;
  signedName: string;
  signedAt: Date;
};

export type EventForHash = {
  artworkId: string;
  seq: number;
  type: string;
  occurredAt: Date;
  location: string | null;
  publicNote: string | null;
  privateNote: string | null;
  recordedById: string;
};

const dim = (d: Dim) => (d === null || d === undefined ? null : Number(d.toString()).toFixed(1));

// ── Hashes ──

/** Fingerprint of everything registered: fields, photo hashes, and the declaration. */
export function computeContentHash(a: ArtworkForHash): string {
  const images = a.images
    .map((i) => ({ kind: i.kind, sha256: i.sha256 }))
    .sort((x, y) => `${x.kind}:${x.sha256}`.localeCompare(`${y.kind}:${y.sha256}`));

  return sha256Hex(
    canonical({
      v: 1,
      registryNumber: a.registryNumber,
      artistId: a.artistId,
      title: a.title,
      titleHt: a.titleHt,
      yearCreated: a.yearCreated,
      medium: a.medium,
      widthCm: dim(a.widthCm),
      heightCm: dim(a.heightCm),
      depthCm: dim(a.depthCm),
      description: a.description,
      images,
      declarationHash: a.declarationHash,
    }),
  );
}

export function computeDeclarationHash(d: DeclarationForHash): string {
  return sha256Hex(
    canonical({
      v: 1,
      statementLocale: d.statementLocale,
      statementText: d.statementText,
      signedName: d.signedName,
      signedAt: d.signedAt.toISOString(),
    }),
  );
}

/**
 * Each event hashes the previous event's hash plus its own data.
 * The REGISTERED event also carries the content hash, tying photos and
 * declaration into the chain.
 */
export function computeEventHash(prevHash: string, e: EventForHash, contentHash: string | null): string {
  return sha256Hex(
    prevHash +
      canonical({
        v: 1,
        artworkId: e.artworkId,
        seq: e.seq,
        type: e.type,
        occurredAt: e.occurredAt.toISOString(),
        location: e.location,
        publicNote: e.publicNote,
        privateNoteHash: e.privateNote ? sha256Hex(e.privateNote) : null,
        recordedById: e.recordedById,
        contentHash: e.type === "REGISTERED" ? contentHash : null,
      }),
  );
}

// ── Verification ──

export type IntegrityResult = { ok: true } | { ok: false; reason: string };

export function verifyIntegrity(input: {
  artwork: Omit<ArtworkForHash, "declarationHash"> & { contentHash: string | null };
  declaration: (DeclarationForHash & { declarationHash: string }) | null;
  events: (EventForHash & { prevHash: string; rowHash: string })[];
}): IntegrityResult {
  const { artwork, declaration, events } = input;
  if (!artwork.contentHash) return { ok: false, reason: "missing content hash" };
  if (!declaration) return { ok: false, reason: "missing declaration" };

  if (computeDeclarationHash(declaration) !== declaration.declarationHash) {
    return { ok: false, reason: "declaration changed" };
  }

  const content = computeContentHash({ ...artwork, declarationHash: declaration.declarationHash });
  if (content !== artwork.contentHash) return { ok: false, reason: "content changed" };

  let prev = GENESIS_HASH;
  const sorted = [...events].sort((a, b) => a.seq - b.seq);
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    if (e.seq !== i) return { ok: false, reason: `gap at event ${i}` };
    if (e.prevHash !== prev) return { ok: false, reason: `broken link at event ${i}` };
    const h = computeEventHash(prev, e, artwork.contentHash);
    if (h !== e.rowHash) return { ok: false, reason: `event ${i} changed` };
    prev = h;
  }
  return { ok: true };
}
