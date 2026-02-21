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

interface WorldMapProps {
  companies: Company[];
  selected: Company | null;
  onSelect: (c: Company | null) => void;
}

// Beige palette
const BG = '#f4efe6';
const OCEAN = '#ece7de';
const LAND = '#2a2a2a';
const LAND_STROKE = '#444';
const BORDER = '#555';
const GRATICULE = '#d8d3ca';
const GRATICULE_FINE = '#e0dbd2';
const PIN_DOT = '#ffcc00';
const PIN_STROKE = '#b89a00';
const PIN_GLOW = '#ffdd44';
const PIN_RING_COLOR = 'rgba(255,204,0,0.35)';
const LABEL_COLOR = '#111';
const MUTED = '#999';

export function WorldMap({ companies, selected, onSelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [worldData, setWorldData] = useState<Topology | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    fetch('/world-110m.json')
      .then(r => r.json())
      .then(data => setWorldData(data));
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Defs
    const defs = svg.append('defs');

    // Yellow glow filter for pins
    const glow = defs.append('filter').attr('id', 'pin-glow').attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '3').attr('result', 'blur');
    glow.append('feFlood').attr('flood-color', PIN_GLOW).attr('flood-opacity', '0.6').attr('result', 'color');
    glow.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
    const mergeGlow = glow.append('feMerge');
    mergeGlow.append('feMergeNode').attr('in', 'glow');
    mergeGlow.append('feMergeNode').attr('in', 'SourceGraphic');

    // Stronger glow for hover
    const glowStrong = defs.append('filter').attr('id', 'pin-glow-strong').attr('x', '-150%').attr('y', '-150%').attr('width', '400%').attr('height', '400%');
    glowStrong.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '5').attr('result', 'blur');
    glowStrong.append('feFlood').attr('flood-color', PIN_GLOW).attr('flood-opacity', '0.8').attr('result', 'color');
    glowStrong.append('feComposite').attr('in', 'color').attr('in2', 'blur').attr('operator', 'in').attr('result', 'glow');
    const mergeGlow2 = glowStrong.append('feMerge');
    mergeGlow2.append('feMergeNode').attr('in', 'glow');
    mergeGlow2.append('feMergeNode').attr('in', 'SourceGraphic');

    // Projection
    const projection = d3.geoNaturalEarth1()
      .fitSize([width - 40, height - 40], { type: 'Sphere' } as d3.GeoPermissibleObjects)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath(projection);
    const g = svg.append('g');

    // Background fill
    g.append('rect')
      .attr('width', width * 3).attr('height', height * 3)
      .attr('x', -width).attr('y', -height)
      .attr('fill', BG);

    // Sphere (ocean)
    g.append('path')
      .datum({ type: 'Sphere' } as d3.GeoPermissibleObjects)
      .attr('d', path)
      .attr('fill', OCEAN)
      .attr('stroke', '#bbb')
      .attr('stroke-width', 0.8);

    // Graticule (fine)
    const graticule2 = d3.geoGraticule().step([10, 10]);
    g.append('path')
      .datum(graticule2())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', GRATICULE_FINE)
      .attr('stroke-width', 0.2);

    // Graticule (major)
    const graticule = d3.geoGraticule().step([30, 30]);
    g.append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', GRATICULE)
      .attr('stroke-width', 0.4);

    // Countries
    const countries = topojson.feature(
      worldData,
      worldData.objects.countries as GeometryCollection
    );

    g.selectAll('path.country')
      .data((countries as GeoJSON.FeatureCollection).features)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', LAND)
      .attr('stroke', LAND_STROKE)
      .attr('stroke-width', 0.5);

    // Internal borders
    const borders = topojson.mesh(
      worldData,
      worldData.objects.countries as GeometryCollection,
      (a, b) => a !== b
    );

    g.append('path')
      .datum(borders)
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', BORDER)
      .attr('stroke-width', 0.3);

    // Equator
    g.append('line')
      .attr('x1', 0).attr('y1', projection([0, 0])![1])
      .attr('x2', width).attr('y2', projection([0, 0])![1])
      .attr('stroke', '#bbb').attr('stroke-width', 0.4)
      .attr('stroke-dasharray', '6,3');

    // Pins
    const pinsGroup = g.append('g').attr('class', 'pins');

    companies.forEach(company => {
      const coords = projection([company.lng, company.lat]);
      if (!coords) return;
      const [cx, cy] = coords;

      const pinGroup = pinsGroup.append('g')
        .style('cursor', 'pointer')
        .on('click', (e) => { e.stopPropagation(); onSelect(company); });

      // Animated pulse ring - yellow
      const ring = pinGroup.append('circle')
        .attr('cx', cx).attr('cy', cy)
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', PIN_RING_COLOR)
        .attr('stroke-width', 1);

      function pulse() {
        ring
          .attr('r', 5).attr('opacity', 0.6)
          .transition().duration(2200 + Math.random() * 800).ease(d3.easeCircleOut)
          .attr('r', 22).attr('opacity', 0)
          .on('end', pulse);
      }
      pulse();

      // Second ring offset
      const ring2 = pinGroup.append('circle')
        .attr('cx', cx).attr('cy', cy)
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', PIN_RING_COLOR)
        .attr('stroke-width', 0.6);

      function pulse2() {
        ring2
          .attr('r', 5).attr('opacity', 0.3)
          .transition().delay(600).duration(2500 + Math.random() * 800).ease(d3.easeCircleOut)
          .attr('r', 28).attr('opacity', 0)
          .on('end', pulse2);
      }
      pulse2();

      // Crosshair - subtle
      const cs = 8;
      pinGroup.append('line')
        .attr('x1', cx - cs).attr('y1', cy).attr('x2', cx + cs).attr('y2', cy)
        .attr('stroke', PIN_STROKE).attr('stroke-width', 0.6).attr('opacity', 0.5);
      pinGroup.append('line')
        .attr('x1', cx).attr('y1', cy - cs).attr('x2', cx).attr('y2', cy + cs)
        .attr('stroke', PIN_STROKE).attr('stroke-width', 0.6).attr('opacity', 0.5);

      // Outer glow circle
      pinGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 6)
        .attr('fill', PIN_DOT)
        .attr('opacity', 0.15);

      // Main yellow dot with glow
      const mainDot = pinGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 4.5)
        .attr('fill', PIN_DOT)
        .attr('stroke', PIN_STROKE).attr('stroke-width', 0.8)
        .attr('filter', 'url(#pin-glow)');

      // Inner bright core
      pinGroup.append('circle')
        .attr('cx', cx).attr('cy', cy).attr('r', 2)
        .attr('fill', '#fff');

      // Label
      const label = pinGroup.append('text')
        .attr('x', cx + 12).attr('y', cy + 3.5)
        .text(company.name)
        .attr('fill', LABEL_COLOR)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', '600')
        .attr('opacity', 0)
        .attr('paint-order', 'stroke')
        .attr('stroke', BG).attr('stroke-width', 3);

      // Hover
      pinGroup
        .on('mouseenter', function () {
          label.attr('opacity', 1);
          mainDot.transition().duration(150).attr('r', 7).attr('filter', 'url(#pin-glow-strong)');
        })
        .on('mouseleave', function () {
          label.attr('opacity', 0);
          mainDot.transition().duration(150).attr('r', 4.5).attr('filter', 'url(#pin-glow)');
        });
    });

    // Click background to deselect
    svg.on('click', () => onSelect(null));

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    return () => {
      svg.selectAll('*').remove();
      svg.on('.zoom', null);
    };
  }, [worldData, companies, onSelect]);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: BG }}>
      <svg ref={svgRef} className="w-full h-full" />

      {/* HUD */}
      <div className="absolute top-3 left-3 text-[10px] font-mono uppercase pointer-events-none" style={{ color: MUTED }}>
        // AMM Global Network
      </div>
      <div className="absolute top-3 right-3 text-[10px] font-mono uppercase pointer-events-none" style={{ color: MUTED }}>
        {companies.length} Nodes Active
      </div>
      <div className="absolute bottom-3 left-3 text-[10px] font-mono uppercase pointer-events-none" style={{ color: MUTED }}>
        Egocentric Data Providers
      </div>

      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-black/15 pointer-events-none" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-black/15 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-black/15 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-black/15 pointer-events-none" />

      {/* Zoom controls */}
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
