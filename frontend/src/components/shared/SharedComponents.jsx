import React, { useEffect, useMemo, useRef } from 'react';
import { BusFront, Loader2, AlertCircle, Search, RotateCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import roadPaths from './bus-road-paths.json';

const UIU_COORD = { lat: 23.7979, lng: 90.4492, label: 'UIU Campus' };
const KURIL_BISHWAROAD_ROUTE = [
  { lat: 23.8187, lng: 90.4204, label: 'Kuril Bishwaroad' },
  { lat: 23.8207, lng: 90.4241, label: 'Kuril Connector' },
  { lat: 23.8240, lng: 90.4493, label: 'Road 02 North Turn' },
  { lat: 23.8020, lng: 90.4491, label: 'Jauar Tek Turn' },
  { lat: 23.8004, lng: 90.4477, label: 'UIU Approach' },
  UIU_COORD
];
const savedPath = (bus) => roadPaths[bus].coordinates.map(([lng, lat]) => ({ lat, lng }));
const UIU_TO_NATUN_BAZAR_ROUTE = savedPath('BUS-01');
const UIU_TO_BADDA_ROUTE = savedPath('BUS-03');
const BUS_ROUTES = {
  'BUS-01': {
    name: 'Bus 01',
    color: '#2563eb',
    origin: 'UIU',
    roadPath: UIU_TO_NATUN_BAZAR_ROUTE,
    waypoints: UIU_TO_NATUN_BAZAR_ROUTE,
    livePoint: { lat: 23.8004, lng: 90.4334 }
  },
  'BUS-02': {
    name: 'Bus 02',
    color: '#0f766e',
    origin: 'Kuril Bishwaroad',
    waypoints: KURIL_BISHWAROAD_ROUTE,
    fallbackPath: [],
    livePoint: { lat: 23.8030, lng: 90.4462 }
  },
  'BUS-03': {
    name: 'Bus 03',
    color: '#7c3aed',
    origin: 'UIU',
    roadPath: UIU_TO_BADDA_ROUTE,
    waypoints: UIU_TO_BADDA_ROUTE,
    fallbackPath: [],
    livePoint: { lat: 23.7876, lng: 90.4534 }
  }
};
const BUS_ORDER = ['BUS-01', 'BUS-02', 'BUS-03'];
const VISIBLE_BUSES = new Set(['BUS-01', 'BUS-02', 'BUS-03']);

function getRouteForBus(bus) {
  return BUS_ROUTES[bus] || {
    name: bus,
    color: '#0284c7',
    origin: 'Campus Route',
    waypoints: [{ lat: 23.7937, lng: 90.4234 }, UIU_COORD],
    fallbackPath: [{ lat: 23.7937, lng: 90.4234 }, UIU_COORD],
    livePoint: UIU_COORD
  };
}

async function fetchRoadPath(route, signal) {
  if (route.roadPath) return route.roadPath;
  const coordinates = route.waypoints.map((point) => `${point.lng},${point.lat}`).join(';');
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`,
    { signal }
  );
  if (!response.ok) throw new Error('Route service unavailable');
  const data = await response.json();
  const path = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(path) || path.length < 2) throw new Error('Route geometry missing');
  return path.map(([lng, lat]) => ({ lat, lng }));
}

function distanceBetween(a, b) {
  const earthRadiusMeters = 6371000;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const deltaLat = (b.lat - a.lat) * Math.PI / 180;
  const deltaLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function pointAlongPath(path, progress) {
  if (!path.length) return UIU_COORD;
  if (path.length === 1) return path[0];
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const segmentLengths = [];
  let totalLength = 0;

  for (let index = 1; index < path.length; index += 1) {
    const segmentLength = distanceBetween(path[index - 1], path[index]);
    segmentLengths.push(segmentLength);
    totalLength += segmentLength;
  }

  if (!totalLength) return path[0];
  let targetLength = totalLength * clampedProgress;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    if (targetLength <= segmentLength) {
      const start = path[index];
      const end = path[index + 1];
      const ratio = segmentLength ? targetLength / segmentLength : 0;
      return {
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio
      };
    }
    targetLength -= segmentLength;
  }

  return path[path.length - 1];
}


function markerIcon(className, html) {
  return L.divIcon({
    className,
    html,
    iconSize: null
  });
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function NoticeList({ notices }) {
  if (!notices?.length) return <p className="muted">No notices available.</p>;
  return (
    <div className="notice-list">
      {notices.map((notice) => (
        <article key={notice.id}>
          <span>{notice.category || 'General'}</span>
          <strong>{notice.title}</strong>
          <p>{notice.content}</p>
        </article>
      ))}
    </div>
  );
}

export function BusLocations({ locations }) {
  const entries = Object.entries(locations || {}).filter(([bus]) => VISIBLE_BUSES.has(bus)).sort(([a], [b]) => {
    const aIndex = BUS_ORDER.indexOf(a);
    const bIndex = BUS_ORDER.indexOf(b);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
  const routeKey = entries.map(([bus]) => bus).join('|');
  const routes = useMemo(() => entries.map(([bus, location]) => ({
    bus,
    location,
    ...getRouteForBus(bus)
  })), [routeKey]);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !routes.length) return undefined;
    const abortController = new AbortController();
    let active = true;
    const animationFrames = [];
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      preferCanvas: true
    }).setView([UIU_COORD.lat, UIU_COORD.lng], 13);
    const layerGroup = L.featureGroup().addTo(map);
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
      const bounds = layerGroup.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.08), { maxZoom: 15 });
    });
    resizeObserver.observe(mapRef.current);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([UIU_COORD.lat, UIU_COORD.lng], {
      icon: markerIcon('bus-campus-div-icon', '<span>UIU</span>'),
      title: UIU_COORD.label
    }).addTo(layerGroup);

    async function drawRoutes() {
      const routePaths = await Promise.all(routes.map(async (route) => {
        try {
          return { route, path: await fetchRoadPath(route, abortController.signal) };
        } catch {
          if (abortController.signal.aborted) return null;
          if (!Array.isArray(route.fallbackPath) || route.fallbackPath.length < 2) return null;
          return { route, path: route.fallbackPath };
        }
      }));

      if (!active) return;
      routePaths.filter(Boolean).forEach(({ route, path }) => {
        const latLngs = path.map((point) => [point.lat, point.lng]);
        const startProgress = 0;
        L.polyline(latLngs, {
          color: route.color,
          weight: 5,
          opacity: 0.88,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(layerGroup);

        L.circleMarker([route.waypoints[0].lat, route.waypoints[0].lng], {
          radius: 5,
          color: route.color,
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 1
        }).addTo(layerGroup);

        const destination = route.waypoints[route.waypoints.length - 1];
        L.circleMarker([destination.lat, destination.lng], {
          radius: 5,
          color: route.color,
          weight: 2,
          fillColor: route.color,
          fillOpacity: 0.85
        }).addTo(layerGroup);

        const livePoint = pointAlongPath(path, startProgress);
        const liveMarker = L.marker([livePoint.lat, livePoint.lng], {
          icon: markerIcon(
            'bus-live-div-icon',
            `<span style="--bus-color:${route.color}"><i></i><b>${route.bus.replace('BUS-', '')}</b></span>`
          ),
          title: `${route.bus}: ${route.location}`
        }).addTo(layerGroup);

        // Simulate 20 km/h over the complete saved road geometry, then dwell
        // at the destination. performance.now() is not a repeating trip clock.
        const lengthMeters = path.slice(1).reduce((sum, point, index) => sum + distanceBetween(path[index], point), 0);
        const routeDurationMs = lengthMeters / (20 / 3.6) * 1000;
        const startedAt = performance.now();
        const animationIndex = animationFrames.push(0) - 1;
        const animateBus = (timestamp) => {
          if (!active) return;
          const progress = Math.min(1, startProgress + (timestamp - startedAt) / routeDurationMs);
          const nextPoint = pointAlongPath(path, progress);
          liveMarker.setLatLng([nextPoint.lat, nextPoint.lng]);
          if (progress < 1) animationFrames[animationIndex] = requestAnimationFrame(animateBus);
        };
        animationFrames[animationIndex] = requestAnimationFrame(animateBus);
      });

      const bounds = layerGroup.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.08), { maxZoom: 15 });
      requestAnimationFrame(() => map.invalidateSize());
    }

    drawRoutes();

    return () => {
      active = false;
      animationFrames.forEach((frame) => {
        if (frame) cancelAnimationFrame(frame);
      });
      abortController.abort();
      resizeObserver.disconnect();
      map.remove();
    };
  }, [routes]);

  if (!entries.length) return <p className="muted">No bus socket transmissions yet.</p>;

  return (
    <div className="bus-feed">
      <div className="bus-route-legend" aria-label="Visible shuttle routes">
        {routes.map((route) => (
          <span className="bus-route-pill" key={route.bus} style={{ '--bus-color': route.color }}>
            <i aria-hidden="true" />
            {route.name}
          </span>
        ))}
      </div>
      <div ref={mapRef} className="bus-osm-map" aria-label="Interactive OpenStreetMap shuttle route overview" />

      <div className="bus-list">
        {routes.map((route) => (
          <div className="bus-item" key={route.bus} style={{ '--bus-color': route.color }}>
            <span className="bus-icon"><BusFront size={16} /></span>
            <div className="bus-copy">
              <div className="bus-meta">
                <strong>{route.bus}</strong>
                <span className="bus-live"><i aria-hidden="true" /> live</span>
              </div>
              <span className="bus-location">{locations[route.bus]}</span>
              <div className="bus-route-line" aria-hidden="true"><span /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatRow({ label, value, color = 'accent' }) {
  return (
    <div className={`stat-row-item stat-row-item--${color}`}>
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  );
}

export function Panel({ title, tag, action, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        <div className="panel-head-actions">
          {tag && <span className={`panel-tag ${statusClass(tag)}`}>{tag}</span>}
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

function statusClass(value) {
  const normalized = String(value || '').toLowerCase();
  if (/(healthy|optimal|online|live|available|occupied)/.test(normalized)) return 'status--success';
  if (/(socket|fifo|stack|feed|set|comparable|maintenance|users)/.test(normalized)) return 'status--info';
  if (/(pending|medium|warning)/.test(normalized)) return 'status--warning';
  if (/(critical|high|error|danger)/.test(normalized)) return 'status--danger';
  return 'status--neutral';
}

function chipClass(value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (!normalized) return '';
  if (normalized === 'high') return 'cell-chip chip-priority-high';
  if (normalized === 'medium') return 'cell-chip chip-priority-medium';
  if (normalized === 'low') return 'cell-chip chip-priority-low';
  if (/(resolved|available|occupied|completed|online|live|optimal|healthy)/.test(normalized)) return 'cell-chip chip-status-success';
  if (/(pending|queued|waiting)/.test(normalized)) return 'cell-chip chip-status-pending';
  if (/(progress|processing|maintenance)/.test(normalized)) return 'cell-chip chip-status-progress';
  if (/(critical|error|failed)/.test(normalized)) return 'cell-chip chip-status-critical';
  return '';
}

function renderCell(cell) {
  const text = String(cell ?? '-');
  const className = chipClass(text);
  return className ? <span className={className}>{text}</span> : text;
}

export function Table({ headers, rows, empty }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows?.length ? rows.map((row, index) => (
            <tr key={index}>{row.map((cell, i) => <td key={`${index}-${i}`}>{renderCell(cell)}</td>)}</tr>
          )) : (
            <tr><td colSpan={headers.length}>{empty || 'No records available.'}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ActionButton({ label, icon: Icon, onClick }) {
  return <button className="ghost-btn" type="button" onClick={onClick}><Icon size={16} /> {label}</button>;
}

export function LoadingState() {
  return (
    <div className="center-state">
      <Loader2 className="spin" size={32} />
      <p>Loading Smart Campus…</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const isAuthError = String(error).toLowerCase().includes('401') || String(error).toLowerCase().includes('session');
  
  if (isAuthError) {
    return (
      <div className="admin-error-state">
        <AlertCircle size={32} style={{ color: 'var(--amber)', marginBottom: '0.75rem' }} />
        <h3>Session Expired</h3>
        <p className="muted">Please sign in again to continue.</p>
        <a className="primary-btn" href="/login" style={{ marginTop: '1rem', display: 'inline-flex' }}>Sign in again</a>
      </div>
    );
  }

  return (
    <div className="admin-error-state">
      <AlertCircle size={32} style={{ color: 'var(--rose)', marginBottom: '0.75rem' }} />
      <h3>Couldn't load data</h3>
      <p className="muted">{error || 'Please check the server connection and try again.'}</p>
      {onRetry && (
        <button className="secondary-btn" onClick={onRetry} type="button" style={{ marginTop: '1rem' }}>
          <RotateCw size={16} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon = Search, action }) {
  return (
    <div className="admin-empty-state">
      <Icon size={32} style={{ color: 'var(--tx-muted)', marginBottom: '0.75rem' }} />
      <h3>{title || 'No records found'}</h3>
      <p className="muted">{message || 'Try changing your search or filters.'}</p>
      {action && (
        <div style={{ marginTop: '1rem' }}>
          {action}
        </div>
      )}
    </div>
  );
}
