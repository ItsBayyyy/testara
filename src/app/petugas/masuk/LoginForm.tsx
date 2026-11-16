"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions-auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error && (
        <p role="alert" className="alert-action px-4 py-3 font-bold">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          className="field"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="field"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary" aria-busy={pending} disabled={pending}>
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
