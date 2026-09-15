import React, { useState, useEffect, useCallback } from 'react';
import { api, postAction } from '../../../utils/api';
import { ErrorState, LoadingState, ActionButton, Panel, Table } from '../../shared/SharedComponents';
import { Wrench, CheckCircle, Clock, Save } from 'lucide-react';

export function AdminMaintenanceSection({ data, reload }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [status, setStatus] = useState('');
    const [resolutionNote, setResolutionNote] = useState('');

    const loadData = useCallback(() => {
        setLoading(true);
        // We can just use the queue data from admin dashboard payload, but let's assume we want a full list
        // If data.queuedComplaints exists, we can use it, but let's fetch from an API if needed.
        // Actually, the admin dashboard API doesn't return all complaints, it returns queuedComplaints.
        // So we will just use data.queuedComplaints for now.
        setComplaints(data?.queuedComplaints || []);
        setLoading(false);
    }, [data]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleProcessNext = () => {
        postAction('/api/campus/complaint/process-next')
            .then(() => reload())
            .catch(err => setError(err.message));
    };

    const handleUpdateStatus = (e) => {
        e.preventDefault();
        if (!selectedComplaint) return;

        api(`/api/admin/campus-operations/complaints/${selectedComplaint.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, resolutionNote })
        })
            .then(() => {
                setSelectedComplaint(null);
                setResolutionNote('');
                reload();
            })
            .catch(err => setError(err.message));
    };

    if (loading) return <LoadingState text="Loading maintenance..." />;
    if (error) return <ErrorState title="Maintenance Error" message={error} onRetry={loadData} />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                Maintenance & Complaints
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Queue Size</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{data?.queueSize || 0}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">FIFO Processing</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">Process Next Ticket</p>
                    </div>
                    <button
                        onClick={handleProcessNext}
                        disabled={data?.queueSize === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        Dequeue Next
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Panel title="Pending Complaints (FIFO Queue)">
                        {complaints.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Queue is empty.</div>
                        ) : (
                            <div className="space-y-4">
                                {complaints.map((c, index) => (
                                    <div key={c.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded text-xs font-mono">#{index + 1}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    c.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                    c.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {c.priority}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    {c.status}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white">{c.issueTitle}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{c.issueDescription}</p>
                                            <div className="text-xs text-gray-500 mt-2 space-x-4">
                                                <span>Location: {c.location}</span>
                                                <span>Reported by: {c.reporterName}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setSelectedComplaint(c); setStatus(c.status); setResolutionNote(c.resolutionNote || ''); }}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Update Status
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                <div className="lg:col-span-1">
                    {selectedComplaint ? (
                        <Panel title="Update Complaint">
                            <form onSubmit={handleUpdateStatus} className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-800 dark:text-white">{selectedComplaint.issueTitle}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Location: {selectedComplaint.location}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                        className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="ASSIGNED">Assigned</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution Note</label>
                                    <textarea
                                        value={resolutionNote}
                                        onChange={e => setResolutionNote(e.target.value)}
                                        className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white h-24"
                                        placeholder="Add notes for the reporter..."
                                    />
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedComplaint(null)}
                                        className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-600 dark:border-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                </div>
                            </form>
                        </Panel>
                    ) : (
                        <div className="bg-gray-50 dark:bg-slate-800 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center text-gray-500">
                            Select a complaint to update its status.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
