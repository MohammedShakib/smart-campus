import React, { useEffect, useState, useMemo } from 'react';
import { GraduationCap, Search } from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel, Table } from '../../shared/SharedComponents';

function Feedback({ result }) {
  if (!result) return null;
  return <div className={`notice ${result.type}`}>{result.text}</div>;
}

function formatPct(value) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)}%`;
}

export function TeacherStudentsSection() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [roster, setRoster] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [error, setError] = useState(null);

  // Load class list on mount
  useEffect(() => {
    setLoadingClasses(true);
    api('/api/teacher/roster/classes')
      .then((res) => {
        const list = res.data || [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedClass(list[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingClasses(false));
  }, []);

  // Load roster when selectedClass changes
  useEffect(() => {
    if (!selectedClass) {
      setRoster([]);
      return;
    }
    setLoadingRoster(true);
    setError(null);
    const params = new URLSearchParams({
      courseCode: selectedClass.courseCode,
      section: selectedClass.sectionName,
    });
    api(`/api/teacher/roster?${params}`)
      .then((res) => setRoster(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingRoster(false));
  }, [selectedClass]);

  // Frontend search filter — no extra API calls
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (s) =>
        s.studentId.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
  }, [roster, search]);

  const rows = filtered.map((s) => [
    s.studentId,
    s.name,
    s.present,
    s.late,
    s.absent,
    formatPct(s.attendancePercentage),
    'Active',
  ]);

  const subtitle = selectedClass
    ? `${selectedClass.courseCode} — ${selectedClass.sectionName} · ${roster.length} student${roster.length !== 1 ? 's' : ''} enrolled`
    : 'View students enrolled in your assigned course sections and their attendance.';

  return (
    <div>
      <SectionHeader
        title="Students"
        subtitle="View students enrolled in your assigned course sections and their attendance."
      />

      {/* Course / Section selector */}
      <div className="section-grid" style={{ marginBottom: '1rem' }}>
        <Panel title="Select Class" tag={`${classes.length} class${classes.length !== 1 ? 'es' : ''}`}>
          {loadingClasses ? (
            <p className="muted">Loading classes…</p>
          ) : classes.length === 0 ? (
            <p className="muted">No classes with enrolled students found.</p>
          ) : (
            <div className="teacher-room-list">
              {classes.map((cls) => {
                const key = `${cls.courseCode}|${cls.sectionName}`;
                const selKey = selectedClass
                  ? `${selectedClass.courseCode}|${selectedClass.sectionName}`
                  : '';
                return (
                  <button
                    key={key}
                    type="button"
                    className={`teacher-room-option${key === selKey ? ' is-selected' : ''}`}
                    onClick={() => { setSelectedClass(cls); setSearch(''); }}
                  >
                    <strong>{cls.courseCode} — {cls.sectionName}</strong>
                    <span>{cls.courseTitle}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Search input */}
        {selectedClass && (
          <Panel title="Search Students" tag="Filter">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
              <Search size={16} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />
              <input
                style={{ flex: 1 }}
                placeholder="Search by name or student ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selectedClass && (
              <div className="stat-list" style={{ marginTop: '1rem' }}>
                <div className="stat-row-item stat-row-item--emerald">
                  <span>Course</span>
                  <strong>{selectedClass.courseCode}</strong>
                </div>
                <div className="stat-row-item stat-row-item--sky">
                  <span>Section</span>
                  <strong>{selectedClass.sectionName}</strong>
                </div>
                <div className="stat-row-item stat-row-item--accent">
                  <span>Enrolled</span>
                  <strong>{roster.length}</strong>
                </div>
              </div>
            )}
          </Panel>
        )}
      </div>

      {/* Roster table */}
      <Panel
        title={selectedClass ? `${selectedClass.courseCode} — ${selectedClass.sectionName}` : 'Class Roster'}
        tag={selectedClass ? `${filtered.length} student${filtered.length !== 1 ? 's' : ''}` : 'Select a class'}
      >
        {!selectedClass ? (
          <p className="muted">
            <GraduationCap size={15} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Select a course section above to view the class roster.
          </p>
        ) : loadingRoster ? (
          <p className="muted">Loading roster…</p>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : (
          <Table
            headers={['Student ID', 'Name', 'Present', 'Late', 'Absent', 'Attendance', 'Status']}
            rows={rows}
            empty="No students enrolled in this class."
          />
        )}
      </Panel>
    </div>
  );
}
