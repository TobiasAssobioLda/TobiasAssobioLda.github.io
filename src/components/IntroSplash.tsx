"use client";

import { ReactNode, useEffect, useState } from "react";

const COVER_SRC = "/capa/cover.png";
const SPLASH_MS = 5000;

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
      loading="eager"
      fetchPriority="high"
    />
  );
}

export function IntroSplash({ onDone }: { onDone: () => void }) {
  const [imageReady, setImageReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    document.body.classList.add("splash-open");
    return () => {
      document.body.classList.remove("splash-open");
    };
  }, []);

  useEffect(() => {
    let doneTimer: number | undefined;
    let fadeTimer: number | undefined;

    const img = new Image();
    img.src = COVER_SRC;
    img.onload = () => {
      setImageReady(true);
      fadeTimer = window.setTimeout(() => setLeaving(true), SPLASH_MS - 450);
      doneTimer = window.setTimeout(() => onDone(), SPLASH_MS);
    };
    img.onerror = () => {
      fadeTimer = window.setTimeout(() => setLeaving(true), SPLASH_MS - 450);
      doneTimer = window.setTimeout(() => onDone(), SPLASH_MS);
    };

    return () => {
      if (fadeTimer) window.clearTimeout(fadeTimer);
      if (doneTimer) window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={leaving ? "splash-screen splash-screen--out" : "splash-screen"}
      aria-hidden="true"
    >
      <CoverImage
        className={
          imageReady ? "splash-cover splash-cover--ready" : "splash-cover"
        }
      />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {!introDone ? <IntroSplash onDone={() => setIntroDone(true)} /> : null}
      {introDone ? children : null}
    </>
  );
}
