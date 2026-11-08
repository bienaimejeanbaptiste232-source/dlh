'use client';

import { useState, useEffect } from 'react';

interface SettingItem {
  id?: string;
  key: string;
  value: any;
  category: string;
  description: string;
}

const TABS = [
  { id: 'all', label: 'Tout' },
  { id: 'web_client', label: 'Web Client' },
  { id: 'mobile_client', label: 'App Client' },
  { id: 'mobile_merchant', label: 'Machann (Restoran)' },
  { id: 'mobile_driver', label: 'Livrè (Moto)' },
  { id: 'general', label: 'Sistèm & Kontak' },
];

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [rawList, setRawList] = useState<SettingItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Dynamic host helper for LAN/WiFi/Mobile/Laptop
  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      return `http://${window.location.hostname}:4000/api/v1`;
    }
    return 'http://localhost:4000/api/v1';
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    let clean = String(url).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1);
    }
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    clean = clean.replace(/https?:\/\/(localhost|127\.0\.0\.1):4000/g, `http://${host}:4000`);
    if (clean.startsWith('/uploads/')) {
      clean = `http://${host}:4000${clean}`;
    }
    return clean;
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  async function handleFileUpload(key: string, file: File) {
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${getApiBase()}/platform-settings/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const uploadedUrl = json.url;
        handleValueChange(key, uploadedUrl);

        // Auto-save setting directly to DB immediately so user does not need to click Save
        await fetch(`${getApiBase()}/platform-settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...settings, [key]: uploadedUrl }),
        });

        showToast('Imaj la monte epi anrejistre avèk siksè!', 'success');
        await fetchSettings();
      } else {
        showToast('Erè pandan telechajman imaj la', 'error');
      }
    } catch {
      showToast('Pa ka telechaje imaj la sou sèvè a', 'error');
    } finally {
      setUploadingKey(null);
    }
  }

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/platform-settings`);
      if (res.ok) {
        const json = await res.json();
        setSettings(json.data.settings || {});
        setRawList(json.data.raw || []);
      } else {
        showToast('Erè pandan chajman paramèt yo', 'error');
      }
    } catch {
      showToast('Pa ka konekte ak sèvè a', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleValueChange(key: string, val: any) {
    setSettings((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/platform-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast('Tout enfòmasyon yo anrejistre avèk siksè!', 'success');
        await fetchSettings();
      } else {
        showToast('Erè pandan anrejistreman an', 'error');
      }
    } catch {
      showToast('Erè rezo pandan anrejistreman an', 'error');
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = rawList.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 8,
            color: '#fff',
            background: toast.type === 'success' ? '#10B981' : '#EF4444',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 700,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            Jesyon Kontni & Paramèt Platfòm
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Modifye tout tèks, nimewo telefòn, mesaj akèy ak anons ki parèt sou Web Client, App Kliyan, Machann ak Livrè.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: '#EB1700',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: '0.9375rem',
            fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(235,23,0,0.3)',
          }}
        >
          {saving ? 'Anrejistreman...' : 'Anrejistre Tout Chanjman'}
        </button>
      </div>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12,
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#EB1700' : 'var(--surface)',
              color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
              border: activeTab === tab.id ? '1px solid #EB1700' : '1px solid var(--border)',
              borderRadius: 20,
              padding: '6px 18px',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Chaje paramèt yo...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Pa gen paramèt nan kategori sa a.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: 20 }}>
          {filteredItems.map((item) => {
            const currentVal = settings[item.key] ?? item.value ?? '';
            const isTextarea = String(currentVal).length > 50 || item.key.includes('message') || item.key.includes('notice') || item.key.includes('announcement');

            return (
              <div
                key={item.key}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatKeyName(item.key)}
                  </label>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      background: 'rgba(235, 23, 0, 0.08)',
                      color: '#EB1700',
                      padding: '2px 8px',
                      borderRadius: 12,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.category}
                  </span>
                </div>

                <p style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {item.description}
                </p>

                {item.key.includes('image') && currentVal && (
                  <div style={{ marginBottom: 12, borderRadius: 10, overflow: 'hidden', height: 140, border: '1px solid var(--border)', position: 'relative', background: '#0B0F19' }}>
                    <img
                      src={resolveImageUrl(currentVal)}
                      alt="Aperçu Banyè"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80';
                      }}
                    />
                    <div style={{ position: 'absolute', bottom: 6, left: 8, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                      Aperçu Banyè An Liy
                    </div>
                  </div>
                )}

                {item.key.includes('image') && (
                  <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        padding: '6px 14px',
                        borderRadius: 6,
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        cursor: uploadingKey === item.key ? 'not-allowed' : 'pointer',
                        opacity: uploadingKey === item.key ? 0.6 : 1,
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>{uploadingKey === item.key ? 'Chaje...' : 'Chwazi foto sou Laptop'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploadingKey === item.key}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(item.key, file);
                        }}
                      />
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Oswa kole yon lyen web (URL) dirèkteman anba a :
                    </span>
                  </div>
                )}

                {isTextarea ? (
                  <textarea
                    rows={3}
                    value={currentVal}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    value={currentVal}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatKeyName(key: string) {
  return key
    .replace(/^web_|^mobile_client_|^merchant_|^driver_/, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

