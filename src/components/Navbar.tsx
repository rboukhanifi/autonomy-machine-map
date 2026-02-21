'use client';

import Link from 'next/link';
import { useState } from 'react';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdT3A0Ah1BfbIXTU9wLFMzWnwI4rteeSr_vv5KrUDEFHmfDNA/viewform?usp=publish-editor';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-semibold text-sm tracking-wider uppercase">
            AMM<span className="hidden sm:inline"> // Autonomy Machine Map</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider">
            <Link href="/map" className="hover:underline underline-offset-4">Map</Link>
            <Link href="/directory" className="hover:underline underline-offset-4">Directory</Link>
            <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">Add Company</a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <div className={`w-5 h-px bg-[var(--foreground)] transition-transform ${open ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
              <div className={`w-5 h-px bg-[var(--foreground)] transition-opacity ${open ? 'opacity-0' : ''}`} />
              <div className={`w-5 h-px bg-[var(--foreground)] transition-transform ${open ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
          <div className="flex flex-col px-4 py-4 gap-4 text-xs uppercase tracking-wider">
            <Link href="/map" onClick={() => setOpen(false)}>Map</Link>
            <Link href="/directory" onClick={() => setOpen(false)}>Directory</Link>
            <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Add Company</a>
          </div>
        </div>
      )}
    </nav>
  );
}
