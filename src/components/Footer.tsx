import Link from 'next/link';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdT3A0Ah1BfbIXTU9wLFMzWnwI4rteeSr_vv5KrUDEFHmfDNA/viewform?usp=publish-editor';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold mb-2">Autonomy Machine Map</p>
            <p className="text-xs text-[var(--muted)]">Global marketplace for egocentric data collection.</p>
          </div>
          <div className="flex gap-8 text-xs uppercase tracking-wider">
            <div className="flex flex-col gap-2">
              <Link href="/map" className="hover:underline underline-offset-4">Map</Link>
              <Link href="/directory" className="hover:underline underline-offset-4">Directory</Link>
            </div>
            <div className="flex flex-col gap-2">
              <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">Add Company</a>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)] mt-8 pt-6 text-xs text-[var(--muted)]">
          <p>&copy; {new Date().getFullYear()} autonomymachinemap.com</p>
        </div>
      </div>
    </footer>
  );
}
