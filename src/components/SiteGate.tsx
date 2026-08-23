"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

const STORAGE_KEY = "trade1_gate_ok";

function expectedPassword(): string {
  return (process.env.NEXT_PUBLIC_SITE_PASSWORD || "").trim();
}

export function SiteGate({ children }: { children: ReactNode }) {
  const password = expectedPassword();
  const [unlocked, setUnlocked] = useState(() => !password);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!password) {
      setUnlocked(true);
      return;
    }
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {
      /* ignore */
    }
  }, [password]);

  if (unlocked) {
    return <>{children}</>;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (value === password) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setError(false);
      setUnlocked(true);
      return;
    }
    setError(true);
  }

  return (
    <main className="gate">
      <p className="brand">Trade1</p>
      <h1>Opens</h1>
      <form onSubmit={onSubmit} className="gate-form">
        <label htmlFor="site-pass">Password</label>
        <input
          id="site-pass"
          type="password"
          autoComplete="current-password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          autoFocus
        />
        {error ? <p className="gate-error">password errada</p> : null}
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
