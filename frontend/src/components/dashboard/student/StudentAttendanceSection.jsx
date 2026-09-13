import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Send,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HelpCircle,
  Award,
  Upload,
  Link2,
  Trash2,
  Camera,
  Paperclip
} from 'lucide-react';
import { api, postAction } from '../../../utils/api';
import { SectionHeader, Panel, Table } from '../../shared/SharedComponents';

export function StudentAttendanceSection() {
  const [courses, setCourses] = useState([]);
  const [myExcuses, setMyExcuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'excuses'
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [selectedSessionForExcuse, setSelectedSessionForExcuse] = useState(null);
  const [excuseForm, setExcuseForm] = useState({
    courseCode: '',
    courseTitle: '',
    sectionName: '',
    teacherEmail: '',
    absenceDate: '',
    reasonCategory: 'MEDICAL',
    explanation: '',
    documentUrl: ''
  });
  // Document / Slip Upload State
  const [docMode, setDocMode] = useState('upload'); // 'upload' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Document file size exceeds 15MB limit.' });
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPreviewUrl(ev.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setExcuseForm((prev) => ({ ...prev, documentUrl: '' }));
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api('/api/student/attendance/summary'),
      api('/api/student/attendance/excuses')
    ])
      .then(([summaryRes, excusesRes]) => {
        const courseList = summaryRes.data || [];
        setCourses(courseList);
        setMyExcuses(excusesRes.data || []);
        if (courseList.length > 0 && !expandedCourse) {
          setExpandedCourse(courseList[0].courseCode);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const openExcuseModal = (session, course) => {
    setSelectedSessionForExcuse(session);
    setSelectedFile(null);
    setPreviewUrl('');
    setExcuseForm({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle || course.courseCode,
      sectionName: course.sectionName || 'Section A',
      teacherEmail: course.teacherEmail || 'teacher-demo',
      absenceDate: session ? session.sessionDate : new Date().toISOString().split('T')[0],
      reasonCategory: 'MEDICAL',
      explanation: '',
      documentUrl: ''
    });
    setModalOpen(true);
    setMessage(null);
  };

  const handleExcuseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    let finalDocUrl = excuseForm.documentUrl;

    if (docMode === 'upload' && selectedFile) {
      try {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'same-origin',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data) {
          finalDocUrl = uploadData.data;
        } else if (previewUrl) {
          finalDocUrl = previewUrl;
        }
      } catch (err) {
        console.warn('File upload endpoint error, using preview data url', err);
        if (previewUrl) finalDocUrl = previewUrl;
      } finally {
        setUploadingFile(false);
      }
    }

    const payload = {
      ...excuseForm,
      documentUrl: finalDocUrl || ''
    };

    api('/api/student/attendance/excuses', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then((res) => {
        setSubmitting(false);
        setMessage({ type: 'success', text: 'Absence excuse submitted successfully! Faculty will review it.' });
        setTimeout(() => {
          setModalOpen(false);
          setSelectedFile(null);
          setPreviewUrl('');
          loadData();
        }, 1200);
      })
      .catch((err) => {
        setSubmitting(false);
        setMessage({ type: 'error', text: err.message });
      });
  };

  // Overall totals across all courses
  const totalClassesAll = courses.reduce((acc, c) => acc + (c.totalClasses || 0), 0);
  const totalPresentAll = courses.reduce((acc, c) => acc + (c.presentCount || 0) + (c.lateCount || 0), 0);
  const totalExcusedAll = courses.reduce((acc, c) => acc + (c.excusedCount || 0), 0);
  const totalAbsentAll = courses.reduce((acc, c) => acc + (c.absentCount || 0), 0);
  const overallPercentage = totalClassesAll > 0
    ? Math.round(((totalPresentAll + totalExcusedAll) / totalClassesAll) * 1000) / 10
    : 100;

  return (
    <div className="attendance-portal-wrapper">
      <SectionHeader
        title="Attendance & Absence Excuse Hub"
        subtitle="Track present and absent class dates per course, calculate attendance percentages, and submit official medical slips or leave requests."
      />

      {/* Metric Highlights */}
      <div className="metric-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card metric-card--rooms">
          <div className="metric-card-head">
            <span>Overall Attendance</span>
            <span className="metric-icon"><Award size={21} /></span>
          </div>
          <strong>{overallPercentage}%</strong>
          <div className="metric-card-foot">
            <span>{overallPercentage >= 75 ? 'Meets 75% Requirement' : 'Attendance Warning'}</span>
          </div>
        </div>

        <div className="metric-card metric-card--buses">
          <div className="metric-card-head">
            <span>Classes Attended</span>
            <span className="metric-icon"><CheckCircle2 size={21} /></span>
          </div>
          <strong>{totalPresentAll}</strong>
          <div className="metric-card-foot">
            <span>Present / Late sessions</span>
          </div>
        </div>

        <div className="metric-card metric-card--power">
          <div className="metric-card-head">
            <span>Excused Absences</span>
            <span className="metric-icon"><FileText size={21} /></span>
          </div>
          <strong>{totalExcusedAll}</strong>
          <div className="metric-card-foot">
            <span>Approved medical/leave</span>
          </div>
        </div>

        <div className="metric-card metric-card--accounts">
          <div className="metric-card-head">
            <span>Unexcused Absences</span>
            <span className="metric-icon"><AlertCircle size={21} /></span>
          </div>
          <strong>{totalAbsentAll}</strong>
          <div className="metric-card-foot">
            <span>Requires excuse submission</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="tab-pill-bar">
        <button
          type="button"
          className={`tab-pill ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <CalendarCheck size={16} /> Course Breakdown & Sessions
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'excuses' ? 'active' : ''}`}
          onClick={() => setActiveTab('excuses')}
        >
          <FileText size={16} /> My Submitted Excuses ({myExcuses.length})
        </button>
        <button
          type="button"
          className="tab-pill tab-pill--action"
          onClick={() => openExcuseModal(null, courses[0] || { courseCode: 'CSE 2211' })}
        >
          <PlusCircle size={16} /> Submit New Leave / Medical Request
        </button>
      </div>

      {loading ? (
        <p className="muted" style={{ padding: '2rem 0' }}>Loading attendance records...</p>
      ) : activeTab === 'courses' ? (
        <div className="course-attendance-list">
          {courses.map((course) => {
            const isExpanded = expandedCourse === course.courseCode;
            const pct = course.attendancePercentage || 0;
            const isGood = pct >= 75;

            return (
              <div key={course.courseCode} className={`course-attendance-card ${isGood ? 'status-good' : 'status-warning'}`}>
                <div
                  className="course-card-header"
                  onClick={() => setExpandedCourse(isExpanded ? null : course.courseCode)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="course-title-group">
                    <span className="course-code-tag">{course.courseCode}</span>
                    <div>
                      <h3 className="course-name">{course.courseTitle || course.courseCode}</h3>
                      <span className="course-teacher">{course.sectionName} • Instructor: {course.teacherName}</span>
                    </div>
                  </div>

                  <div className="course-stats-group">
                    <div className="course-percent-badge" style={{ color: isGood ? 'var(--emerald)' : 'var(--amber)' }}>
                      <strong>{pct}%</strong>
                      <span>Attendance</span>
                    </div>
                    <div className="course-stat-chips">
                      <span className="chip chip--present">{course.presentCount} Present</span>
                      {course.lateCount > 0 && <span className="chip chip--late">{course.lateCount} Late</span>}
                      {course.excusedCount > 0 && <span className="chip chip--excused">{course.excusedCount} Excused</span>}
                      <span className="chip chip--absent">{course.absentCount} Absent</span>
                    </div>
                    <button type="button" className="expand-btn" aria-label="Toggle sessions">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="course-progress-track">
                  <div
                    className="course-progress-fill"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: isGood ? 'var(--emerald)' : 'var(--amber)'
                    }}
                  />
                </div>

                {/* Expanded Session Table */}
                {isExpanded && (
                  <div className="session-breakdown-panel">
                    <div className="session-panel-heading">
                      <h4>Session-by-Session Breakdown ({course.sessions?.length || 0} dates held)</h4>
                      <span className="muted" style={{ fontSize: '0.8rem' }}>
                        Click on any absent session to submit a verified medical slip or absence excuse
                      </span>
                    </div>

                    {(!course.sessions || course.sessions.length === 0) ? (
                      <p className="muted" style={{ padding: '1rem' }}>No attendance sessions conducted yet for this course.</p>
                    ) : (
                      <div className="table-wrapper">
                        <table className="custom-data-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Class Room</th>
                              <th>Check-in Time</th>
                              <th>Status</th>
                              <th>Excuse Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {course.sessions.map((sess, idx) => {
                              const isAbsent = sess.status === 'ABSENT';
                              const isPresent = sess.status === 'PRESENT';
                              const isLate = sess.status === 'LATE';
                              const isExcused = sess.status === 'EXCUSED';

                              return (
                                <tr key={idx} className={`session-row ${isAbsent ? 'row--absent' : ''}`}>
                                  <td><strong>{sess.sessionDate}</strong></td>
                                  <td>{sess.roomNumber || 'Room 524'}</td>
                                  <td>
                                    {sess.checkedInAt
                                      ? new Date(sess.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : '-'}
                                  </td>
                                  <td>
                                    {isPresent && <span className="badge badge--emerald"><CheckCircle2 size={13} /> PRESENT</span>}
                                    {isLate && <span className="badge badge--amber"><Clock size={13} /> LATE</span>}
                                    {isExcused && <span className="badge badge--sky"><FileText size={13} /> EXCUSED</span>}
                                    {isAbsent && <span className="badge badge--rose"><XCircle size={13} /> ABSENT</span>}
                                  </td>
                                  <td>
                                    {isAbsent && !sess.excuseSubmitted && (
                                      <button
                                        type="button"
                                        className="inline-action-btn"
                                        onClick={() => openExcuseModal(sess, course)}
                                      >
                                        <Send size={13} /> Submit Excuse
                                      </button>
                                    )}
                                    {sess.excuseSubmitted && (
                                      <span className={`status-pill status-pill--${(sess.excuseStatus || 'PENDING').toLowerCase()}`}>
                                        Excuse {sess.excuseStatus || 'PENDING'}
                                      </span>
                                    )}
                                    {(isPresent || isLate || isExcused) && (
                                      <span className="muted" style={{ fontSize: '0.78rem' }}>Verified</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Excuses List Tab */
        <div className="excuses-tracker-panel">
          <Panel title="My Submitted Absence & Medical Leave Requests" tag={`${myExcuses.length} records`}>
            {myExcuses.length === 0 ? (
              <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>
                You have not submitted any absence excuses yet.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Absence Date</th>
                      <th>Category</th>
                      <th>Explanation & Document</th>
                      <th>Status</th>
                      <th>Teacher Remarks</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myExcuses.map((exc) => (
                      <tr key={exc.id}>
                        <td>
                          <strong>{exc.courseCode}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--tx-muted)' }}>{exc.sectionName}</span>
                        </td>
                        <td>{exc.absenceDate}</td>
                        <td><span className="badge badge--neutral">{exc.reasonCategory}</span></td>
                        <td style={{ maxWidth: '280px' }}>
                          <p style={{ margin: 0, fontSize: '0.84rem' }}>{exc.explanation}</p>
                          {exc.documentUrl && (
                            <span className="doc-link-tag">📎 Slip Ref: {exc.documentUrl}</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge--${exc.status === 'APPROVED' ? 'emerald' : exc.status === 'REJECTED' ? 'rose' : 'amber'}`}>
                            {exc.status}
                          </span>
                        </td>
                        <td>
                          {exc.teacherRemarks ? (
                            <span style={{ fontSize: '0.82rem', color: 'var(--tx-primary)' }}>{exc.teacherRemarks}</span>
                          ) : (
                            <span className="muted">Awaiting review</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--tx-muted)' }}>
                          {exc.submittedAt ? new Date(exc.submittedAt).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Absence Excuse Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Absence Excuse / Leave Slip</h3>
              <button type="button" className="close-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleExcuseSubmit} className="modal-form">
              <div className="form-group">
                <label>Course Code & Title</label>
                <input
                  type="text"
                  value={`${excuseForm.courseCode} - ${excuseForm.courseTitle}`}
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Absence *</label>
                  <input
                    type="date"
                    required
                    value={excuseForm.absenceDate}
                    onChange={(e) => setExcuseForm({ ...excuseForm, absenceDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Reason Category *</label>
                  <select
                    value={excuseForm.reasonCategory}
                    onChange={(e) => setExcuseForm({ ...excuseForm, reasonCategory: e.target.value })}
                  >
                    <option value="MEDICAL">Medical Illness / Doctor Advice</option>
                    <option value="FAMILY_EMERGENCY">Family Emergency</option>
                    <option value="ACADEMIC_EVENT">University Competition / Academic Event</option>
                    <option value="TRANSPORT_DISRUPTION">Major Road / Transport Disruption</option>
                    <option value="OTHER">Other Official Grounds</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ margin: 0 }}>Medical Slip / Certificate Attachment</label>
                  <div className="photo-mode-toggle">
                    <button
                      type="button"
                      className={`photo-tab-btn ${docMode === 'upload' ? 'active' : ''}`}
                      onClick={() => setDocMode('upload')}
                    >
                      <Upload size={12} /> Browse File
                    </button>
                    <button
                      type="button"
                      className={`photo-tab-btn ${docMode === 'url' ? 'active' : ''}`}
                      onClick={() => setDocMode('url')}
                    >
                      <Link2 size={12} /> Document Link
                    </button>
                  </div>
                </div>

                {docMode === 'upload' ? (
                  <div className="file-upload-zone">
                    {selectedFile ? (
                      <div className="file-preview-card">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Slip Preview" className="file-preview-img" />
                        ) : (
                          <div className="file-preview-doc-icon">
                            <FileText size={28} />
                          </div>
                        )}
                        <div className="file-preview-details">
                          <span className="file-name">{selectedFile.name}</span>
                          <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                          <button type="button" className="file-remove-btn" onClick={handleRemoveFile}>
                            <Trash2 size={13} /> Remove File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="file-drop-area">
                        <input
                          type="file"
                          accept=".pdf,image/*,.doc,.docx"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <div className="file-drop-content">
                          <div className="file-drop-icon">
                            <Paperclip size={22} />
                          </div>
                          <strong>Click to browse or drop medical certificate / slip</strong>
                          <span>Supports PDF, JPG, PNG, WEBP (Up to 15MB)</span>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Prescription #RX-8942 or Google Drive / Cloud document URL"
                      value={excuseForm.documentUrl}
                      onChange={(e) => {
                        setExcuseForm({ ...excuseForm, documentUrl: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Detailed Explanation *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="State the reason for missing class, medical context, or supporting information for faculty review..."
                  value={excuseForm.explanation}
                  onChange={(e) => setExcuseForm({ ...excuseForm, explanation: e.target.value })}
                />
              </div>

              {message && (
                <div className={`notice notice--${message.type}`} style={{ marginBottom: '1rem' }}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit to Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
