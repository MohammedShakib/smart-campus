import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  DoorOpen,
  Filter,
  GraduationCap,
  Pencil,
  Power,
  Save,
  Search,
  X
} from 'lucide-react';
import { api } from '../../../utils/api';
import { readUrlOption, writeUrlOption } from '../../../utils/urlState';
import { EmptyState, ErrorState, SectionHeader } from '../../shared/SharedComponents';

const TABS = [
  { id: 'DEPARTMENTS', label: 'Departments', icon: GraduationCap },
  { id: 'COURSES', label: 'Courses', icon: BookOpen },
  { id: 'BUILDINGS', label: 'Buildings', icon: Building2 },
  { id: 'ROOMS', label: 'Rooms', icon: DoorOpen }
];

const EMPTY_FORMS = {
  DEPARTMENTS: { code: '', name: '', active: true },
  COURSES: { courseCode: '', courseName: '', departmentId: '', creditHours: 3, active: true },
  BUILDINGS: { code: '', name: '', numberOfFloors: 1, description: '', active: true },
  ROOMS: {
    roomNumber: '',
    roomType: 'Theory',
    buildingId: '',
    building: '',
    floor: 1,
    capacity: 40,
    powerKW: 0,
    occupied: false,
    active: true
  }
};

const roomTypes = ['Theory', 'CSE Lab', 'Multimedia', 'Auditorium', 'Seminar', 'Lab'];

