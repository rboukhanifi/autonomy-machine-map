'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { WorldMap, CityCluster } from '@/components/WorldMap';

interface Company {
  id: number;
  name: string;
  website: string;
  hq_city: string;
  hq_country: string;
  regions: string[];
  category: string;
  one_liner: string;
  sensors: string[];
  tags: string[];
  scale_hours: number | null;
  collectors: number | null;
  verification_status: string;
  lat: number;
  lng: number;
}

const ALL_SENSORS = ['RGB', 'Audio', 'IMU', 'Depth', 'Gaze', 'Hands', 'Force/Tactile', 'Motion Capture', 'Lidar'];
const ALL_TAGS = ['Industrial', 'Home', 'Robotics', 'VLA', 'Teleop', 'Multi-modal', 'Contributor network', 'Humanoid', 'Foundation Model', 'Simulation', 'Open Source', 'Dexterous Manipulation'];
const ALL_REGIONS = ['North America', 'Europe', 'Asia', 'India', 'SEA', 'Global', 'South Korea', 'Middle East'];
const ALL_CATEGORIES = ['Platform', 'Lab', 'Capture network', 'Startup', 'Enterprise', 'Research'];

export default function MapPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filtered, setFiltered] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [filterSensors, setFilterSensors] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterRegions, setFilterRegions] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [tooltip, setTooltip] = useState<{
    cluster: CityCluster;
    x: number;
    y: number;
  } | null>(null);

  const [popup, setPopup] = useState<{
    cluster: CityCluster;
    x: number;
    y: number;
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => {
        setCompanies(data);
        setFiltered(data);
      });
  }, []);

  useEffect(() => {
    let result = companies;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    if (filterSensors.length > 0) {
      result = result.filter(c => filterSensors.some(s => c.sensors.includes(s)));
    }
    if (filterTags.length > 0) {
      result = result.filter(c => filterTags.some(t => c.tags.includes(t)));
    }
    if (filterRegions.length > 0) {
      result = result.filter(c => filterRegions.some(r => c.regions.includes(r)));
    }
    if (filterCategories.length > 0) {
      result = result.filter(c => filterCategories.includes(c.category));
    }

    setFiltered(result);
  }, [companies, search, filterSensors, filterTags, filterRegions, filterCategories]);

  // Clear popup/tooltip when filters change
  useEffect(() => {
    setPopup(null);
    setTooltip(null);
  }, [filtered]);

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleClusterHover = useCallback((cluster: CityCluster | null, pos: { x: number; y: number } | null) => {
    if (cluster && pos) {
      setTooltip({ cluster, x: pos.x, y: pos.y });
    } else {
      setTooltip(null);
    }
  }, []);

  const handleClusterClick = useCallback((cluster: CityCluster | null, pos: { x: number; y: number } | null) => {
    if (cluster && pos) {
      setPopup({ cluster, x: pos.x, y: pos.y });
      setTooltip(null);
    } else {
      setPopup(null);
    }
  }, []);

  const handleSelect = useCallback((c: Company | null) => {
    setSelected(c);
    if (c) setPopup(null);
  }, []);

  // Clamp popup position to stay within container
  function clampPos(x: number, y: number, w: number, h: number) {
    const container = mapContainerRef.current;
    if (!container) return { x, y };
    const rect = container.getBoundingClientRect();
    const clamped = {
      x: Math.min(Math.max(x, 8), rect.width - w - 8),
      y: Math.min(Math.max(y, 8), rect.height - h - 8),
    };
    return clamped;
  }

  return (
    <div className="pt-14 h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[var(--border)] px-4 py-2 flex items-center gap-4 bg-[var(--background)] z-10">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs uppercase tracking-wider hover:underline underline-offset-4"
        >
          {showFilters ? '× Close Filters' : '+ Filters'}
        </button>
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="!w-64 !border-0 !border-b !border-[var(--border)] !p-1 text-xs"
        />
        <span className="text-xs text-[var(--muted)] ml-auto font-mono">
          {filtered.length} / {companies.length} nodes
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Filter panel */}
        {showFilters && (
          <div className="w-64 border-r border-[var(--border)] overflow-y-auto p-4 flex-shrink-0 bg-[var(--background)]">
            <FilterSection
              title="Regions"
              options={ALL_REGIONS}
              selected={filterRegions}
              onToggle={(v) => toggleFilter(filterRegions, setFilterRegions, v)}
            />
            <FilterSection
              title="Tags"
              options={ALL_TAGS}
              selected={filterTags}
              onToggle={(v) => toggleFilter(filterTags, setFilterTags, v)}
            />
            <FilterSection
              title="Sensors"
              options={ALL_SENSORS}
              selected={filterSensors}
              onToggle={(v) => toggleFilter(filterSensors, setFilterSensors, v)}
            />
            <FilterSection
              title="Type"
              options={ALL_CATEGORIES}
              selected={filterCategories}
              onToggle={(v) => toggleFilter(filterCategories, setFilterCategories, v)}
            />
            <button
              onClick={() => {
                setFilterSensors([]);
                setFilterTags([]);
                setFilterRegions([]);
                setFilterCategories([]);
                setSearch('');
              }}
              className="mt-4 text-xs uppercase tracking-wider underline underline-offset-4"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Map area */}
        <div className="flex-1 relative" ref={mapContainerRef}>
          <WorldMap
            companies={filtered}
            selected={selected}
            onSelect={handleSelect}
            onClusterHover={handleClusterHover}
            onClusterClick={handleClusterClick}
          />

          {/* Tooltip (hover, non-interactive) */}
          {tooltip && !popup && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: tooltip.x + 16,
                top: tooltip.y - 12,
              }}
            >
              <div className="bg-[#111] text-[#f4efe6] px-3 py-2 text-xs font-mono border border-[#333] max-w-[240px]">
                <div className="font-bold mb-1">
                  {tooltip.cluster.city}, {tooltip.cluster.country}
                </div>
                {tooltip.cluster.count === 1 ? (
                  <div className="text-[#ccc]">{tooltip.cluster.companies[0].name}</div>
                ) : (
                  <>
                    <div className="text-[#999] mb-1">{tooltip.cluster.count} companies</div>
                    {tooltip.cluster.companies.slice(0, 6).map(c => (
                      <div key={c.id} className="text-[#ccc] truncate">{c.name}</div>
                    ))}
                    {tooltip.cluster.count > 6 && (
                      <div className="text-[#666] mt-0.5">+{tooltip.cluster.count - 6} more</div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Popup (click, interactive) */}
          {popup && (
            <div
              className="absolute z-30"
              style={{
                left: clampPos(popup.x + 16, popup.y - 16, 320, popup.cluster.count * 28 + 48).x,
                top: clampPos(popup.x + 16, popup.y - 16, 320, popup.cluster.count * 28 + 48).y,
              }}
            >
              <div className="bg-[var(--background)] border border-[#111] px-3 py-2 text-xs font-mono max-w-[320px] shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">
                    {popup.cluster.city}, {popup.cluster.country}
                  </div>
                  <button
                    onClick={() => setPopup(null)}
                    className="text-[var(--muted)] hover:text-[#111] ml-3 text-sm leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
                  {popup.cluster.companies.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        handleSelect(c);
                        setPopup(null);
                      }}
                      className="text-left px-2 py-1.5 hover:bg-[#111] hover:text-[#f4efe6] transition-colors whitespace-normal break-words"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {selected && (
          <div className="w-80 border-l border-[var(--border)] overflow-y-auto p-6 bg-[var(--background)] flex-shrink-0">
            <button
              onClick={() => setSelected(null)}
              className="text-xs uppercase tracking-wider mb-4 hover:underline underline-offset-4"
            >
              × Close
            </button>

            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg">{selected.name}</h3>
              {selected.verification_status === 'Verified' && (
                <span className="chip chip-filled text-[0.6rem]">Verified</span>
              )}
            </div>

            <p className="text-xs text-[var(--muted)] mb-1">
              {selected.hq_city}, {selected.hq_country}
            </p>
            <p className="text-xs text-[var(--muted)] mb-4">
              {selected.regions.join(', ')}
            </p>

            <p className="text-sm mb-4">{selected.one_liner}</p>

            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map(t => (
                  <span key={t} className="chip text-[0.6rem]">{t}</span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">Sensors</p>
              <div className="flex flex-wrap gap-1">
                {selected.sensors.map(s => (
                  <span key={s} className="chip chip-filled text-[0.6rem]">{s}</span>
                ))}
              </div>
            </div>

            {(selected.scale_hours || selected.collectors) && (
              <div className="mb-4 border-t border-[var(--border)] pt-3">
                {selected.scale_hours && (
                  <p className="text-xs mb-1">
                    <span className="text-[var(--muted)]">Hours:</span> {selected.scale_hours.toLocaleString()}
                  </p>
                )}
                {selected.collectors && (
                  <p className="text-xs">
                    <span className="text-[var(--muted)]">Collectors:</span> {selected.collectors.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 mt-6">
              <Link href={`/company/${selected.id}`} className="btn text-center text-xs">
                View Profile
              </Link>
              {selected.website && (
                <a href={selected.website} target="_blank" rel="noopener noreferrer" className="btn text-center text-xs">
                  Website ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2">{title}</p>
      <div className="flex flex-col gap-1.5">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-3 h-3 accent-[#111]"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
