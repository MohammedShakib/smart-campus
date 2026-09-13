import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  Tag,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  Phone,
  UserCheck,
  Send,
  Lock,
  Upload,
  Image,
  Link2,
  Trash2,
  Camera
} from 'lucide-react';
import { api } from '../../../utils/api';
import { SectionHeader, Panel } from '../../shared/SharedComponents';

const CATEGORIES = [
  { id: 'ALL', label: 'All Items' },
  { id: 'ELECTRONICS', label: 'Electronics & Devices' },
  { id: 'ID_CARDS', label: 'Student / Staff IDs' },
  { id: 'KEYS', label: 'Keys & Keychains' },
  { id: 'BOOKS_STATIONERY', label: 'Books & Calculators' },
  { id: 'VALUABLES', label: 'Valuables & Wallets' },
  { id: 'BAGS_CLOTHING', label: 'Bags & Clothing' },
  { id: 'OTHER', label: 'Other Items' }
];

export function StudentLostFoundSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'FOUND' | 'LOST'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState(null);

  // Report Form
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    category: 'ELECTRONICS',
    type: 'FOUND',
    location: '',
    itemDate: new Date().toISOString().split('T')[0],
    imageUrl: '',
    contactInfo: ''
  });

  // Photo Attachment State
  const [photoMode, setPhotoMode] = useState('upload'); // 'upload' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Claim Form
  const [claimForm, setClaimForm] = useState({
    claimProofDetails: '',
    contactPhone: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image file size exceeds 10MB limit.' });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewUrl(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setReportForm((prev) => ({ ...prev, imageUrl: '' }));
  };

  const loadItems = () => {
    setLoading(true);
    let url = '/api/student/lost-found?';
    if (selectedCategory !== 'ALL') url += `category=${selectedCategory}&`;
    if (selectedType !== 'ALL') url += `type=${selectedType}&`;

    api(url)
      .then((res) => {
        setItems(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();
  }, [selectedCategory, selectedType]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    let finalImageUrl = reportForm.imageUrl;

    if (photoMode === 'upload' && selectedFile) {
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
          finalImageUrl = uploadData.data;
        } else if (previewUrl) {
          finalImageUrl = previewUrl;
        }
      } catch (err) {
        console.warn('File upload endpoint error, using preview data url', err);
        if (previewUrl) finalImageUrl = previewUrl;
      } finally {
        setUploadingFile(false);
      }
    }

    const payload = {
      ...reportForm,
      imageUrl: finalImageUrl || ''
    };

    api('/api/student/lost-found', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(() => {
        setSubmitting(false);
        setMessage({ type: 'success', text: 'Item reported to the campus Lost & Found board!' });
        setTimeout(() => {
          setReportModalOpen(false);
          setSelectedFile(null);
          setPreviewUrl('');
          setReportForm({
            title: '',
            description: '',
            category: 'ELECTRONICS',
            type: 'FOUND',
            location: '',
            itemDate: new Date().toISOString().split('T')[0],
            imageUrl: '',
            contactInfo: ''
          });
          loadItems();
        }, 1200);
      })
      .catch((err) => {
        setSubmitting(false);
        setMessage({ type: 'error', text: err.message });
      });
  };

  const openClaimModal = (item) => {
    setSelectedItemForClaim(item);
    setClaimForm({
      claimProofDetails: '',
      contactPhone: ''
    });
    setClaimModalOpen(true);
    setMessage(null);
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemForClaim) return;

    setSubmitting(true);
    setMessage(null);

    api(`/api/student/lost-found/${selectedItemForClaim.id}/claim`, {
      method: 'POST',
      body: JSON.stringify(claimForm)
    })
      .then(() => {
        setSubmitting(false);
        setMessage({
          type: 'success',
          text: 'Verification claim submitted! The reporter/security will review your proof of ownership.'
        });
        setTimeout(() => {
          setClaimModalOpen(false);
          loadItems();
        }, 1400);
      })
      .catch((err) => {
        setSubmitting(false);
        setMessage({ type: 'error', text: err.message });
      });
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.location && item.location.toLowerCase().includes(query))
    );
  });

  return (
    <div className="lostfound-wrapper">
      <SectionHeader
        title="Digital Lost & Found Board"
        subtitle="Search found and lost items across campus buildings, filter by tags, and claim your belongings with secure ownership verification."
      />

      {/* Top Action Bar */}
      <div className="lostfound-controls">
        <div className="search-bar-wrap">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search items by title, location, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="type-toggle-group">
          <button
            type="button"
            className={`type-btn ${selectedType === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedType('ALL')}
          >
            All Types
          </button>
          <button
            type="button"
            className={`type-btn type-btn--found ${selectedType === 'FOUND' ? 'active' : ''}`}
            onClick={() => setSelectedType('FOUND')}
          >
            🟢 Found Items
          </button>
          <button
            type="button"
            className={`type-btn type-btn--lost ${selectedType === 'LOST' ? 'active' : ''}`}
            onClick={() => setSelectedType('LOST')}
          >
            🔴 Lost Reports
          </button>
        </div>

        <button
          type="button"
          className="primary-btn"
          onClick={() => {
            setReportForm({
              title: '',
              description: '',
              category: 'ELECTRONICS',
              type: 'FOUND',
              location: '',
              itemDate: new Date().toISOString().split('T')[0],
              imageUrl: '',
              contactInfo: ''
            });
            setReportModalOpen(true);
            setMessage(null);
          }}
        >
          <PlusCircle size={16} /> Report Item
        </button>
      </div>

      {/* Category Tags Scroll Bar */}
      <div className="category-tags-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <Tag size={13} /> {cat.label}
          </button>
        ))}
      </div>

      {/* Items Photo Feed Grid */}
      {loading ? (
        <p className="muted" style={{ padding: '3rem 0', textAlign: 'center' }}>Loading lost & found items...</p>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state-box">
          <Sparkles size={32} style={{ color: 'var(--tx-muted)', marginBottom: '0.75rem' }} />
          <h3>No Items Found</h3>
          <p className="muted">No matching lost or found records match your current filters.</p>
        </div>
      ) : (
        <div className="items-feed-grid">
          {filteredItems.map((item) => {
            const isFound = item.type === 'FOUND';
            const isResolved = item.status === 'RESOLVED';
            const isClaimPending = item.status === 'CLAIM_PENDING';
            const isOpen = item.status === 'OPEN';

            return (
              <div key={item.id} className={`item-feed-card ${isFound ? 'card--found' : 'card--lost'}`}>
                {/* Photo Thumbnail */}
                <div className="item-thumbnail-wrapper">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="item-img" />
                  ) : (
                    <div className="item-img-placeholder">
                      <Tag size={36} />
                      <span>{item.category.replace('_', ' ')}</span>
                    </div>
                  )}
                  <span className={`item-type-badge ${isFound ? 'badge--found' : 'badge--lost'}`}>
                    {isFound ? 'FOUND ITEM' : 'LOST REPORT'}
                  </span>
                  <span className="item-category-badge">{item.category.replace('_', ' ')}</span>
                </div>

                {/* Body Details */}
                <div className="item-card-body">
                  <h4 className="item-title">{item.title}</h4>
                  <p className="item-description">{item.description}</p>

                  <div className="item-meta-list">
                    <div className="meta-entry">
                      <MapPin size={14} /> <span>{item.location}</span>
                    </div>
                    <div className="meta-entry">
                      <Calendar size={14} /> <span>{item.itemDate}</span>
                    </div>
                    <div className="meta-entry">
                      <UserCheck size={14} /> <span>Reported by: {item.reporterName || 'Campus Member'}</span>
                    </div>
                  </div>

                  {/* Claim Status or Action */}
                  <div className="item-card-footer">
                    {isResolved ? (
                      <span className="claim-status-tag tag--resolved">
                        <CheckCircle2 size={14} /> Claim Verified & Returned
                      </span>
                    ) : isClaimPending ? (
                      <span className="claim-status-tag tag--pending">
                        <Clock size={14} /> Claim Under Verification
                      </span>
                    ) : isFound ? (
                      <button
                        type="button"
                        className="claim-action-btn"
                        onClick={() => openClaimModal(item)}
                      >
                        <ShieldCheck size={15} /> Claim This Item (Verify Ownership)
                      </button>
                    ) : (
                      <span className="claim-status-tag tag--contact">
                        <Phone size={14} /> Contact: {item.contactInfo || 'Via Student Portal'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Lost or Found Item</h3>
              <button type="button" className="close-btn" onClick={() => setReportModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleReportSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Item Status / Type *</label>
                  <select
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                  >
                    <option value="FOUND">I Found Something</option>
                    <option value="LOST">I Lost Something</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                  >
                    <option value="ELECTRONICS">Electronics & Devices</option>
                    <option value="ID_CARDS">Student / Staff ID Cards</option>
                    <option value="KEYS">Keys & Keychains</option>
                    <option value="BOOKS_STATIONERY">Books, Notes & Stationery</option>
                    <option value="VALUABLES">Valuables & Wallets</option>
                    <option value="BAGS_CLOTHING">Bags, Jackets & Clothing</option>
                    <option value="OTHER">Other Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Item Name / Short Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Casio fx-991EX Calculator / Brown Leather Keychain"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location (Found or Lost) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 524 Lab, 2nd Floor Library"
                    value={reportForm.location}
                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={reportForm.itemDate}
                    onChange={(e) => setReportForm({ ...reportForm, itemDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ margin: 0 }}>Photo Image Attachment (Optional)</label>
                  <div className="photo-mode-toggle">
                    <button
                      type="button"
                      className={`photo-tab-btn ${photoMode === 'upload' ? 'active' : ''}`}
                      onClick={() => setPhotoMode('upload')}
                    >
                      <Upload size={12} /> Browse File
                    </button>
                    <button
                      type="button"
                      className={`photo-tab-btn ${photoMode === 'url' ? 'active' : ''}`}
                      onClick={() => setPhotoMode('url')}
                    >
                      <Link2 size={12} /> Image URL
                    </button>
                  </div>
                </div>

                {photoMode === 'upload' ? (
                  <div className="file-upload-zone">
                    {previewUrl ? (
                      <div className="file-preview-card">
                        <img src={previewUrl} alt="Preview" className="file-preview-img" />
                        <div className="file-preview-details">
                          <span className="file-name">{selectedFile?.name || 'Selected Photo'}</span>
                          <span className="file-size">{selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}</span>
                          <button type="button" className="file-remove-btn" onClick={handleRemoveFile}>
                            <Trash2 size={13} /> Remove Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="file-drop-area">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <div className="file-drop-content">
                          <div className="file-drop-icon">
                            <Camera size={22} />
                          </div>
                          <strong>Click to browse or drop an image file</strong>
                          <span>Supports JPG, PNG, WEBP, GIF (Up to 10MB)</span>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or direct image link"
                      value={reportForm.imageUrl}
                      onChange={(e) => {
                        setReportForm({ ...reportForm, imageUrl: e.target.value });
                        setPreviewUrl(e.target.value);
                      }}
                    />
                    {reportForm.imageUrl && (
                      <div className="file-preview-card" style={{ marginTop: '0.6rem' }}>
                        <img
                          src={reportForm.imageUrl}
                          alt="URL Preview"
                          className="file-preview-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="file-preview-details">
                          <span className="file-name">Direct Link Preview</span>
                          <span className="file-size" style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{reportForm.imageUrl}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Description & Context *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe color, brand, distinct markings, where exactly it was found or lost..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Info / Drop-off Note</label>
                <input
                  type="text"
                  placeholder="e.g. Deposited at Security Post 1 / Phone number"
                  value={reportForm.contactInfo}
                  onChange={(e) => setReportForm({ ...reportForm, contactInfo: e.target.value })}
                />
              </div>

              {message && (
                <div className={`notice notice--${message.type}`} style={{ marginBottom: '1rem' }}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setReportModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Publish Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secure Claim Verification Modal */}
      {claimModalOpen && selectedItemForClaim && (
        <div className="modal-overlay" onClick={() => setClaimModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} style={{ color: 'var(--emerald)' }} />
                <h3>Secure Claim Verification</h3>
              </div>
              <button type="button" className="close-btn" onClick={() => setClaimModalOpen(false)}>×</button>
            </div>

            <div className="claim-notice-box">
              <Lock size={18} style={{ color: 'var(--accent-glow)' }} />
              <div>
                <strong>Ownership Verification Notice</strong>
                <p>
                  Claiming: <strong>{selectedItemForClaim.title}</strong> found at <em>{selectedItemForClaim.location}</em>.
                  To prevent fraudulent claims, please specify identifying details only the rightful owner would know.
                </p>
              </div>
            </div>

            <form onSubmit={handleClaimSubmit} className="modal-form">
              <div className="form-group">
                <label>Proof of Ownership / Identifying Characteristics *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide identifying proof: e.g. Serial number, specific stickers/scratches, phone lockscreen wallpaper, exact items inside, student ID number, or security PIN details..."
                  value={claimForm.claimProofDetails}
                  onChange={(e) => setClaimForm({ ...claimForm, claimProofDetails: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 017XXXXXXXX"
                  value={claimForm.contactPhone}
                  onChange={(e) => setClaimForm({ ...claimForm, contactPhone: e.target.value })}
                />
              </div>

              {message && (
                <div className={`notice notice--${message.type}`} style={{ marginBottom: '1rem' }}>
                  {message.text}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={() => setClaimModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  <ShieldCheck size={16} /> {submitting ? 'Verifying...' : 'Submit Claim Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
