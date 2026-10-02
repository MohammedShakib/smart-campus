import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, QrCode, X } from 'lucide-react';

function tokenFromScan(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  try {
    const url = new URL(text, window.location.origin);
    const token = url.searchParams.get('token');
    if (token) return token;
  } catch {
    // Raw token scans are also accepted.
  }

  return text;
}

export function StudentQrScannerShortcut() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    let detector = null;

    async function startCamera() {
      setCameraReady(false);
      setMessage('');

      if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
        setMessage('Camera is not available in this browser. Paste the attendance QR token below.');
        return;
      }

      if ('BarcodeDetector' in window) {
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } else {
        setMessage('Live QR detection is not supported here. Paste the token below, or use Chrome/Edge on Android.');
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);

        const scan = async () => {
          if (!active || !videoRef.current || !detector) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const rawValue = codes?.[0]?.rawValue;
            const token = tokenFromScan(rawValue);
            if (token) {
              window.location.href = `/attendance/checkin?token=${encodeURIComponent(token)}`;
              return;
            }
          } catch {
            // Keep the scanner alive if one frame fails.
          }
          frameRef.current = window.requestAnimationFrame(scan);
        };

        if (detector) frameRef.current = window.requestAnimationFrame(scan);
      } catch {
        setMessage('Camera permission was blocked. Allow camera access or paste the attendance token below.');
      }
    }

    startCamera();

    return () => {
      active = false;
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraReady(false);
    };
  }, [open]);

  function submitManual(event) {
    event.preventDefault();
    const token = tokenFromScan(manualToken);
    if (!token) return;
    window.location.href = `/attendance/checkin?token=${encodeURIComponent(token)}`;
  }

  return (
    <>
      <button
        type="button"
        className="student-qr-fab"
        onClick={() => setOpen(true)}
        aria-label="Scan attendance QR"
      >
        <QrCode size={24} />
      </button>

      {open && (
        <div className="qr-scanner-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="qr-scanner-modal" role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="qr-scanner-head">
              <div>
                <span>Attendance QR</span>
                <h2 id="qr-scanner-title">Scan to check in</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close scanner">
                <X size={16} />
              </button>
            </header>

            <div className="qr-camera-frame">
              <video ref={videoRef} muted playsInline aria-label="Camera preview for attendance QR scanning" />
              <div className="qr-reticle" aria-hidden="true" />
              {!cameraReady && (
                <div className="qr-camera-loading">
                  <Loader2 size={24} className="spin" />
                  <span>Opening camera</span>
                </div>
              )}
            </div>

            {message && <p className="qr-scanner-message">{message}</p>}

            <form className="qr-manual-form" onSubmit={submitManual}>
              <input
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Paste QR link or token"
                autoComplete="off"
              />
              <button className="primary-btn" type="submit" disabled={!manualToken.trim()}>
                <Camera size={16} /> Check in
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
