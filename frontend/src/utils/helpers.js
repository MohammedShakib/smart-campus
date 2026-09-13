export const projectName = 'Smart Campus';

export const demoAccounts = {
  admin: ['admin-demo', 'demo-admin-pass'],
  teacher: ['teacher-demo', 'demo-teacher-pass'],
  student: ['student-demo', 'demo-student-pass'],
  security: ['security-demo', 'demo-security-pass']
};

export function initials(name = 'SC') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function prettyRole(role = '') {
  return role.replace('ROLE_', '').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export function roleSummary(role) {
  const copy = {
    admin: 'Monitor accounts, telemetry, queues, logs, and service operations from one control room.',
    teacher: 'See live classroom allocation, notices, and active campus resources for teaching flow.',
    student: 'Check transport status, campus notices, and submit support tickets from your dashboard.',
    security: 'Validate gate access and observe bus telemetry for campus safety operations.'
  };
  return copy[role] || copy.student;
}

export function sampleClassrooms() {
  return [
    { roomNumber: 'Room 524 (CSE Lab 4)', capacity: 60, floor: 5, occupied: true,  powerKW: 3.8 },
    { roomNumber: 'Room 522 (Theory)',     capacity: 55, floor: 5, occupied: false, powerKW: 0.4 },
    { roomNumber: 'Room 412 (Multimedia)',capacity: 70, floor: 4, occupied: true,  powerKW: 4.2 },
    { roomNumber: 'Room 301 (Auditorium)',capacity: 250,floor: 3, occupied: true,  powerKW: 18.5 },
    { roomNumber: 'Room 608 (Seminar)',    capacity: 45, floor: 6, occupied: false, powerKW: 0.2 },
    { roomNumber: 'Room 210 (Theory B)',  capacity: 60, floor: 2, occupied: false, powerKW: 0.3 },
  ];
}
