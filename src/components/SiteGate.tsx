"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

function expectedPassword(): string {
  return (process.env.NEXT_PUBLIC_SITE_PASSWORD || "").trim();
}

/** Chave muda se a pass mudar no deploy → pede outra vez. */
function gateStorageKey(): string {
  const pw = expectedPassword();
  let h = 0;
  for (let i = 0; i < pw.length; i += 1) {
    h = (h * 31 + pw.charCodeAt(i)) | 0;
  }
  return `trade1_gate_${h}`;
}

function isStoredUnlock(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(gateStorageKey()) === "1";
  } catch {
    return false;
  }
}

function rememberUnlock(): void {
  try {
    localStorage.setItem(gateStorageKey(), "1");
  } catch {
    /* ignore */
  }
}

export function SiteGate({ children }: { children: ReactNode }) {
  const password = expectedPassword();
  const [unlocked, setUnlocked] = useState(() => !password || isStoredUnlock());
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!password || isStoredUnlock()) {
      setUnlocked(true);
    }
  }, [password]);

  if (unlocked) {
    return <>{children}</>;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (value === password) {
      rememberUnlock();
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
