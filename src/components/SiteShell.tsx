"use client";

import { OpensApp } from "./OpensApp";
import { SiteGate } from "./SiteGate";

/** Pass → app com abas (Opens / NOP / Jornal). Sem fecho por horário. */
export function SiteShell() {
  return (
    <SiteGate>
      <OpensApp />
    </SiteGate>
  );
}