export default function AcademicSetupSection() {
  const [activeTab, setActiveTab] = useState(() => readUrlOption('academicSetupTab', TABS.map(({ id }) => id), 'DEPARTMENTS'));
  const [data, setData] = useState({ departments: [], courses: [], buildings: [], rooms: [] });
  const [forms, setForms] = useState(EMPTY_FORMS);
  const [editing, setEditing] = useState({});
  const [filters, setFilters] = useState({ search: '', status: 'ALL', department: 'ALL', building: 'ALL', roomType: 'ALL', occupied: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [departments, courses, buildings, rooms] = await Promise.all([
        api('/api/admin/departments'),
        api('/api/admin/courses'),
        api('/api/admin/buildings'),
        api('/api/admin/classrooms')
      ]);
      setData({ departments, courses, buildings, rooms });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    writeUrlOption('academicSetupTab', activeTab, 'DEPARTMENTS');
  }, [activeTab]);

  const activeList = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const statusMatch = (item) => filters.status === 'ALL' || String(item.active) === filters.status;
    const textMatch = (...values) => !query || values.filter(Boolean).join(' ').toLowerCase().includes(query);

    if (activeTab === 'DEPARTMENTS') {
      return data.departments.filter((item) => statusMatch(item) && textMatch(item.code, item.name));
    }
    if (activeTab === 'COURSES') {
      return data.courses.filter((item) =>
        statusMatch(item) &&
        (filters.department === 'ALL' || String(item.departmentId || '') === filters.department) &&
        textMatch(item.courseCode, item.courseName, item.departmentName)
      );
    }
    if (activeTab === 'BUILDINGS') {
      return data.buildings.filter((item) => statusMatch(item) && textMatch(item.code, item.name, item.description));
    }
    return data.rooms.filter((item) =>
      statusMatch(item) &&
      (filters.building === 'ALL' || String(item.buildingId || '') === filters.building) &&
      (filters.roomType === 'ALL' || item.roomType === filters.roomType) &&
      (filters.occupied === 'ALL' || String(item.occupied) === filters.occupied) &&
      textMatch(item.roomNumber, item.roomType, item.buildingName, item.building)
    );
  }, [activeTab, data, filters]);

  const counts = {
    departments: data.departments.length,
    courses: data.courses.length,
    buildings: data.buildings.length,
    rooms: data.rooms.length,
    activeRooms: data.rooms.filter((room) => room.active).length
  };

  const updateForm = (tab, patch) => {
    setForms((current) => ({ ...current, [tab]: { ...current[tab], ...patch } }));
  };

  const resetForm = (tab = activeTab) => {
    setEditing((current) => ({ ...current, [tab]: null }));
    updateForm(tab, EMPTY_FORMS[tab]);
  };

  const editItem = (tab, item) => {
    setEditing((current) => ({ ...current, [tab]: item.id }));
    if (tab === 'DEPARTMENTS') updateForm(tab, { code: item.code, name: item.name, active: item.active });
    if (tab === 'COURSES') updateForm(tab, {
      courseCode: item.courseCode,
      courseName: item.courseName,
      departmentId: item.departmentId || '',
      creditHours: item.creditHours,
      active: item.active
    });
    if (tab === 'BUILDINGS') updateForm(tab, {
      code: item.code,
      name: item.name,
      numberOfFloors: item.numberOfFloors,
      description: item.description || '',
      active: item.active
    });
    if (tab === 'ROOMS') updateForm(tab, {
      roomNumber: item.roomNumber,
      roomType: item.roomType || 'Theory',
      buildingId: item.buildingId || '',
      building: item.building || item.buildingName || '',
      floor: item.floor,
      capacity: item.capacity,
      powerKW: item.powerKW,
      occupied: item.occupied,
      active: item.active
    });
  };

  const saveCurrent = async (event) => {
    event.preventDefault();
    setBusy(`save-${activeTab}`);
    setNotice('');
    try {
      const payload = buildPayload(activeTab, forms[activeTab], data.buildings);
      const endpoint = endpointFor(activeTab);
      const id = editing[activeTab];
      await api(id ? `${endpoint}/${id}` : endpoint, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      resetForm(activeTab);
      setNotice(`${tabLabel(activeTab)} saved.`);
      await loadData();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy('');
    }
  };

  const toggleStatus = async (tab, item) => {
    setBusy(`status-${tab}-${item.id}`);
    setNotice('');
    try {
      await api(`${endpointFor(tab)}/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !item.active })
      });
      setNotice(`${tabLabel(tab)} ${item.active ? 'disabled' : 'enabled'}.`);
      await loadData();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="admin-management-page academic-setup">
      <SectionHeader title="Academic & Campus Setup" subtitle="Manage canonical departments, courses, buildings, and classrooms." />

      <div className="academic-summary-grid">
        <Summary label="Departments" value={counts.departments} />
        <Summary label="Courses" value={counts.courses} />
        <Summary label="Buildings" value={counts.buildings} />
        <Summary label="Active Rooms" value={`${counts.activeRooms}/${counts.rooms}`} />
      </div>

      <div className="academic-tabs" role="tablist" aria-label="Academic setup areas">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={`academic-tab${activeTab === id ? ' is-active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {loading && <div className="admin-empty-state">Loading academic setup...</div>}
      {!loading && error && <ErrorState error={error} onRetry={loadData} />}
      {!loading && !error && (
        <div className="academic-layout">
          <form className="academic-form" onSubmit={saveCurrent}>
            <div className="academic-form-title">
              <strong>{editing[activeTab] ? `Edit ${tabLabel(activeTab)}` : `Add ${tabLabel(activeTab)}`}</strong>
              {editing[activeTab] && (
                <button type="button" className="icon-btn" title="Cancel edit" onClick={() => resetForm()}>
                  <X size={16} />
                </button>
              )}
            </div>
            <FormFields
              tab={activeTab}
              form={forms[activeTab]}
              departments={data.departments}
              buildings={data.buildings}
              editing={Boolean(editing[activeTab])}
              update={(patch) => updateForm(activeTab, patch)}
            />
            {notice && <p className="academic-notice">{notice}</p>}
            <button className="primary-btn" type="submit" disabled={busy === `save-${activeTab}`}>
              <Save size={16} /> Save
            </button>
          </form>

          <div className="academic-table-panel">
            <Toolbar
              activeTab={activeTab}
              filters={filters}
              setFilters={setFilters}
              departments={data.departments}
              buildings={data.buildings}
            />
            <AcademicTable
              tab={activeTab}
              rows={activeList}
              busy={busy}
              editItem={editItem}
              toggleStatus={toggleStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div className="academic-summary">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Toolbar({ activeTab, filters, setFilters, departments, buildings }) {
  const setFilter = (patch) => setFilters((current) => ({ ...current, ...patch }));
  return (
    <div className="admin-toolbar academic-toolbar">
      <div className="admin-toolbar-left">
        <div className="admin-search">
          <Search size={16} />
          <input value={filters.search} onChange={(event) => setFilter({ search: event.target.value })} placeholder="Search" />
        </div>
        <div className="admin-filter-group">
          <Filter size={15} />
          <select value={filters.status} onChange={(event) => setFilter({ status: event.target.value })}>
            <option value="ALL">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        {activeTab === 'COURSES' && (
          <div className="admin-filter-group">
            <select value={filters.department} onChange={(event) => setFilter({ department: event.target.value })}>
              <option value="ALL">All departments</option>
              {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.code}</option>)}
            </select>
          </div>
        )}
        {activeTab === 'ROOMS' && (
          <>
            <div className="admin-filter-group">
              <select value={filters.building} onChange={(event) => setFilter({ building: event.target.value })}>
                <option value="ALL">All buildings</option>
                {buildings.map((building) => <option key={building.id} value={building.id}>{building.code}</option>)}
              </select>
            </div>
            <div className="admin-filter-group">
              <select value={filters.roomType} onChange={(event) => setFilter({ roomType: event.target.value })}>
                <option value="ALL">All types</option>
                {roomTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="admin-filter-group">
              <select value={filters.occupied} onChange={(event) => setFilter({ occupied: event.target.value })}>
                <option value="ALL">All occupancy</option>
                <option value="true">Occupied</option>
                <option value="false">Vacant</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormFields({ tab, form, departments, buildings, editing, update }) {
  if (tab === 'DEPARTMENTS') {
    return (
      <div className="admin-form-grid">
        <Field label="Code"><input value={form.code} disabled={editing} onChange={(e) => update({ code: e.target.value })} required maxLength={30} /></Field>
        <Field label="Name"><input value={form.name} onChange={(e) => update({ name: e.target.value })} required maxLength={150} /></Field>
        <Toggle label="Active" checked={form.active} onChange={(active) => update({ active })} />
      </div>
    );
  }
  if (tab === 'COURSES') {
    return (
      <div className="admin-form-grid">
        <Field label="Code"><input value={form.courseCode} disabled={editing} onChange={(e) => update({ courseCode: e.target.value })} required maxLength={30} /></Field>
        <Field label="Name"><input value={form.courseName} onChange={(e) => update({ courseName: e.target.value })} required maxLength={150} /></Field>
        <Field label="Department">
          <select value={form.departmentId} onChange={(e) => update({ departmentId: e.target.value })}>
            <option value="">Unassigned</option>
            {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.code} - {dept.name}</option>)}
          </select>
        </Field>
        <Field label="Credits"><input type="number" min="1" max="6" value={form.creditHours} onChange={(e) => update({ creditHours: e.target.value })} required /></Field>
        <Toggle label="Active" checked={form.active} onChange={(active) => update({ active })} />
      </div>
    );
  }
  if (tab === 'BUILDINGS') {
    return (
      <div className="admin-form-grid">
        <Field label="Code"><input value={form.code} disabled={editing} onChange={(e) => update({ code: e.target.value })} required maxLength={30} /></Field>
        <Field label="Name"><input value={form.name} onChange={(e) => update({ name: e.target.value })} required maxLength={150} /></Field>
        <Field label="Floors"><input type="number" min="1" max="100" value={form.numberOfFloors} onChange={(e) => update({ numberOfFloors: e.target.value })} required /></Field>
        <Field label="Description"><input value={form.description} onChange={(e) => update({ description: e.target.value })} maxLength={500} /></Field>
        <Toggle label="Active" checked={form.active} onChange={(active) => update({ active })} />
      </div>
    );
  }
  return (
    <div className="admin-form-grid">
      <Field label="Room"><input value={form.roomNumber} onChange={(e) => update({ roomNumber: e.target.value })} required maxLength={80} /></Field>
      <Field label="Type">
        <select value={form.roomType} onChange={(e) => update({ roomType: e.target.value })}>
          {roomTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </Field>
      <Field label="Building">
        <select value={form.buildingId} onChange={(e) => update({ buildingId: e.target.value })}>
          <option value="">Unassigned</option>
          {buildings.map((building) => <option key={building.id} value={building.id}>{building.code} - {building.name}</option>)}
        </select>
      </Field>
      <Field label="Floor"><input type="number" min="0" max="100" value={form.floor} onChange={(e) => update({ floor: e.target.value })} required /></Field>
      <Field label="Capacity"><input type="number" min="1" max="1000" value={form.capacity} onChange={(e) => update({ capacity: e.target.value })} required /></Field>
      <Field label="Power kW"><input type="number" min="0" max="250" step="0.1" value={form.powerKW} onChange={(e) => update({ powerKW: e.target.value })} required /></Field>
      <Toggle label="Occupied" checked={form.occupied} onChange={(occupied) => update({ occupied })} />
      <Toggle label="Active" checked={form.active} onChange={(active) => update({ active })} />
    </div>
  );
}

function Field({ label, children }) {
  return <label className="admin-form-group"><span>{label}</span>{children}</label>;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="admin-form-group academic-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function AcademicTable({ tab, rows, busy, editItem, toggleStatus }) {
  if (!rows.length) {
    return <EmptyState title="No records found" message="Try changing your search or filters." icon={Search} />;
  }

  const headers = tableHeaders(tab);
  return (
    <div className="admin-table-wrap">
      <table className="admin-table academic-table">
        <thead>
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {renderCells(tab, row)}
              <td>
                <div className="academic-row-actions">
                  <button type="button" className="icon-btn" title="Edit" onClick={() => editItem(tab, row)}>
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="icon-btn" title={row.active ? 'Disable' : 'Enable'} disabled={busy === `status-${tab}-${row.id}`} onClick={() => toggleStatus(tab, row)}>
                    <Power size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function tableHeaders(tab) {
  if (tab === 'DEPARTMENTS') return ['Code', 'Name', 'Status'];
  if (tab === 'COURSES') return ['Code', 'Name', 'Department', 'Credits', 'Status'];
  if (tab === 'BUILDINGS') return ['Code', 'Name', 'Floors', 'Description', 'Status'];
  return ['Room', 'Type', 'Building', 'Floor', 'Capacity', 'Occupancy', 'Status'];
}

function renderCells(tab, row) {
  if (tab === 'DEPARTMENTS') {
    return [<td key="code"><strong>{row.code}</strong></td>, <td key="name">{row.name}</td>, <Status key="status" active={row.active} />];
  }
  if (tab === 'COURSES') {
    return [
      <td key="code"><strong>{row.courseCode}</strong></td>,
      <td key="name">{row.courseName}</td>,
      <td key="dept">{row.departmentName || 'Unassigned'}</td>,
      <td key="credits">{row.creditHours}</td>,
      <Status key="status" active={row.active} />
    ];
  }
  if (tab === 'BUILDINGS') {
    return [
      <td key="code"><strong>{row.code}</strong></td>,
      <td key="name">{row.name}</td>,
      <td key="floors">{row.numberOfFloors}</td>,
      <td key="description">{row.description || '-'}</td>,
      <Status key="status" active={row.active} />
    ];
  }
  return [
    <td key="room"><strong>{row.roomNumber}</strong></td>,
    <td key="type">{row.roomType || '-'}</td>,
    <td key="building">{row.buildingName || row.building || 'Unassigned'}</td>,
    <td key="floor">{row.floor}</td>,
    <td key="capacity">{row.capacity}</td>,
    <td key="occupied">{row.occupied ? 'Occupied' : 'Vacant'}</td>,
    <Status key="status" active={row.active} />
  ];
}

function Status({ active }) {
  return (
    <td>
      <span className={`admin-status-badge ${active ? 'status-active' : 'status-disabled'}`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </td>
  );
}

function endpointFor(tab) {
  if (tab === 'DEPARTMENTS') return '/api/admin/departments';
  if (tab === 'COURSES') return '/api/admin/courses';
  if (tab === 'BUILDINGS') return '/api/admin/buildings';
  return '/api/admin/classrooms';
}

function tabLabel(tab) {
  if (tab === 'DEPARTMENTS') return 'Department';
  if (tab === 'COURSES') return 'Course';
  if (tab === 'BUILDINGS') return 'Building';
  return 'Room';
}

function buildPayload(tab, form, buildings) {
  if (tab === 'COURSES') {
    return { ...form, departmentId: form.departmentId ? Number(form.departmentId) : null, creditHours: Number(form.creditHours) };
  }
  if (tab === 'BUILDINGS') {
    return { ...form, numberOfFloors: Number(form.numberOfFloors) };
  }
  if (tab === 'ROOMS') {
    const building = buildings.find((item) => String(item.id) === String(form.buildingId));
    return {
      ...form,
      buildingId: form.buildingId ? Number(form.buildingId) : null,
      building: building?.name || form.building || null,
      floor: Number(form.floor),
      capacity: Number(form.capacity),
      powerKW: Number(form.powerKW)
    };
  }
  return form;
}
