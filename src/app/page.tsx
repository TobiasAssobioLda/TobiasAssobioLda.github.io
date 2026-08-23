import type { Metadata } from "next";
import { OpensApp } from "@/components/OpensApp";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade1 · Opens",
  description: "Pipoca / Chill open positions",
};

export default function HomePage() {
  return <OpensApp />;
}
