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

const PINS = [
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

export function MapPreview() {
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

    // Yellow glow filter
    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'preview-shadow').attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '2.5').attr('result', 'blur');
    glow.append('feFlood').attr('flood-color', '#ffdd44').attr('flood-opacity', '0.5').attr('result', 'color');
    glow.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
    const ms = glow.append('feMerge');
    ms.append('feMergeNode').attr('in', 'glow');
    ms.append('feMergeNode').attr('in', 'SourceGraphic');

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

    // Start intersection observer
    if (!hasAnimated.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            hasAnimated.current = true;
            let i = 0;
            const interval = setInterval(() => {
              i++;
              setVisiblePins(i);
              if (i >= PINS.length) clearInterval(interval);
            }, 180);
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

  // Animate pins
  useEffect(() => {
    const projection = projRef.current;
    const pinsGroup = pinsGroupRef.current;
    if (!projection || !pinsGroup) return;

    pinsGroup.selectAll('*').remove();

    PINS.slice(0, visiblePins).forEach((pin) => {
      const coords = projection([pin.lng, pin.lat]);
      if (!coords) return;
      const [cx, cy] = coords;

      // Pulse ring - yellow
      const ring = pinsGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 3)
        .attr('fill', 'none').attr('stroke', 'rgba(255,204,0,0.3)').attr('stroke-width', 0.8);

      function pulse() {
        ring.attr('r', 3).attr('opacity', 0.5)
          .transition().duration(2500 + Math.random() * 1500).ease(d3.easeCircleOut)
          .attr('r', 14).attr('opacity', 0).on('end', pulse);
      }
      pulse();

      // Crosshair
      pinsGroup.append('line')
        .attr('x1', cx - 4).attr('y1', cy).attr('x2', cx + 4).attr('y2', cy)
        .attr('stroke', '#b89a00').attr('stroke-width', 0.4).attr('opacity', 0.4);
      pinsGroup.append('line')
        .attr('x1', cx).attr('y1', cy - 4).attr('x2', cx).attr('y2', cy + 4)
        .attr('stroke', '#b89a00').attr('stroke-width', 0.4).attr('opacity', 0.4);

      // Outer glow
      pinsGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 5)
        .attr('fill', '#ffcc00').attr('opacity', 0.12);

      // Main yellow dot with glow
      pinsGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 3.5)
        .attr('fill', '#ffcc00').attr('stroke', '#b89a00').attr('stroke-width', 0.6)
        .attr('filter', 'url(#preview-shadow)')
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
