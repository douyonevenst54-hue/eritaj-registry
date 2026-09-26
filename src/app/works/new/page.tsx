import Link from "next/link";
import { requireVerifiedArtist } from "@/lib/guards";
import { WorkDetailsForm } from "../work-details-form";

export default async function NewWorkPage() {
  await requireVerifiedArtist();

  return (
    <section>
      <Link href="/works" className="text-muted underline">Tounen</Link>
      <h1 className="font-display text-3xl mt-4">Nouvo zèv</h1>
      <p className="mt-4 text-muted">
        Etap 1 sou 3: detay zèv la. Apre sa, w ap ajoute foto yo epi siyen deklarasyon an.
      </p>
      <div className="mt-8">
        <WorkDetailsForm
          initial={{
            title: "", titleHt: "", yearCreated: "", medium: "",
            widthCm: "", heightCm: "", depthCm: "", description: "",
          }}
        />
      </div>
    </section>
  );
}
