import React, { useState } from 'react';
import {
  QrCode, Search, CheckCircle2, XCircle, ArrowRight, ShieldCheck,
  User, Phone, MapPin, Calendar, Clock, Car, RefreshCw, AlertTriangle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

export function SecurityQrScannerSection() {
  const [passInput, setPassInput] = useState('');
  const [scannedVisitor, setScannedVisitor] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'idle' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [recentScans, setRecentScans] = useState([]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!passInput.trim()) return;

    setBusy(true);
    setScanStatus(null);
    setErrorMessage(null);
    setScannedVisitor(null);

    try {
      const res = await api(`/api/security/visitors/verify?passCode=${encodeURIComponent(passInput.trim())}`);
      setScannedVisitor(res.data);
      setScanStatus('success');

      // Add to recent scans
      setRecentScans((prev) => [
        { passCode: res.data.passCode, name: res.data.visitorName, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: res.data.status },
        ...prev.slice(0, 7)
      ]);
    } catch (err) {
      setScanStatus('error');
      setErrorMessage(err.message || 'Pass code not found or invalid barcode.');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scannedVisitor) return;
    setBusy(true);
    try {
      const res = await api(`/api/security/visitors/checkin?passCodeOrId=${encodeURIComponent(scannedVisitor.passCode)}`, { method: 'POST' });
      setScannedVisitor(res.data);
      alert(res.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    if (!scannedVisitor) return;
    setBusy(true);
    try {
      const res = await api(`/api/security/visitors/checkout?passCodeOrId=${encodeURIComponent(scannedVisitor.passCode)}`, { method: 'POST' });
      setScannedVisitor(res.data);
      alert(res.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sec-subpage-container">
      <SectionHeader
        title="Visitor QR Barcode Scanner & Pass Verification"
        subtitle="Point camera / optical scanner at guest's QR pass or manually enter visitor pass token."
      />

      <div className="sec-scanner-layout">
        {/* Left Column: Scanner Terminal */}
        <div className="sec-scanner-left">
          <Panel title="QR Code & Pass Scanner Terminal" tag="Optical Gate Link">
            <div className="sec-scanner-box">
              <div className="sec-scanner-viewport">
                <div className="sec-scanner-laser" />
                <QrCode size={80} className="sec-scanner-icon" />
                <span>Align QR Barcode within target frame</span>
              </div>

              <form className="sec-scanner-form" onSubmit={handleVerify}>
                <div className="sec-scanner-input-wrap">
                  <QrCode size={18} />
                  <input
                    type="text"
                    placeholder="Enter Pass Code (e.g. VIS-UIU-78219)"
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="primary-btn" disabled={busy}>
                    <Search size={16} /> Verify
                  </button>
                </div>
              </form>

              {/* Sample Quick Preset Chips */}
              <div className="sec-scanner-presets">
                <span className="muted">Quick Test Passes:</span>
                <button type="button" className="sec-chip" onClick={() => { setPassInput('VIS-UIU-78219'); }}>
                  VIS-UIU-78219 (Approved)
                </button>
                <button type="button" className="sec-chip" onClick={() => { setPassInput('VIS-UIU-90214'); }}>
                  VIS-UIU-90214 (Pending)
                </button>
                <button type="button" className="sec-chip" onClick={() => { setPassInput('VIS-UIU-33018'); }}>
                  VIS-UIU-33018 (Active)
                </button>
              </div>
            </div>
          </Panel>

          {/* Recent Scans */}
          <Panel title="Recent Pass Scan Activity" tag="Shift Log">
            <div className="sec-table-container">
              <table className="sec-table">
                <thead>
                  <tr>
                    <th>Pass Code</th>
                    <th>Visitor Name</th>
                    <th>Scan Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((s, idx) => (
                    <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => { setPassInput(s.passCode); }}>
                      <td><span className="sec-code-badge">{s.passCode}</span></td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.time}</td>
                      <td>
                        <span className={`sec-status-badge sec-status-badge--${(s.status || '').toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Right Column: Verified Pass Card */}
        <div className="sec-scanner-right">
          <Panel title="Verification Result" tag="Live Pass State">
            {scanStatus === 'error' && (
              <div className="sec-scan-result sec-scan-result--error">
                <XCircle size={40} />
                <h3>Invalid or Unregistered Pass</h3>
                <p>{errorMessage}</p>
              </div>
            )}

            {scanStatus === 'success' && scannedVisitor && (
              <div className="sec-verified-card">
                <div className={`sec-verified-header sec-verified-header--${(scannedVisitor.status || '').toLowerCase()}`}>
                  <div className="sec-verified-status-icon">
                    {scannedVisitor.status === 'APPROVED' ? <CheckCircle2 size={30} /> :
                     scannedVisitor.status === 'CHECKED_IN' ? <Clock size={30} /> :
                     scannedVisitor.status === 'CHECKED_OUT' ? <ShieldCheck size={30} /> :
                     <AlertTriangle size={30} />}
                  </div>
                  <div>
                    <span className="sec-verified-badge">{scannedVisitor.status}</span>
                    <h2>{scannedVisitor.visitorName}</h2>
                    <span className="sec-verified-code">{scannedVisitor.passCode}</span>
                  </div>
                </div>

                <div className="sec-verified-grid">
                  <div className="sec-verified-item">
                    <span>Phone:</span>
                    <strong>{scannedVisitor.phone}</strong>
                  </div>
                  <div className="sec-verified-item">
                    <span>Host / Faculty:</span>
                    <strong>{scannedVisitor.hostName} ({scannedVisitor.hostDepartment})</strong>
                  </div>
                  <div className="sec-verified-item">
                    <span>Visit Date:</span>
                    <strong>{scannedVisitor.visitDate}</strong>
                  </div>
                  <div className="sec-verified-item">
                    <span>Expected Entry:</span>
                    <strong>{scannedVisitor.expectedEntryTime || '10:00'}</strong>
                  </div>
                  <div className="sec-verified-item">
                    <span>Vehicle:</span>
                    <strong>{scannedVisitor.vehicleNumber || 'Pedestrian'}</strong>
                  </div>
                  <div className="sec-verified-item">
                    <span>National ID / Passport:</span>
                    <strong>{scannedVisitor.nationalId || '-'}</strong>
                  </div>
                  <div className="sec-verified-item sec-verified-item--full">
                    <span>Purpose:</span>
                    <p>{scannedVisitor.purpose}</p>
                  </div>
                </div>

                <div className="sec-verified-actions">
                  {scannedVisitor.status === 'APPROVED' && (
                    <button
                      type="button"
                      className="primary-btn sec-btn-large"
                      style={{ background: '#10b981' }}
                      onClick={handleCheckIn}
                      disabled={busy}
                    >
                      <CheckCircle2 size={18} /> Confirm Gate Entry (Check-In)
                    </button>
                  )}

                  {scannedVisitor.status === 'CHECKED_IN' && (
                    <button
                      type="button"
                      className="primary-btn sec-btn-large"
                      style={{ background: '#f59e0b' }}
                      onClick={handleCheckOut}
                      disabled={busy}
                    >
                      <ArrowRight size={18} /> Confirm Gate Exit (Check-Out)
                    </button>
                  )}

                  {scannedVisitor.status === 'PENDING' && (
                    <div className="sec-notice sec-notice--warning">
                      This visitor pass is still <strong>PENDING approval</strong>. Please approve request before allowing gate access.
                    </div>
                  )}

                  {scannedVisitor.status === 'CHECKED_OUT' && (
                    <div className="sec-notice sec-notice--info">
                      This visitor has already <strong>Checked Out</strong>. Pass is officially closed.
                    </div>
                  )}
                </div>
              </div>
            )}

            {!scanStatus && (
              <div className="sec-scan-placeholder">
                <QrCode size={48} className="muted" />
                <h3>No Pass Scanned</h3>
                <p>Scan a QR pass or type pass code to inspect validity and grant gate access.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
