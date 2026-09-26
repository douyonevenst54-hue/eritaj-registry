"use server";

import { redirect } from "next/navigation";
import { consumeLoginToken, createSession, upsertUserByEmail } from "@/lib/auth";

export async function verifyLogin(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const email = token ? await consumeLoginToken(token) : null;

  if (!email) redirect("/auth/verify?error=1");

  const user = await upsertUserByEmail(email);
  await createSession(user.id);
  redirect("/dashboard");
}
