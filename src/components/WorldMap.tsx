'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

interface Company {
  id: number;
  name: string;
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
  website: string;
}

export interface CityCluster {
  city: string;
  country: string;
  lat: number;
  lng: number;
  companies: Company[];
  count: number;
}

interface WorldMapProps {
  companies: Company[];
  selected: Company | null;
  onSelect: (c: Company | null) => void;
  onClusterHover: (cluster: CityCluster | null, pos: { x: number; y: number } | null) => void;
  onClusterClick: (cluster: CityCluster | null, pos: { x: number; y: number } | null) => void;
}

const BG = '#f4efe6';
const OCEAN = '#ece7de';
const LAND = '#2a2a2a';
const LAND_STROKE = '#444';
const BORDER = '#555';
const GRATICULE = '#d8d3ca';
const GRATICULE_FINE = '#e0dbd2';
const PIN_DOT = '#ffcc00';
const PIN_STROKE = '#b89a00';
const MUTED = '#999';

function clusterByCity(companies: Company[]): CityCluster[] {
  const map = new Map<string, Company[]>();
  for (const c of companies) {
    const key = `${c.hq_city}|${c.hq_country}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  const clusters: CityCluster[] = [];
  for (const [, group] of map) {
    const lat = group.reduce((s, c) => s + c.lat, 0) / group.length;
    const lng = group.reduce((s, c) => s + c.lng, 0) / group.length;
    clusters.push({
      city: group[0].hq_city,
      country: group[0].hq_country,
      lat,
      lng,
      companies: group,
      count: group.length,
    });
  }
  return clusters;
}

const MERGE_PX = 35;

function mergeNearbyClusters(
  baseClusters: CityCluster[],
  projection: d3.GeoProjection,
  k: number,
): CityCluster[] {
  const n = baseClusters.length;
  if (n === 0) return [];

  // Project each cluster to screen pixels at current zoom
  const screenXY = baseClusters.map(c => {
    const p = projection([c.lng, c.lat]);
    return p ? { x: p[0] * k, y: p[1] * k } : { x: 0, y: 0 };
  });

  // Union-Find
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(i: number): number {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; }
    return i;
  }
  function union(a: number, b: number) { parent[find(a)] = find(b); }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = screenXY[i].x - screenXY[j].x;
      const dy = screenXY[i].y - screenXY[j].y;
      if (dx * dx + dy * dy < MERGE_PX * MERGE_PX) union(i, j);
    }
  }

  // Group by root
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  const merged: CityCluster[] = [];
  for (const indices of groups.values()) {
    if (indices.length === 1) {
      merged.push(baseClusters[indices[0]]);
      continue;
    }
    // Weighted-average position, combine companies
    let totalLat = 0, totalLng = 0, totalCount = 0;
    const allCompanies: Company[] = [];
    for (const idx of indices) {
      const c = baseClusters[idx];
      totalLat += c.lat * c.count;
      totalLng += c.lng * c.count;
      totalCount += c.count;
      allCompanies.push(...c.companies);
    }
    const primary = baseClusters[indices[0]];
    const extraCities = indices.length - 1;
    merged.push({
      city: extraCities > 0 ? `${primary.city} +${extraCities}` : primary.city,
      country: primary.country,
      lat: totalLat / totalCount,
      lng: totalLng / totalCount,
      companies: allCompanies,
      count: totalCount,
    });
  }
  return merged;
}

function screenPos(svgX: number, svgY: number, transform: d3.ZoomTransform) {
  return { x: transform.applyX(svgX), y: transform.applyY(svgY) };
}

export function WorldMap({ companies, selected, onSelect, onClusterHover, onClusterClick }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<Topology | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onClusterHoverRef = useRef(onClusterHover);
  onClusterHoverRef.current = onClusterHover;
  const onClusterClickRef = useRef(onClusterClick);
  onClusterClickRef.current = onClusterClick;

  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pinsGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const baseClustersRef = useRef<CityCluster[]>([]);

  useEffect(() => {
    fetch('/world-110m.json')
      .then(r => r.json())
      .then(data => setWorldData(data));
  }, []);

  // Draw the base map once
  useEffect(() => {
    if (!worldData || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const projection = d3.geoNaturalEarth1()
      .fitSize([width - 40, height - 40], { type: 'Sphere' } as d3.GeoPermissibleObjects)
      .translate([width / 2, height / 2]);
    projectionRef.current = projection;

    const path = d3.geoPath(projection);
    const g = svg.append('g');

    g.append('rect')
      .attr('width', width * 3).attr('height', height * 3)
      .attr('x', -width).attr('y', -height)
      .attr('fill', BG);

    g.append('path')
      .datum({ type: 'Sphere' } as d3.GeoPermissibleObjects)
      .attr('d', path)
      .attr('fill', OCEAN).attr('stroke', '#bbb').attr('stroke-width', 0.8);

    const graticule2 = d3.geoGraticule().step([10, 10]);
    g.append('path').datum(graticule2()).attr('d', path)
      .attr('fill', 'none').attr('stroke', GRATICULE_FINE).attr('stroke-width', 0.2);

    const graticule = d3.geoGraticule().step([30, 30]);
    g.append('path').datum(graticule()).attr('d', path)
      .attr('fill', 'none').attr('stroke', GRATICULE).attr('stroke-width', 0.4);

    const countries = topojson.feature(worldData, worldData.objects.countries as GeometryCollection);
    g.selectAll('path.country')
      .data((countries as GeoJSON.FeatureCollection).features)
      .join('path').attr('class', 'country').attr('d', path)
      .attr('fill', LAND).attr('stroke', LAND_STROKE).attr('stroke-width', 0.5);

    const borders = topojson.mesh(worldData, worldData.objects.countries as GeometryCollection, (a, b) => a !== b);
    g.append('path').datum(borders).attr('d', path)
      .attr('fill', 'none').attr('stroke', BORDER).attr('stroke-width', 0.3);

    const eq = projection([0, 0]);
    if (eq) {
      g.append('line')
        .attr('x1', 0).attr('y1', eq[1]).attr('x2', width).attr('y2', eq[1])
        .attr('stroke', '#bbb').attr('stroke-width', 0.4).attr('stroke-dasharray', '6,3');
    }

    // Single pins group
    const pinsGroup = g.append('g').attr('class', 'pins');
    pinsGroupRef.current = pinsGroup;

    svg.on('click', () => {
      onSelectRef.current(null);
      onClusterClickRef.current(null, null);
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', (event) => {
        const t = event.transform;
        transformRef.current = t;
        g.attr('transform', t.toString());

        // Counter-scale pins so they stay constant visual size
        pinsGroup.selectAll<SVGGElement, unknown>('.pin').each(function() {
          const el = d3.select(this);
          const cx = +el.attr('data-cx');
          const cy = +el.attr('data-cy');
          el.attr('transform', `translate(${cx},${cy}) scale(${1 / t.k})`);
        });

        onClusterHoverRef.current(null, null);
        onClusterClickRef.current(null, null);
      })
      .on('end', () => {
        // Re-cluster at the new zoom level when gesture settles
        const proj = projectionRef.current;
        const pg = pinsGroupRef.current;
        if (!proj || !pg) return;
        const currentK = transformRef.current.k;
        const merged = mergeNearbyClusters(baseClustersRef.current, proj, currentK);
        drawPins(merged, proj, pg, currentK);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    return () => {
      svg.selectAll('*').remove();
      svg.on('.zoom', null);
      pinsGroupRef.current = null;
      projectionRef.current = null;
    };
  }, [worldData]);

  // Reusable pin-drawing helper
  function drawPins(
    clusters: CityCluster[],
    projection: d3.GeoProjection,
    pinsGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    currentK: number,
  ) {
    pinsGroup.selectAll('*').remove();

    const SINGLE_R = 6;
    const MULTI_R = 10;

    clusters.forEach(cluster => {
      const coords = projection([cluster.lng, cluster.lat]);
      if (!coords) return;
      const [cx, cy] = coords;

      const pinG = pinsGroup.append('g')
        .attr('class', 'pin')
        .attr('data-cx', cx)
        .attr('data-cy', cy)
        .attr('transform', `translate(${cx},${cy}) scale(${1 / currentK})`)
        .style('cursor', 'pointer');

      if (cluster.count === 1) {
        pinG.append('circle')
          .attr('cx', 0).attr('cy', 0).attr('r', SINGLE_R)
          .attr('fill', PIN_DOT).attr('stroke', PIN_STROKE).attr('stroke-width', 0.8);
        pinG.append('circle')
          .attr('cx', 0).attr('cy', 0).attr('r', 2.5)
          .attr('fill', '#fff');

        pinG
          .on('mouseenter', () => {
            onClusterHoverRef.current(cluster, screenPos(cx, cy, transformRef.current));
          })
          .on('mouseleave', () => onClusterHoverRef.current(null, null))
          .on('click', (e) => {
            e.stopPropagation();
            onSelectRef.current(cluster.companies[0]);
            onClusterHoverRef.current(null, null);
          });
      } else {
        pinG.append('circle')
          .attr('cx', 0).attr('cy', 0).attr('r', MULTI_R)
          .attr('fill', PIN_DOT).attr('stroke', PIN_STROKE).attr('stroke-width', 1);
        pinG.append('text')
          .attr('x', 0).attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#111')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '700')
          .text(cluster.count);

        pinG
          .on('mouseenter', () => {
            onClusterHoverRef.current(cluster, screenPos(cx, cy, transformRef.current));
          })
          .on('mouseleave', () => onClusterHoverRef.current(null, null))
          .on('click', (e) => {
            e.stopPropagation();
            onClusterClickRef.current(cluster, screenPos(cx, cy, transformRef.current));
            onClusterHoverRef.current(null, null);
          });
      }
    });
  }

  // Draw cluster pins whenever companies change
  useEffect(() => {
    const projection = projectionRef.current;
    const pinsGroup = pinsGroupRef.current;
    if (!projection || !pinsGroup) return;

    const base = clusterByCity(companies);
    baseClustersRef.current = base;
    const currentK = transformRef.current.k;
    const merged = mergeNearbyClusters(base, projection, currentK);
    drawPins(merged, projection, pinsGroup, currentK);
  }, [companies]);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ background: BG }}>
      <svg ref={svgRef} className="w-full h-full" />

      <div className="absolute top-3 left-3 text-[10px] font-mono uppercase pointer-events-none" style={{ color: MUTED }}>
        // AMM Global Network
      </div>
      <div className="absolute top-3 right-3 text-[10px] font-mono uppercase pointer-events-none" style={{ color: MUTED }}>
        {companies.length} Nodes Active
      </div>
      <div className="absolute bottom-3 left-3 text-[10px] font-mono uppercase pointer-events-none" style={{ color: MUTED }}>
        Egocentric Data Providers
      </div>

      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-black/15 pointer-events-none" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-black/15 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-black/15 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-black/15 pointer-events-none" />

      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => {
            if (svgRef.current && zoomRef.current)
              d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
          }}
          className="w-8 h-8 border border-[#111] bg-[var(--background)] text-sm font-bold hover:bg-[#111] hover:text-[#f4efe6] transition-colors"
        >+</button>
        <button
          onClick={() => {
            if (svgRef.current && zoomRef.current)
              d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.67);
          }}
          className="w-8 h-8 border border-[#111] bg-[var(--background)] text-sm font-bold hover:bg-[#111] hover:text-[#f4efe6] transition-colors"
        >−</button>
        <button
          onClick={() => {
            if (svgRef.current && zoomRef.current)
              d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
          }}
          className="w-8 h-8 border border-[#111] bg-[var(--background)] text-[7px] font-bold hover:bg-[#111] hover:text-[#f4efe6] transition-colors"
        >RST</button>
      </div>
    </div>
  );
}
