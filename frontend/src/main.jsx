import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { registerSmartCampusPwa } from './utils/pwa';
import './styles/base.css';

createRoot(document.getElementById('root')).render(<App />);
registerSmartCampusPwa();
