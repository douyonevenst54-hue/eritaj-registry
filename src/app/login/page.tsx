import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <section>
      <h1 className="font-display text-3xl">Konekte</h1>
      <p className="mt-4 text-muted">
        Antre imèl ou. N ap voye yon lyen pou w konekte, san modpas.
      </p>
      <LoginForm />
    </section>
  );
}
