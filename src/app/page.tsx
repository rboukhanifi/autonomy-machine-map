import Link from 'next/link';
import { MapPreview } from '@/components/MapPreview';
import { getAllCompanies } from '@/lib/db';

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdT3A0Ah1BfbIXTU9wLFMzWnwI4rteeSr_vv5KrUDEFHmfDNA/viewform?usp=publish-editor';

export const dynamic = 'force-dynamic';

export default function Home() {
  const companies = getAllCompanies();
  const featured = companies.filter(c => c.verification_status === 'Verified').slice(0, 8);

  // Derive deduplicated pins from all companies (round to ~0.5 degree grid to avoid overlap)
  const pinMap = new Map<string, { lat: number; lng: number }>();
  companies.forEach(c => {
    const key = `${Math.round(c.lat * 2) / 2},${Math.round(c.lng * 2) / 2}`;
    if (!pinMap.has(key)) pinMap.set(key, { lat: c.lat, lng: c.lng });
  });
  const pins = Array.from(pinMap.values()).slice(0, 40);

  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-4">
                // Global Egocentric Data Marketplace
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                Autonomy<br />Machine Map
              </h1>
              <p className="mt-6 text-sm leading-relaxed max-w-lg text-[var(--foreground)]">
                The world map of egocentric data collection platforms,
                research labs, and capture networks. Discover, compare,
                and request datasets for embodied AI.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/map" className="btn btn-primary">
                  Explore Map
                </Link>
                <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn">
                  Add Your Company
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-6">
            // Live Network Map
          </p>
          <MapPreview pins={pins} />
        </div>
      </section>

      {/* Section A: What is egocentric data? */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-4">
            // Section 01
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">
            What is egocentric data?
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-2xl">
            First-person sensor data captured from the perspective of a human or robot
            performing real-world tasks. The raw fuel for training embodied AI agents,
            vision-language-action models, and autonomous systems.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: '[ CAM ]', label: 'RGB Video' },
              { icon: '[ IMU ]', label: 'Motion' },
              { icon: '[ DPT ]', label: 'Depth' },
              { icon: '[ GZE ]', label: 'Gaze Track' },
              { icon: '[ HND ]', label: 'Hand Pose' },
              { icon: '[ FRC ]', label: 'Force/Tactile' },
              { icon: '[ MOC ]', label: 'Mo-Cap' },
              { icon: '[ LDR ]', label: 'Lidar' },
            ].map((sensor) => (
              <div key={sensor.label} className="border border-[var(--border)] p-4 text-center">
                <p className="font-mono text-lg font-bold mb-2">{sensor.icon}</p>
                <p className="text-xs uppercase tracking-wider">{sensor.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section B: Who is on the map? */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-4">
            // Section 02
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            Who is on the map?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Platforms',
                desc: 'End-to-end data collection infrastructure providers',
              },
              {
                title: 'Research Labs',
                desc: 'University and corporate labs producing egocentric datasets',
              },
              {
                title: 'Capture Networks',
                desc: 'Distributed networks of data collectors across regions',
              },
              {
                title: 'Startups',
                desc: 'Venture-backed robotics and AI companies building with egocentric data',
              },
              {
                title: 'Enterprise',
                desc: 'Large established companies like NVIDIA, Tesla, and Boston Dynamics',
              },
              {
                title: 'Research Projects',
                desc: 'Open-source university research like DexCap, EgoMimic, and LeRobot',
              },
            ].map((item) => (
              <div key={item.title} className="border border-[var(--border)] p-5">
                <p className="font-bold text-sm mb-1">{`> ${item.title}`}</p>
                <p className="text-xs text-[var(--muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section C: How the marketplace works */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-4">
            // Section 03
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-10">
            How the marketplace works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discover',
                desc: 'Browse the map and directory to find egocentric data providers matching your needs.',
              },
              {
                step: '02',
                title: 'Compare',
                desc: 'Filter by sensors, regions, tags, and scale. Review profiles and proof links.',
              },
              {
                step: '03',
                title: 'Request',
                desc: 'Submit a dataset request with your specs. Get matched to the best providers.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <p className="text-5xl font-bold text-[var(--accent)]">{item.step}</p>
                <p className="font-bold text-sm mt-3 mb-2">{item.title}</p>
                <p className="text-xs leading-relaxed text-[var(--muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section D: Featured hubs */}
      <section className="py-20 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)] mb-4">
            // Section 04
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-10">
            Featured hubs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="block border border-[var(--border)] p-4 hover:bg-[var(--accent)] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-sm">{company.name}</p>
                  {company.verification_status === 'Verified' && (
                    <span className="chip chip-filled text-[0.6rem]">V</span>
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] mb-3">{company.one_liner}</p>
                <div className="flex flex-wrap gap-1">
                  {company.sensors.slice(0, 3).map(s => (
                    <span key={s} className="chip text-[0.6rem]">{s}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/map" className="btn">
              View Full Map →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
