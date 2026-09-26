import Link from "next/link";

export default function Home() {
  return (
    <section>
      <h1 className="font-display text-4xl sm:text-5xl leading-tight">
        Chak zèv gen yon istwa. Anrejistre li.
      </h1>
      <p className="mt-6 text-muted max-w-prose">
        Eritaj Registry se yon rejis piblik pou zèv atis ayisyen vivan: ki moun ki fè l,
        ki lè li fèt, ak kote li pase depi lè sa a.
      </p>
      <p className="mt-2 text-muted max-w-prose">
        A public record of works by living Haitian artists: who made each piece, when, and
        where it has been since.
      </p>
      <Link
        href="/login"
        className="inline-block mt-8 bg-ink text-white px-6 py-3 rounded-md font-bold"
      >
        Konekte
      </Link>
    </section>
  );
}
