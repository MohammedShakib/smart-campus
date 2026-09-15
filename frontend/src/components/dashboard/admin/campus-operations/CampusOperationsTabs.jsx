import React, { useState } from 'react';
import TransportManagement from './TransportManagement';
import ParkingManagement from './ParkingManagement';
import VisitorManagement from './VisitorManagement';
import EventManagement from './EventManagement';
import CafeteriaManagement from './CafeteriaManagement';
import LostFoundAdmin from './LostFoundAdmin';

const CampusOperationsTabs = () => {
    const [activeTab, setActiveTab] = useState('transport');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'transport': return <TransportManagement />;
            case 'parking': return <ParkingManagement />;
            case 'visitors': return <VisitorManagement />;
            case 'events': return <EventManagement />;
            case 'cafeteria': return <CafeteriaManagement />;
            case 'lostfound': return <LostFoundAdmin />;
            default: return <TransportManagement />;
        }
    };

    return (
        <div className="campus-operations-section fade-in">
            <div className="section-header">
                <h2>Campus Operations</h2>
                <p>Manage transportation, parking, visitors, events, cafeteria services and lost & found.</p>
            </div>
            <div className="custom-tabs">
                <button className={`tab-button ${activeTab === 'transport' ? 'active' : ''}`} onClick={() => setActiveTab('transport')}>Transport</button>
                <button className={`tab-button ${activeTab === 'parking' ? 'active' : ''}`} onClick={() => setActiveTab('parking')}>Parking</button>
                <button className={`tab-button ${activeTab === 'visitors' ? 'active' : ''}`} onClick={() => setActiveTab('visitors')}>Visitors</button>
                <button className={`tab-button ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events</button>
                <button className={`tab-button ${activeTab === 'cafeteria' ? 'active' : ''}`} onClick={() => setActiveTab('cafeteria')}>Cafeteria</button>
                <button className={`tab-button ${activeTab === 'lostfound' ? 'active' : ''}`} onClick={() => setActiveTab('lostfound')}>Lost & Found</button>
            </div>
            <div className="tab-content-container">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default CampusOperationsTabs;
