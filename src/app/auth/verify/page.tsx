import Link from "next/link";
import { verifyLogin } from "./actions";

// The email link opens this page instead of logging in directly.
// Email security scanners often "click" links automatically; requiring a
// button press keeps them from using up the one-time token.

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (error || !token) {
    return (
      <section>
        <h1 className="font-display text-3xl">Lyen sa a pa mache</h1>
        <p className="mt-4">
          Li ka ekspire, oswa li deja sèvi. Chak lyen bon pou 15 minit epi li sèvi yon sèl fwa.
        </p>
        <Link
          href="/login"
          className="inline-block mt-8 bg-ink text-white px-6 py-3 rounded-md font-bold"
        >
          Mande yon nouvo lyen
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1 className="font-display text-3xl">Fin konekte</h1>
      <p className="mt-4 text-muted">Peze bouton an pou w antre nan kont ou.</p>
      <form action={verifyLogin} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="w-full bg-ink text-white px-6 py-3 rounded-md font-bold"
        >
          Konekte kounye a
        </button>
      </form>
    </section>
  );
}
