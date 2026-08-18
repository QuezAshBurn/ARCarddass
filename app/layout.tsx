import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TrafficTracker } from "@/components/TrafficTracker";
import { LiquidRouteLayer } from "@/components/motion/LiquidRouteLayer";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR King Rare Market",
  description:
    "Independent collector market guide for One Piece AR Carddass King Rare premium cards."
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/cards", label: "Cards" },
  { href: "/sets", label: "Sets" },
  { href: "/market", label: "Market" },
  { href: "/pull", label: "Open Pack" },
  { href: "/evidence", label: "Evidence" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/assets/ui/hero-liquid-background-1920x1080.webp" />
      </head>
      <body>
        <LiquidRouteLayer />
        <TrafficTracker />
        <header className="nav">
          <div className="shell nav-inner">
            <Link href="/" className="brand" aria-label="AR King Rare Market home">
              <Image
                src="/assets/ui/one-piece-formation-logo.png"
                alt="One Piece AR Carddass King Rare"
                width={334}
                height={145}
                priority
                className="brand-logo"
              />
            </Link>
            <nav className="nav-links" aria-label="Primary navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="shell">
            AR King Rare Market is an independent collector research and pricing
            project. It is not affiliated with or endorsed by Bandai, Shueisha,
            Toei Animation, Fuji Television, or the rights holders of ONE PIECE.
            Product names and images belong to their respective owners.
          </div>
        </footer>
      </body>
    </html>
  );
}



