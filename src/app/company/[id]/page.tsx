import Link from 'next/link';
import { getCompanyById } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = getCompanyById(parseInt(id));

  if (!company) {
    notFound();
  }

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/directory" className="text-xs uppercase tracking-wider text-[var(--muted)] hover:underline underline-offset-4">
            ← Directory
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{company.name}</h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              {company.hq_city}, {company.hq_country}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`chip ${company.verification_status === 'Verified' ? 'chip-filled' : ''}`}>
              {company.verification_status}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="mb-6">
          <span className="chip">{company.category}</span>
        </div>

        {/* One liner */}
        <p className="text-sm font-semibold mb-4">{company.one_liner}</p>

        {/* Description */}
        {company.description && (
          <div className="mb-8 border-t border-[var(--border)] pt-6">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">About</p>
            <p className="text-sm leading-relaxed">{company.description}</p>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-t border-[var(--border)] pt-6">
          {/* Sensors */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">Sensors & Modalities</p>
            <div className="flex flex-wrap gap-1.5">
              {company.sensors.map(s => (
                <span key={s} className="chip chip-filled">{s}</span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {company.tags.map(t => (
                <span key={t} className="chip">{t}</span>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">Regions</p>
            <div className="flex flex-wrap gap-1.5">
              {company.regions.map(r => (
                <span key={r} className="chip">{r}</span>
              ))}
            </div>
          </div>

          {/* Scale */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">Scale</p>
            <div className="text-sm">
              {company.scale_hours && (
                <p><span className="text-[var(--muted)]">Hours collected:</span> {company.scale_hours.toLocaleString()}</p>
              )}
              {company.collectors && (
                <p><span className="text-[var(--muted)]">Collectors:</span> {company.collectors.toLocaleString()}</p>
              )}
              {!company.scale_hours && !company.collectors && (
                <p className="text-[var(--muted)]">Not disclosed</p>
              )}
            </div>
          </div>
        </div>

        {/* Proof links */}
        {company.proof_links.length > 0 && (
          <div className="mb-8 border-t border-[var(--border)] pt-6">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-3">Proof Links</p>
            <div className="flex flex-col gap-2">
              {company.proof_links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline underline-offset-4">
                  {link} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn">
              Visit Website ↗
            </a>
          )}
          <Link href="/map" className="btn">
            View on Map
          </Link>
        </div>
      </div>
    </div>
  );
}
