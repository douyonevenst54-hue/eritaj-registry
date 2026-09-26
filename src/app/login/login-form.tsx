"use client";

import { useActionState } from "react";
import { requestLogin, type LoginState } from "./actions";

const initial: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(requestLogin, initial);

  if (state.status === "sent") {
    return (
      <div role="status" className="mt-8 border-l-4 border-sea pl-4">
        <p className="font-bold">Gade imèl ou.</p>
        <p className="mt-2">
          Nou voye yon lyen bay <strong>{state.email}</strong>. Li bon pou 15 minit.
        </p>
        <p className="mt-2 text-muted text-base">
          Pa wè l? Gade nan dosye spam lan.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8">
      <label htmlFor="email" className="block font-bold">
        Imèl ou
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="mt-2 w-full rounded-md border-2 border-ink/30 bg-white px-4 py-3 focus:border-ink"
      />
      {state.status === "error" && (
        <p role="alert" className="mt-3 text-hibiscus">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full bg-ink text-white px-6 py-3 rounded-md font-bold disabled:opacity-60"
      >
        {pending ? "N ap voye..." : "Voye lyen an"}
      </button>
    </form>
  );
}
