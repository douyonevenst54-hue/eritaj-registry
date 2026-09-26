"use client";

import { useActionState, useState } from "react";
import { registerArtwork, type FormState } from "../actions";
import { buildStatement, type StatementLocale } from "@/lib/declaration";

const idle: FormState = { status: "idle" };
const localeLabel: Record<StatementLocale, string> = { ht: "Kreyòl", fr: "Franse", en: "Anglè" };

export function RegisterForm({
  artworkId,
  displayName,
  title,
  year,
  ready,
}: {
  artworkId: string;
  displayName: string;
  title: string;
  year: number | null;
  ready: boolean;
}) {
  const [locale, setLocale] = useState<StatementLocale>("ht");
  const [state, action, pending] = useActionState(registerArtwork, idle);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="artworkId" value={artworkId} />

      <fieldset>
        <legend className="font-bold">Nan ki lang ou vle siyen?</legend>
        <div className="mt-2 flex gap-6">
          {(Object.keys(localeLabel) as StatementLocale[]).map((l) => (
            <label key={l} className="flex items-center gap-2">
              <input type="radio" name="locale" value={l} checked={locale === l}
                onChange={() => setLocale(l)} />
              {localeLabel[l]}
            </label>
          ))}
        </div>
      </fieldset>

      <blockquote className="border-l-4 border-sun bg-white px-5 py-4 rounded-r-md">
        {buildStatement(locale, displayName, title, year)}
      </blockquote>

      <div>
        <label htmlFor="signedName" className="block font-bold">Tape non konplè ou pou siyen</label>
        <input id="signedName" name="signedName" required autoComplete="name"
          className="mt-2 w-full rounded-md border-2 border-ink/30 bg-white px-4 py-3 focus:border-ink" />
        <p className="mt-2 text-base text-muted">
          Li dwe menm jan ak non konplè ki nan pwofil atis ou. Li pa parèt piblikman.
        </p>
      </div>

      <label className="flex items-start gap-3">
        <input type="checkbox" name="confirm" value="yes" required className="mt-1.5" />
        <span>
          Mwen konprann deklarasyon sa a ap piblik, e apre anrejistreman an mwen p ap ka chanje detay
          yo, foto yo, ni deklarasyon an.
        </span>
      </label>

      {state.status === "error" && <p role="alert" className="text-hibiscus">{state.message}</p>}

      <button type="submit" disabled={!ready || pending}
        className="w-full bg-ink text-white px-6 py-4 rounded-md font-bold disabled:opacity-50">
        {pending ? "N ap anrejistre…" : "Anrejistre zèv la"}
      </button>
      {!ready && (
        <p className="text-base text-muted">
          Ajoute foto devan zèv la ak foto ou menm ak zèv la anvan.
        </p>
      )}
    </form>
  );
}
