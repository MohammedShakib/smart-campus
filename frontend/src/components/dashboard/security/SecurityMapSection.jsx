import React, { useState } from 'react';
import {
  MapPin, ShieldCheck, DoorOpen, Car, AlertTriangle, RadioTower,
  CheckCircle2, Eye, Building2, Flame, UsersRound
} from 'lucide-react';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

export function SecurityMapSection({ data }) {
  const [selectedPin, setSelectedPin] = useState(null);

  const securityCheckpoints = [
    {
      id: 'gate-1',
      title: 'Gate 1 - Main Campus Entrance',
      type: 'ENTRY_GATE',
      status: 'OPERATIONAL',
      officer: 'Gate Security Post',
      details: 'Main pedestrian entrance and verification post.',
      coords: { top: '78%', left: '48%' },
      stats: `${data?.securitySummary?.gateEntriesToday || 0} entries today`
    },
    {
      id: 'gate-2',
      title: 'Gate 2 - North Exit & Shuttle Bay',
      type: 'EXIT_GATE',
      status: 'OPERATIONAL',
      officer: 'Gate Security Post',
      details: 'Vehicle exit barrier and Shuttle bus check-in.',
      coords: { top: '22%', left: '82%' },
      stats: `${data?.securitySummary?.gateExitsToday || 0} exits today`
    }
  ];

  const parkingZones = data?.securitySummary?.parkingZones || [];
  parkingZones.forEach((zone, index) => {
    let top = '65%';
    let left = '32%';
    if (index === 1) { top = '68%'; left = '62%'; }
    
    securityCheckpoints.push({
      id: `parking-${zone.zoneCode}`,
      title: zone.zoneName,
      type: 'PARKING_ACCESS',
      status: (zone.status === 'FULL' || zone.status === 'ALMOST_FULL') ? 'NEAR_CAPACITY' : 'OPERATIONAL',
      officer: 'Automated Sensor',
      details: `Vehicle occupancy monitoring for ${zone.type} zone.`,
      coords: { top, left },
      stats: `${zone.currentOccupied} / ${zone.totalCapacity} parked`
    });
  });

  securityCheckpoints.push({
    id: 'sec-hq',
    title: 'Campus Security Control Center',
    type: 'HQ',
    status: 'ACTIVE_MONITORING',
    officer: 'Chief Security Officer',
    details: 'Central security monitoring and PA Emergency Broadcast console.',
    coords: { top: '48%', left: '50%' },
    stats: 'Monitoring active'
  });

  securityCheckpoints.push({
    id: 'assembly-zone',
    title: 'Emergency Evacuation Assembly Ground',
    type: 'EMERGENCY',
    status: data?.securitySummary?.hasActiveEmergency ? 'ALERT' : 'CLEAR',
    officer: 'Evacuation Marshal',
    details: 'Designated outdoor safe zone on UIU Central Sports Field.',
    coords: { top: '35%', left: '20%' },
    stats: 'Designated safe area'
  });

  return (
    <div className="sec-subpage-container">
      <SectionHeader
        title="Interactive Security Map & Perimeter Checkpoints"
        subtitle="Operational status overview of campus access gates, parking ramps, and emergency assembly zones."
      />

      <div className="sec-map-layout">
        {/* Left: Map Graphic */}
        <div className="sec-map-canvas-card">
          <div className="sec-map-canvas">
            {/* Campus Structural Layout Background */}
            <div className="sec-map-building sec-map-main-building">
              <Building2 size={24} />
              <span>UIU Main Academic Building</span>
              <small>Floors G - 8</small>
            </div>

            <div className="sec-map-building sec-map-sports-field">
              <span>Central Sports Ground</span>
              <small>Emergency Assembly Point</small>
            </div>

            <div className="sec-map-road sec-map-madani-ave">
              <span>Madani Avenue (100 Feet)</span>
            </div>

            {/* Checkpoint Pins */}
            {securityCheckpoints.map((pt) => {
              const isSelected = selectedPin?.id === pt.id;
              const isWarning = pt.status === 'NEAR_CAPACITY';

              return (
                <button
                  key={pt.id}
                  type="button"
                  className={`sec-map-pin ${isSelected ? 'sec-map-pin--selected' : ''} ${isWarning ? 'sec-map-pin--warn' : ''}`}
                  style={{ top: pt.coords.top, left: pt.coords.left }}
                  onClick={() => setSelectedPin(pt)}
                >
                  <span className="sec-pin-pulse" />
                  <MapPin size={18} />
                  <span className="sec-pin-label">{pt.title.split(' - ')[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="sec-map-legend">
            <span><span className="sec-legend-dot sec-legend-dot--green" /> Operational / Clear</span>
            <span><span className="sec-legend-dot sec-legend-dot--amber" /> Near Capacity</span>
            <span><span className="sec-legend-dot sec-legend-dot--blue" /> Security HQ & CCTV</span>
          </div>
        </div>

        {/* Right: Selected Checkpoint Details */}
        <div className="sec-map-side-card">
          <Panel title="Checkpoint Telemetry" tag={selectedPin ? selectedPin.type : 'Select Node'}>
            {selectedPin ? (
              <div className="sec-checkpoint-details">
                <div className="sec-cp-header">
                  <span className="sec-status-badge sec-status-badge--active">{selectedPin.status}</span>
                  <h3>{selectedPin.title}</h3>
                </div>

                <div className="sec-cp-body">
                  <div className="sec-cp-row">
                    <span>Officer / Link:</span>
                    <strong>{selectedPin.officer}</strong>
                  </div>
                  <div className="sec-cp-row">
                    <span>Current Stats:</span>
                    <strong>{selectedPin.stats}</strong>
                  </div>
                  <div className="sec-cp-row">
                    <span>Operational Notes:</span>
                    <p>{selectedPin.details}</p>
                  </div>
                </div>

                <div className="sec-cp-actions">
                  <button type="button" className="primary-btn sec-btn-full" onClick={() => alert(`Direct intercom signal sent to ${selectedPin.title}`)}>
                    <RadioTower size={16} /> Intercom Connect
                  </button>
                </div>
              </div>
            ) : (
              <div className="sec-scan-placeholder">
                <MapPin size={40} className="muted" />
                <h3>Select a Gate or Checkpoint</h3>
                <p>Click any map pin on the left to inspect real-time perimeter sensor data and officer assignments.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
