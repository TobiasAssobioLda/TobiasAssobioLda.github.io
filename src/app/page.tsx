import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "O Rumors",
  description: "geopolítica & mercados",
};

export default function HomePage() {
  return <SiteShell />;
}
