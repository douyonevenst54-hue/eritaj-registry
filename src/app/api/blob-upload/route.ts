import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IMAGE_KINDS } from "@/lib/labels";

// Issues short-lived upload tokens so photos go straight from the phone to
// Vercel Blob (server actions are capped at 1 MB, photos are bigger).
// The database record is created afterwards by the attachImage action,
// which re-downloads and hashes the file.

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Not signed in");

        const { artworkId, kind } = JSON.parse(clientPayload ?? "{}") as {
          artworkId?: string;
          kind?: string;
        };
        if (!artworkId || !kind || !(IMAGE_KINDS as readonly string[]).includes(kind)) {
          throw new Error("Bad upload request");
        }

        const artwork = await prisma.artwork.findUnique({
          where: { id: artworkId },
          include: { artist: true },
        });
        if (
          !artwork ||
          artwork.status !== "DRAFT" ||
          artwork.artist.userId !== user.id ||
          artwork.artist.status !== "VERIFIED"
        ) {
          throw new Error("Not allowed");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ artworkId, kind, userId: user.id }),
        };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
