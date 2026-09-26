import React from 'react';
import { BusFront, Loader2, AlertCircle, Search, RotateCw } from 'lucide-react';

const UIU_COORD = { lat: 23.7979, lng: 90.4492, label: 'UIU Campus' };
const BUS_ROUTE_POINTS = {
  'BUS-01': [
    { lat: 23.7937, lng: 90.4234, label: 'Natun Bazar' },
    { lat: 23.8019, lng: 90.4377, label: '100 Feet Bridge' },
    UIU_COORD
  ],
  'BUS-02': [
    { lat: 23.8223, lng: 90.4204, label: 'Kuril Flyover' },
    { lat: 23.8117, lng: 90.4338, label: 'Bashundhara Link' },
    UIU_COORD
  ],
  'BUS-03': [
    { lat: 23.7808, lng: 90.4254, label: 'Badda' },
    { lat: 23.7937, lng: 90.4234, label: 'Natun Bazar' },
    UIU_COORD
  ]
};

const BUS_LIVE_POINTS = {
  'BUS-01': { lat: 23.8019, lng: 90.4377, label: 'Near 100 Feet Bridge' },
  'BUS-02': { lat: 23.7991, lng: 90.4472, label: 'Approaching Campus Gate' },
  'BUS-03': { lat: 23.7937, lng: 90.4234, label: 'Departed Natun Bazar' }
};

const OSM_ZOOM = 13;
const TILE_SIZE = 256;

function latLngToWorld({ lat, lng }, zoom = OSM_ZOOM) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function getRouteForBus(bus) {
  return BUS_ROUTE_POINTS[bus] || [
    { lat: 23.7937, lng: 90.4234, label: 'Campus Route' },
    UIU_COORD
  ];
}

function getLivePoint(bus, location) {
  const normalized = String(location || '').toLowerCase();
  if (normalized.includes('100 feet')) return BUS_LIVE_POINTS['BUS-01'];
  if (normalized.includes('campus gate') || normalized.includes('approaching')) return BUS_LIVE_POINTS['BUS-02'];
  if (normalized.includes('natun bazar')) return BUS_LIVE_POINTS['BUS-03'];
  const route = getRouteForBus(bus);
  return BUS_LIVE_POINTS[bus] || route[route.length - 1];
}

function buildMapModel(entries) {
  const routes = entries.map(([bus, location]) => ({
    bus,
    location,
    points: getRouteForBus(bus),
    livePoint: getLivePoint(bus, location)
  }));
  const allPoints = routes.flatMap((route) => [...route.points, route.livePoint, UIU_COORD]);
  const worldPoints = allPoints.map((point) => latLngToWorld(point));
  const minX = Math.min(...worldPoints.map((point) => point.x));
  const maxX = Math.max(...worldPoints.map((point) => point.x));
  const minY = Math.min(...worldPoints.map((point) => point.y));
  const maxY = Math.max(...worldPoints.map((point) => point.y));
  const padding = 90;
  const bounds = {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding
  };
  bounds.width = bounds.maxX - bounds.minX;
  bounds.height = bounds.maxY - bounds.minY;

  const toPct = (point) => {
    const world = latLngToWorld(point);
    return {
      x: ((world.x - bounds.minX) / bounds.width) * 100,
      y: ((world.y - bounds.minY) / bounds.height) * 100
    };
  };

  const tiles = [];
  const startTileX = Math.floor(bounds.minX / TILE_SIZE);
  const endTileX = Math.floor(bounds.maxX / TILE_SIZE);
  const startTileY = Math.floor(bounds.minY / TILE_SIZE);
  const endTileY = Math.floor(bounds.maxY / TILE_SIZE);
  for (let x = startTileX; x <= endTileX; x += 1) {
    for (let y = startTileY; y <= endTileY; y += 1) {
      tiles.push({
        key: `${x}-${y}`,
        src: `https://tile.openstreetmap.org/${OSM_ZOOM}/${x}/${y}.png`,
        left: (((x * TILE_SIZE) - bounds.minX) / bounds.width) * 100,
        top: (((y * TILE_SIZE) - bounds.minY) / bounds.height) * 100,
        width: (TILE_SIZE / bounds.width) * 100,
        height: (TILE_SIZE / bounds.height) * 100
      });
    }
  }

  return {
    tiles,
    routes: routes.map((route) => ({
      ...route,
      path: route.points.map(toPct),
      live: toPct(route.livePoint)
    })),
    campus: toPct(UIU_COORD)
  };
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
  const entries = Object.entries(locations || {});
  if (!entries.length) return <p className="muted">No bus socket transmissions yet.</p>;
  const map = buildMapModel(entries);
  return (
    <div className="bus-feed">
      <div className="bus-osm-map" aria-label="OpenStreetMap shuttle route overview">
        <div className="bus-osm-tiles" aria-hidden="true">
          {map.tiles.map((tile) => (
            <img
              key={tile.key}
              src={tile.src}
              alt=""
              loading="lazy"
              draggable="false"
              style={{ left: `${tile.left}%`, top: `${tile.top}%`, width: `${tile.width}%`, height: `${tile.height}%` }}
            />
          ))}
        </div>
        <svg className="bus-osm-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {map.routes.map((route) => (
            <polyline
              key={route.bus}
              points={route.path.map((point) => `${point.x},${point.y}`).join(' ')}
              className={`bus-osm-route bus-osm-route--${route.bus.toLowerCase()}`}
            />
          ))}
        </svg>
        <span className="bus-campus-pin" style={{ left: `${map.campus.x}%`, top: `${map.campus.y}%` }}>UIU</span>
        {map.routes.map((route) => (
          <span
            className="bus-live-marker"
            key={route.bus}
            style={{ left: `${route.live.x}%`, top: `${route.live.y}%` }}
            title={`${route.bus}: ${route.location}`}
          >
            <BusFront size={14} />
            <strong>{route.bus.replace('BUS-', '')}</strong>
          </span>
        ))}
        <a className="bus-map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>
      </div>

      <div className="bus-list">
        {entries.map(([bus, location]) => (
          <div className="bus-item" key={bus}>
            <span className="bus-icon"><BusFront size={16} /></span>
            <div className="bus-copy">
              <div className="bus-meta">
                <strong>{bus}</strong>
                <span className="bus-live"><i aria-hidden="true" /> live</span>
              </div>
              <span className="bus-location">{location}</span>
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
