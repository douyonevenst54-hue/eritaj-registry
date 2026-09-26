"use client";

import { useActionState } from "react";
import { createDraft, updateDraft, type FormState } from "./actions";
import { MEDIUMS, mediumLabel } from "@/lib/labels";

export type DetailsInitial = {
  artworkId?: string;
  title: string;
  titleHt: string;
  yearCreated: string;
  medium: string;
  widthCm: string;
  heightCm: string;
  depthCm: string;
  description: string;
};

const input = "mt-2 w-full rounded-md border-2 border-ink/30 bg-white px-4 py-3 focus:border-ink";
const idle: FormState = { status: "idle" };

export function WorkDetailsForm({ initial }: { initial: DetailsInitial }) {
  const isEdit = Boolean(initial.artworkId);
  const [state, action, pending] = useActionState(isEdit ? updateDraft : createDraft, idle);

  return (
    <form action={action} className="space-y-6">
      {isEdit && <input type="hidden" name="artworkId" value={initial.artworkId} />}

      <div>
        <label htmlFor="title" className="block font-bold">Tit zèv la</label>
        <input id="title" name="title" required maxLength={150} defaultValue={initial.title} className={input} />
      </div>

      <div>
        <label htmlFor="titleHt" className="block font-bold">Tit an kreyòl (si li diferan)</label>
        <input id="titleHt" name="titleHt" maxLength={150} defaultValue={initial.titleHt} className={input} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="medium" className="block font-bold">Kalite zèv</label>
          <select id="medium" name="medium" required defaultValue={initial.medium} className={input}>
            <option value="" disabled>Chwazi…</option>
            {MEDIUMS.map((m) => (
              <option key={m} value={m}>{mediumLabel[m]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="yearCreated" className="block font-bold">Ane li fèt (opsyonèl)</label>
          <input id="yearCreated" name="yearCreated" inputMode="numeric" maxLength={4}
            defaultValue={initial.yearCreated} className={input} />
        </div>
      </div>

      <fieldset>
        <legend className="font-bold">Mezi an santimèt (opsyonèl)</legend>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["widthCm", "Lajè", initial.widthCm],
              ["heightCm", "Wotè", initial.heightCm],
              ["depthCm", "Pwofondè", initial.depthCm],
            ] as const
          ).map(([name, label, value]) => (
            <div key={name}>
              <label htmlFor={name} className="block mt-2 text-base">{label}</label>
              <input id={name} name={name} inputMode="decimal" defaultValue={value} className={input} />
            </div>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="description" className="block font-bold">Deskripsyon (opsyonèl)</label>
        <textarea id="description" name="description" rows={4} maxLength={3000}
          defaultValue={initial.description} className={input} />
      </div>

      {state.status === "error" && <p role="alert" className="text-hibiscus">{state.message}</p>}
      {state.status === "saved" && (
        <p role="status" className="border-l-4 border-sea pl-4">Chanjman yo anrejistre.</p>
      )}

      <button type="submit" disabled={pending}
        className="w-full bg-ink text-white px-6 py-3 rounded-md font-bold disabled:opacity-60">
        {pending ? "Yon ti moman…" : isEdit ? "Anrejistre detay yo" : "Kontinye: ajoute foto"}
      </button>
    </form>
  );
}
