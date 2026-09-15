import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { ErrorState, EmptyState } from '../../shared/SharedComponents';

export default function AcademicSetupSection() {
    const [activeTab, setActiveTab] = useState('DEPARTMENTS');

    return (
        <div className="admin-management-page p-6 fade-in">
            <div className="admin-header flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Academic & Campus Setup</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage departments, courses, buildings, and classrooms.</p>
                </div>
            </div>

            <div className="admin-toolbar bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex gap-2 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('DEPARTMENTS')}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'DEPARTMENTS' ? 'bg-primary-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Departments
                </button>
                <button
                    onClick={() => setActiveTab('COURSES')}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'COURSES' ? 'bg-primary-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Courses
                </button>
                <button
                    onClick={() => setActiveTab('BUILDINGS')}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'BUILDINGS' ? 'bg-primary-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Buildings & Rooms
                </button>
            </div>

            <div className="admin-content-area bg-white rounded-lg shadow-sm border border-gray-100 p-1 min-h-[500px]">
                {activeTab === 'DEPARTMENTS' && <DepartmentsTab />}
                {activeTab === 'COURSES' && <CoursesTab />}
                {activeTab === 'BUILDINGS' && <BuildingsTab />}
            </div>
        </div>
    );
}

function DepartmentsTab() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = () => {
        setLoading(true);
        api('/api/admin/departments')
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading departments...</div>;
    if (error) return <ErrorState message={error} onRetry={loadData} />;
    
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Departments ({data.length})</h3>
            </div>
            
            {data.length === 0 ? <EmptyState message="No departments found." /> : (
                <div className="admin-table-container">
                    <table className="admin-table w-full">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(d => (
                                <tr key={d.id}>
                                    <td className="font-medium">{d.code}</td>
                                    <td>{d.name}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {d.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function CoursesTab() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = () => {
        setLoading(true);
        api('/api/admin/courses')
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading courses...</div>;
    if (error) return <ErrorState message={error} onRetry={loadData} />;
    
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Courses ({data.length})</h3>
            </div>
            
            {data.length === 0 ? <EmptyState message="No courses found." /> : (
                <div className="admin-table-container">
                    <table className="admin-table w-full">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Credits</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(d => (
                                <tr key={d.id}>
                                    <td className="font-medium">{d.courseCode}</td>
                                    <td>{d.courseName}</td>
                                    <td>{d.departmentName || <span className="text-gray-400 italic">Unassigned</span>}</td>
                                    <td>{d.creditHours}</td>
                                    <td>
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {d.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function BuildingsTab() {
    const [buildings, setBuildings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bRes, rRes] = await Promise.all([
                api('/api/admin/buildings'),
                api('/api/admin/classrooms')
            ]);
            setBuildings(bRes);
            setRooms(rRes);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading buildings and rooms...</div>;
    if (error) return <ErrorState message={error} onRetry={loadData} />;
    
    return (
        <div className="p-4 flex flex-col gap-8">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Buildings ({buildings.length})</h3>
                </div>
                
                {buildings.length === 0 ? <EmptyState message="No buildings found." /> : (
                    <div className="admin-table-container">
                        <table className="admin-table w-full">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Floors</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {buildings.map(d => (
                                    <tr key={d.id}>
                                        <td className="font-medium">{d.code}</td>
                                        <td>{d.name}</td>
                                        <td>{d.numberOfFloors}</td>
                                        <td>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${d.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {d.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Classrooms ({rooms.length})</h3>
                </div>
                
                {rooms.length === 0 ? <EmptyState message="No classrooms found." /> : (
                    <div className="admin-table-container">
                        <table className="admin-table w-full">
                            <thead>
                                <tr>
                                    <th>Room</th>
                                    <th>Type</th>
                                    <th>Building (Ref)</th>
                                    <th>Building (Legacy String)</th>
                                    <th>Capacity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map(d => (
                                    <tr key={d.id}>
                                        <td className="font-medium">{d.roomNumber}</td>
                                        <td>{d.roomType}</td>
                                        <td>{d.buildingName || <span className="text-gray-400 italic">Unassigned</span>}</td>
                                        <td className="text-gray-500">{d.building}</td>
                                        <td>{d.capacity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
