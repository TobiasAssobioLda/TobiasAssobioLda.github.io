"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

const COVER_SRC = "/capa/cover.png";

function expectedPassword(): string {
  return (process.env.NEXT_PUBLIC_SITE_PASSWORD || "").trim();
}

function clearLegacyUnlockKeys(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key?.startsWith("trade1_gate_")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}

function CoverImage({ className }: { className: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={COVER_SRC}
      alt=""
      className={className}
      width={1132}
      height={1389}
      decoding="async"
    />
  );
}

export function SiteGate({ children }: { children: ReactNode }) {
  const password = expectedPassword();
  const requiresPass = password.length > 0;
  const [unlocked, setUnlocked] = useState(!requiresPass);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    clearLegacyUnlockKeys();
  }, []);

  useEffect(() => {
    if (!requiresPass) return;
    const onPageShow = () => setUnlocked(false);
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [requiresPass]);

  if (!requiresPass || unlocked) {
    return <>{children}</>;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (value === password) {
      setError(false);
      setUnlocked(true);
      return;
    }
    setError(true);
  }

  return (
    <main className="gate-screen">
      <div className="gate-card">
        <div className="gate-cover-wrap">
          <CoverImage className="gate-cover" />
        </div>

        <form onSubmit={onSubmit} className="gate-panel">
          <input
            id="site-pass"
            type="password"
            name="password"
            placeholder="password"
            autoComplete="off"
            aria-label="password"
            className={error ? "gate-input gate-input--error" : "gate-input"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            autoFocus
          />
          {error ? <p className="gate-error">password errada</p> : null}
          <button type="submit" className="gate-btn">
            entrar
          </button>
        </form>
      </div>
    </main>
  );
}
