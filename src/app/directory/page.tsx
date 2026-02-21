import Link from 'next/link';
import { getAllCompanies } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function DirectoryPage() {
  const companies = getAllCompanies();

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-2">
            // Directory
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            All Companies
          </h1>
          <p className="text-xs text-[var(--muted)] mt-2">
            {companies.length} organizations listed
          </p>
        </div>

        {/* Table */}
        <div className="border border-[var(--border)] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--accent)]">
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider hidden sm:table-cell">Region</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider hidden lg:table-cell">Sensors</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider hidden lg:table-cell">Tags</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id} className="border-b border-[var(--border)] hover:bg-[var(--accent)] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/company/${company.id}`} className="font-semibold hover:underline underline-offset-4">
                      {company.name}
                    </Link>
                    <p className="text-[var(--muted)] mt-0.5 sm:hidden">{company.hq_country}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[var(--muted)]">
                    {company.hq_country}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="chip text-[0.6rem]">{company.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {company.sensors.map(s => (
                        <span key={s} className="chip text-[0.55rem]">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {company.tags.slice(0, 2).map(t => (
                        <span key={t} className="chip text-[0.55rem]">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {company.verification_status === 'Verified' ? (
                      <span className="chip chip-filled text-[0.55rem]">V</span>
                    ) : (
                      <span className="chip text-[0.55rem]">?</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/company/${company.id}`} className="text-[0.65rem] uppercase tracking-wider hover:underline underline-offset-4">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
