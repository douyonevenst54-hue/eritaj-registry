"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { attachImage } from "../actions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 15 * 1024 * 1024;

async function sha256OfFile(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function PhotoSlot({
  artworkId,
  kind,
  buttonLabel,
}: {
  artworkId: string;
  kind: string;
  buttonLabel: string;
}) {
  const inputId = useId();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      setError("Voye yon foto JPG, PNG oswa WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Foto a twò gwo (maksimòm 15 MB).");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const clientSha256 = await sha256OfFile(file);
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const blob = await upload(`artworks/${artworkId}/${kind.toLowerCase()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
        clientPayload: JSON.stringify({ artworkId, kind }),
        contentType: file.type,
      });
      const result = await attachImage({ artworkId, kind, url: blob.url, clientSha256 });
      if (!result.ok) setError(result.message);
      else router.refresh();
    } catch (err) {
      console.error(err);
      setError("Foto a pa t monte. Tcheke koneksyon an epi eseye ankò.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <label
        htmlFor={inputId}
        className={`inline-block border-2 border-ink px-5 py-3 rounded-md font-bold cursor-pointer ${
          busy ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        {busy ? "N ap monte foto a…" : buttonLabel}
      </label>
      <input
        id={inputId}
        type="file"
        accept={ALLOWED.join(",")}
        onChange={onChange}
        disabled={busy}
        className="sr-only"
      />
      {error && <p role="alert" className="mt-2 text-hibiscus">{error}</p>}
    </div>
  );
}
