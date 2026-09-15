import React, { useState, useEffect, useCallback } from 'react';
import { api, postAction } from '../../../utils/api';
import { ErrorState, LoadingState, ActionButton, Panel, Table } from '../../shared/SharedComponents';
import { Megaphone, Trash2 } from 'lucide-react';

export function AdminCommunicationSection() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('GENERAL');
    const [priority, setPriority] = useState('MEDIUM');
    const [audience, setAudience] = useState('ALL');

    const loadNotices = useCallback(() => {
        setLoading(true);
        api('/api/admin/communication/notices')
            .then(res => {
                setNotices(res.data || []);
                setError(null);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        loadNotices();
    }, [loadNotices]);

    const handleCreate = (e) => {
        e.preventDefault();
        postAction('/api/admin/communication/notices', { title, content, category, priority, audience })
            .then(() => {
                setTitle('');
                setContent('');
                loadNotices();
            })
            .catch(err => setError(err.message));
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            api(`/api/admin/communication/notices/${id}`, { method: 'DELETE' })
                .then(() => loadNotices())
                .catch(err => setError(err.message));
        }
    };

    if (loading) return <LoadingState text="Loading communication hub..." />;
    if (error) return <ErrorState title="Communication Hub Error" message={error} onRetry={loadNotices} />;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Megaphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                Communication Hub
            </h1>

            <Panel title="Publish New Notice">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
                            <select
                                value={audience}
                                onChange={e => setAudience(e.target.value)}
                                className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="ALL">Everyone</option>
                                <option value="ADMIN">Admins Only</option>
                                <option value="TEACHERS">Teachers Only</option>
                                <option value="STUDENTS">Students Only</option>
                                <option value="SECURITY">Security Only</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white h-24"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="GENERAL">General</option>
                                <option value="ACADEMIC">Academic</option>
                                <option value="TRANSPORT">Transport</option>
                                <option value="SECURITY">Security</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="w-full border rounded p-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <ActionButton icon={Megaphone} label="Publish Notice" type="submit" />
                    </div>
                </form>
            </Panel>

            <Panel title="Published Notices">
                {notices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No notices published.</div>
                ) : (
                    <Table
                        headers={['Date', 'Title', 'Category', 'Audience', 'Status', 'Actions']}
                        rows={notices.map(n => [
                            new Date(n.postedAt).toLocaleString(),
                            n.title,
                            n.category,
                            n.audience,
                            n.status,
                            <button
                                key={`del-${n.id}`}
                                onClick={() => handleDelete(n.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Delete Notice"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        ])}
                    />
                )}
            </Panel>
        </div>
    );
}
