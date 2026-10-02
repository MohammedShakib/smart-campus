import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import { AlertTriangle, X } from 'lucide-react';

function formatBroadcastTime(value) {
    if (!value) return '';
    try {
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

export function ActiveEmergencyBanner() {
    const [emergencies, setEmergencies] = useState([]);
    const [dismissedIds, setDismissedIds] = useState([]);

    const loadEmergencies = useCallback(() => {
        api('/api/emergencies/active')
            .then(res => {
                setEmergencies(res.data || []);
            })
            .catch(err => console.error("Failed to load emergencies", err));
    }, []);

    useEffect(() => {
        loadEmergencies();
        const interval = setInterval(loadEmergencies, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [loadEmergencies]);

    const activeToDisplay = emergencies.filter(e => !dismissedIds.includes(e.id));

    if (activeToDisplay.length === 0) return null;

    return (
        <div className="emergency-toast-stack" role="region" aria-label="Active emergency notifications">
            {activeToDisplay.map(emergency => (
                <div
                    key={emergency.id}
                    className={`emergency-toast emergency-toast--${(emergency.severity || 'critical').toLowerCase()}`}
                    role="status"
                >
                    <div className="emergency-toast-icon" aria-hidden="true">
                        <AlertTriangle size={18} />
                    </div>
                    <div className="emergency-toast-body">
                        <div className="emergency-toast-kicker">
                            {emergency.category || 'Emergency'} broadcast
                        </div>
                        <h3>{emergency.alertTitle}</h3>
                        <p>{emergency.alertMessage}</p>
                        <div className="emergency-toast-meta">
                            <span>{emergency.severity || 'CRITICAL'}</span>
                            <span>By {emergency.broadcastBy || 'Security Command'}</span>
                            {formatBroadcastTime(emergency.broadcastTime) && (
                                <span>{formatBroadcastTime(emergency.broadcastTime)}</span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDismissedIds([...dismissedIds, emergency.id])}
                        className="emergency-toast-close"
                        aria-label={`Dismiss ${emergency.alertTitle}`}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}
