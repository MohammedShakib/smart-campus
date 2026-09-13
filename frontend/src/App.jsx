import React from 'react';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  const path = window.location.pathname;
  if (path.startsWith('/dashboard')) return <DashboardPage />;
  return <AuthPage />;
}
