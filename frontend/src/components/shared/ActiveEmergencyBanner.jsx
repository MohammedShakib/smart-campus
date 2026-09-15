import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api';
import { AlertTriangle, X } from 'lucide-react';

export function ActiveEmergencyBanner() {
    const [emergencies, setEmergencies] = useState([]);
    const [dismissedIds, setDismissedIds] = useState([]);

    const loadEmergencies = useCallback(() => {
        api('/api/security/emergencies/active')
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
        <div className="fixed top-0 left-0 w-full z-50 flex flex-col gap-1 p-2 pointer-events-none">
            {activeToDisplay.map(emergency => (
                <div key={emergency.id} className="pointer-events-auto bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-start gap-4 animate-pulse">
                    <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-bold text-lg uppercase tracking-wider">{emergency.alertTitle}</h3>
                        <p className="text-sm mt-1">{emergency.alertMessage}</p>
                        <p className="text-xs mt-2 opacity-80">
                            Broadcast by {emergency.broadcastBy} at {new Date(emergency.broadcastTime).toLocaleTimeString()}
                        </p>
                    </div>
                    <button 
                        onClick={() => setDismissedIds([...dismissedIds, emergency.id])}
                        className="text-white hover:text-red-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
