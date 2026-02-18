"use client";

import Link from "next/link";
import { Starfield } from "@/components/Starfield";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Starfield />

      <main className="container mx-auto px-6 py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-16 max-w-5xl">

          {/* Hero Section */}
          <div className="space-y-6">
            <div className="label-text mb-6">◌ Welcome to ◌</div>
            <h1 className="text-7xl md:text-9xl font-bold text-[var(--accent-primary)] tracking-tight">
              STARDUST
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Collect cosmic stardust, unlock hidden secrets, and reflect on your journey
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-1 bg-[var(--border-faint)] border border-[var(--border-faint)] mt-20">
            <div className="bg-[var(--bg-primary)] p-10 transition-all duration-300 hover:bg-[var(--bg-secondary)] group">
              <div className="label-text mb-6 group-hover:opacity-70">◌ Earn</div>
              <h3 className="text-xl font-semibold mb-4 text-[var(--accent-primary)]">
                Collect Stardust
              </h3>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">
                Make choices and gather cosmic currency to unlock the mysteries that await
              </p>
            </div>

            <div className="bg-[var(--bg-primary)] p-10 transition-all duration-300 hover:bg-[var(--bg-secondary)] group">
              <div className="label-text mb-6 group-hover:opacity-70">◌ Unlock</div>
              <h3 className="text-xl font-semibold mb-4 text-[var(--accent-primary)]">
                Reveal Secrets
              </h3>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">
                Spend your stardust to reveal hidden knowledge and exclusive content
              </p>
            </div>

            <div className="bg-[var(--bg-primary)] p-10 transition-all duration-300 hover:bg-[var(--bg-secondary)] group">
              <div className="label-text mb-6 group-hover:opacity-70">◌ Reflect</div>
              <h3 className="text-xl font-semibold mb-4 text-[var(--accent-primary)]">
                Journal Your Path
              </h3>
              <p className="text-[var(--text-tertiary)] text-sm leading-relaxed">
                Document your discoveries and insights along your cosmic journey
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-20">
            <Link
              href="/reflect"
              className="px-12 py-5 bg-[var(--accent-primary)] text-[var(--bg-primary)] text-[11px] tracking-[3px] uppercase font-medium hover:opacity-90 transition-opacity"
            >
              Begin Journey
            </Link>
            <Link
              href="/dashboard"
              className="px-12 py-5 bg-transparent border border-[var(--border-primary)] text-[var(--accent-primary)] text-[11px] tracking-[3px] uppercase font-medium hover:border-[var(--accent-primary)] hover:opacity-100 opacity-80 transition-all"
            >
              View Dashboard
            </Link>
          </div>

          {/* Footer Text */}
          <div className="mt-24 label-text">
            Discover what lies beyond the veil
          </div>
        </div>
      </main>
    </div>
  );
}
