"use client";

import { useActionState } from "react";
import { saveArtistProfile, type ArtistFormState } from "./actions";

type Initial = {
  fullName: string;
  displayName: string;
  birthYear: string;
  hometown: string;
  bioHt: string;
  bioFr: string;
  bioEn: string;
  nameLocked: boolean;
  isNew: boolean;
};

const initialState: ArtistFormState = { status: "idle" };

const inputClass =
  "mt-2 w-full rounded-md border-2 border-ink/30 bg-white px-4 py-3 focus:border-ink";

export function ArtistForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState(saveArtistProfile, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div>
        <label htmlFor="fullName" className="block font-bold">Non konplè ou</label>
        <input id="fullName" name="fullName" required defaultValue={initial.fullName}
          autoComplete="name" className={inputClass} />
      </div>

      <div>
        <label htmlFor="displayName" className="block font-bold">Non ou siyen zèv ou yo</label>
        <input id="displayName" name="displayName" defaultValue={initial.displayName}
          required={!initial.nameLocked} disabled={initial.nameLocked}
          aria-describedby="displayName-hint" className={`${inputClass} disabled:opacity-60`} />
        <p id="displayName-hint" className="mt-2 text-base text-muted">
          {initial.nameLocked
            ? "Non sa a fèmen paske pwofil ou verifye. Kontakte KHADA si w bezwen chanje l."
            : "Jan non an parèt sou zèv yo, pa egzanp yon siyati oswa yon ti non."}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="birthYear" className="block font-bold">Ane ou fèt (opsyonèl)</label>
          <input id="birthYear" name="birthYear" inputMode="numeric" maxLength={4}
            defaultValue={initial.birthYear} className={inputClass} />
        </div>
        <div>
          <label htmlFor="hometown" className="block font-bold">Kote ou soti</label>
          <input id="hometown" name="hometown" defaultValue={initial.hometown}
            placeholder="Jakmèl, Kwadebouke…" className={inputClass} />
        </div>
      </div>

      <fieldset>
        <legend className="font-bold">Biyografi</legend>
        <p className="mt-1 text-base text-muted">
          Ekri nan lang ou pi alèz. Lòt yo opsyonèl.
        </p>
        <label htmlFor="bioHt" className="block mt-4">Kreyòl</label>
        <textarea id="bioHt" name="bioHt" rows={4} maxLength={2000}
          defaultValue={initial.bioHt} className={inputClass} />
        <label htmlFor="bioFr" className="block mt-4">Franse</label>
        <textarea id="bioFr" name="bioFr" rows={4} maxLength={2000}
          defaultValue={initial.bioFr} className={inputClass} />
        <label htmlFor="bioEn" className="block mt-4">Anglè</label>
        <textarea id="bioEn" name="bioEn" rows={4} maxLength={2000}
          defaultValue={initial.bioEn} className={inputClass} />
      </fieldset>

      {state.status === "error" && (
        <p role="alert" className="text-hibiscus">{state.message}</p>
      )}
      {state.status === "saved" && (
        <p role="status" className="border-l-4 border-sea pl-4">Pwofil ou anrejistre.</p>
      )}

      <button type="submit" disabled={pending}
        className="w-full bg-ink text-white px-6 py-3 rounded-md font-bold disabled:opacity-60">
        {pending ? "N ap anrejistre…" : initial.isNew ? "Kreye pwofil la" : "Anrejistre chanjman yo"}
      </button>
    </form>
  );
}
