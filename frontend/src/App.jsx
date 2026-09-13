import React from 'react';
import { AttendanceCheckInPage } from './pages/AttendanceCheckInPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  const path = window.location.pathname;
  if (path.startsWith('/attendance/checkin')) return <AttendanceCheckInPage />;
  if (path.startsWith('/dashboard')) return <DashboardPage />;
  return <AuthPage />;
}
