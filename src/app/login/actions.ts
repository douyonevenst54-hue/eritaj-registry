"use server";

import { appUrl, createLoginToken, isValidEmail, normalizeEmail } from "@/lib/auth";
import { sendLoginEmail } from "@/lib/email";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

export async function requestLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidEmail(email)) {
    return { status: "error", message: "Adrès imèl sa a pa bon. Tcheke l epi eseye ankò." };
  }

  const token = await createLoginToken(email);
  if (!token) {
    return { status: "error", message: "Ou mande twòp lyen. Tann 15 minit epi eseye ankò." };
  }

  try {
    await sendLoginEmail(email, `${appUrl()}/auth/verify?token=${token}`);
  } catch (err) {
    console.error(err);
    return { status: "error", message: "Nou pa t ka voye imèl la. Eseye ankò nan kèk minit." };
  }

  return { status: "sent", email };
}
