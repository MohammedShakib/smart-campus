import React, { useState } from 'react';
import {
  MapPin, ShieldCheck, DoorOpen, Car, AlertTriangle, RadioTower,
  CheckCircle2, Eye, Building2, Flame, UsersRound
} from 'lucide-react';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

export function SecurityMapSection() {
  const [selectedPin, setSelectedPin] = useState(null);

  const securityCheckpoints = [
    {
      id: 'gate-1',
      title: 'Gate 1 - Main Campus Entrance',
      type: 'ENTRY_GATE',
      status: 'OPERATIONAL',
      officer: 'Officer Abul Kalam (Post 1)',
      details: 'Dual RFID barrier, automated visitor scanner, pedestrian turnstiles online.',
      coords: { top: '78%', left: '48%' },
      stats: '142 entries today'
    },
    {
      id: 'gate-2',
      title: 'Gate 2 - North Exit & Shuttle Bay',
      type: 'EXIT_GATE',
      status: 'OPERATIONAL',
      officer: 'Officer Jahangir Hossain (Post 2)',
      details: 'Vehicle exit boom barrier, Shuttle bus check-in terminal.',
      coords: { top: '22%', left: '82%' },
      stats: '88 exits today'
    },
    {
      id: 'b1-ramp',
      title: 'Basement 1 Vehicle Ramp (Inbound)',
      type: 'PARKING_ACCESS',
      status: 'OPERATIONAL',
      officer: 'Automated ANPR Sensor B1',
      details: 'Camera sensor plate recognition, live occupancy link to B1-EAST.',
      coords: { top: '65%', left: '32%' },
      stats: '84 cars parked'
    },
    {
      id: 'b2-ramp',
      title: 'Basement 2 Motorcycle Bay Ramp',
      type: 'PARKING_ACCESS',
      status: 'NEAR_CAPACITY',
      officer: 'Sensor Bay B2',
      details: 'High occupancy detected. Redirecting overflow to open ground.',
      coords: { top: '68%', left: '62%' },
      stats: '246 bikes parked'
    },
    {
      id: 'sec-hq',
      title: 'Campus Security Control Center',
      type: 'HQ',
      status: 'ACTIVE_MONITORING',
      officer: 'Chief Security Officer',
      details: 'Central CCTV monitoring wall (48 cameras), PA Emergency Broadcast console.',
      coords: { top: '48%', left: '50%' },
      stats: '48 CCTV feeds active'
    },
    {
      id: 'assembly-zone',
      title: 'Emergency Evacuation Assembly Ground',
      type: 'EMERGENCY',
      status: 'CLEAR',
      officer: 'Evacuation Marshal',
      details: 'Designated outdoor safe zone on UIU Central Sports Field.',
      coords: { top: '35%', left: '20%' },
      stats: 'Capacity: 3,000+'
    }
  ];

  return (
    <div className="sec-subpage-container">
      <SectionHeader
        title="Interactive Security Map & Perimeter Checkpoints"
        subtitle="Real-time status overview of campus access gates, parking ramps, CCTV hubs, and emergency assembly zones."
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
