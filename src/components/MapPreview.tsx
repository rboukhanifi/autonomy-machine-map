'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

const BG = '#f4efe6';
const OCEAN = '#ece7de';
const LAND = '#2a2a2a';
const LAND_STROKE = '#444';
const GRATICULE = '#ddd8cf';

interface Pin {
  lng: number;
  lat: number;
}

interface MapPreviewProps {
  pins?: Pin[];
}

const DEFAULT_PINS: Pin[] = [
  { lng: -122.18, lat: 37.45 },
  { lng: -122.17, lat: 37.43 },
  { lng: -122.33, lat: 47.61 },
  { lng: -79.99, lat: 40.44 },
  { lng: -2.59, lat: 51.45 },
  { lng: 11.58, lat: 48.14 },
  { lng: 13.33, lat: 52.51 },
  { lng: 8.55, lat: 47.37 },
  { lng: 121.47, lat: 31.23 },
  { lng: 116.39, lat: 39.91 },
  { lng: 139.69, lat: 35.68 },
  { lng: 127.36, lat: 36.37 },
  { lng: 78.49, lat: 17.39 },
  { lng: 77.59, lat: 12.97 },
  { lng: 103.82, lat: 1.35 },
];

export function MapPreview({ pins }: MapPreviewProps) {
  const PINS = pins ?? DEFAULT_PINS;
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visiblePins, setVisiblePins] = useState(0);
  const [worldData, setWorldData] = useState<Topology | null>(null);
  const hasAnimated = useRef(false);
  const projRef = useRef<d3.GeoProjection | null>(null);
  const pinsGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    fetch('/world-110m.json')
      .then(r => r.json())
      .then(data => setWorldData(data));
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const projection = d3.geoNaturalEarth1()
      .fitSize([width - 20, height - 20], { type: 'Sphere' } as d3.GeoPermissibleObjects)
      .translate([width / 2, height / 2]);

    projRef.current = projection;
    const path = d3.geoPath(projection);
    const g = svg.append('g');

    // Background
    g.append('rect').attr('width', width).attr('height', height).attr('fill', BG);

    // Sphere
    g.append('path')
      .datum({ type: 'Sphere' } as d3.GeoPermissibleObjects)
      .attr('d', path).attr('fill', OCEAN).attr('stroke', '#ccc').attr('stroke-width', 0.5);

    // Graticule
    const graticule = d3.geoGraticule().step([30, 30]);
    g.append('path').datum(graticule()).attr('d', path)
      .attr('fill', 'none').attr('stroke', GRATICULE).attr('stroke-width', 0.3);

    // Countries
    const countries = topojson.feature(worldData, worldData.objects.countries as GeometryCollection);
    g.selectAll('path.country')
      .data((countries as GeoJSON.FeatureCollection).features)
      .join('path')
      .attr('d', path).attr('fill', LAND).attr('stroke', LAND_STROKE).attr('stroke-width', 0.3);

    // Pins group
    const pinsGroup = g.append('g');
    pinsGroupRef.current = pinsGroup;

    // Start intersection observer for staggered reveal
    if (!hasAnimated.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            hasAnimated.current = true;
            let i = 0;
            const speed = PINS.length > 20 ? 60 : 180;
            const interval = setInterval(() => {
              i++;
              setVisiblePins(i);
              if (i >= PINS.length) clearInterval(interval);
            }, speed);
            observer.unobserve(container);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(container);
    } else {
      setVisiblePins(PINS.length);
    }
  }, [worldData]);

  // Draw pins (staggered reveal, no pulse animation)
  useEffect(() => {
    const projection = projRef.current;
    const pinsGroup = pinsGroupRef.current;
    if (!projection || !pinsGroup) return;

    pinsGroup.selectAll('*').remove();

    PINS.slice(0, visiblePins).forEach((pin) => {
      const coords = projection([pin.lng, pin.lat]);
      if (!coords) return;
      const [cx, cy] = coords;

      // Main yellow dot
      pinsGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 3.5)
        .attr('fill', '#ffcc00').attr('stroke', '#b89a00').attr('stroke-width', 0.6)
        .attr('opacity', 0)
        .transition().duration(400).attr('opacity', 1);

      // Inner bright core
      pinsGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 1.5)
        .attr('fill', '#fff');
    });
  }, [visiblePins, worldData]);

  return (
    <div ref={containerRef} className="w-full aspect-[2.2/1] relative border border-[var(--border)] overflow-hidden" style={{ background: BG }}>
      <svg ref={svgRef} className="w-full h-full" />

      {/* HUD overlays */}
      <div className="absolute top-2 left-3 text-[9px] font-mono text-[var(--muted)] uppercase">
        Global Coverage // {visiblePins} Nodes Active
      </div>
      <div className="absolute bottom-2 right-3 text-[9px] font-mono text-[var(--muted)] uppercase">
        Egocentric Data Network
      </div>

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-black/10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-black/10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-black/10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-black/10 pointer-events-none" />
    </div>
  );
}
