import React, { useState } from 'react';
import { Bus, Car, UsersRound, CalendarDays, Utensils, Search } from 'lucide-react';
import TransportManagement from './TransportManagement';
import ParkingManagement from './ParkingManagement';
import VisitorManagement from './VisitorManagement';
import EventManagement from './EventManagement';
import CafeteriaManagement from './CafeteriaManagement';
import LostFoundAdmin from './LostFoundAdmin';

const TABS = [
  { id: 'transport', label: 'Transport Fleet', icon: Bus },
  { id: 'parking', label: 'Parking Slots', icon: Car },
  { id: 'visitors', label: 'Visitor Passes', icon: UsersRound },
  { id: 'events', label: 'Campus Events', icon: CalendarDays },
  { id: 'cafeteria', label: 'Cafeteria & Meals', icon: Utensils },
  { id: 'lostfound', label: 'Lost & Found', icon: Search }
];

export default function CampusOperationsTabs() {
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
    <div className="campus-operations-page fade-in">
      <div className="academic-tabs" role="tablist" aria-label="Campus Operations Navigation">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`academic-tab${activeTab === id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(id)}
            role="tab"
            aria-selected={activeTab === id}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content-wrapper" style={{ marginTop: '1rem' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
