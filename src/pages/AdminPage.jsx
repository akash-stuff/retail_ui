import { useCallback, useEffect, useRef, useState } from 'react';
import { adminLogin, fetchCustomers } from '../api.js';

const STORAGE_KEY = 'retail_loyalty_admin_passcode';
const POLL_INTERVAL_MS = 10000;

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toCsv(rows) {
  const headers = [
    'Name',
    'Mobile',
    'Email',
    'Visit Count',
    'Latest Discount (%)',
    'Remarks',
    'First Visit',
    'Last Visit',
  ];
  const lines = [headers.join(',')];
  rows.forEach((c) => {
    const values = [
      c.name,
      c.mobile,
      c.email,
      c.visitCount,
      c.lastDiscount,
      c.remarks,
      formatDate(c.createdAt),
      formatDate(c.lastVisitAt),
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`);
    lines.push(values.join(','));
  });
  return lines.join('\n');
}

function downloadCsv(rows) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `customer-leads-${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * AdminLogin — shown until a valid passcode is stored locally.
 */
function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(password);
      localStorage.setItem(STORAGE_KEY, password);
      onSuccess(password);
    } catch (err) {
      setError(err.message || 'Incorrect passcode.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="brandbar">
        <span className="brandbar-dot" />
        <span className="brandbar-label">Counter Rewards · Admin</span>
      </div>
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <p className="claim-eyebrow">Staff access</p>
          <h1 className="claim-title">Enter passcode</h1>
          <p className="claim-subtitle">Ask your manager for the store dashboard passcode.</p>
          {error && <div className="form-banner error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field-group">
              <input
                className="field-input"
                type="password"
                placeholder="••••••"
                value={password}
                autoFocus
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="submit-btn" type="submit" disabled={loading || !password}>
              {loading ? <span className="spinner" /> : 'Unlock dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminDashboard — the live customer table, once authenticated.
 */
function AdminDashboard({ password, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  const loadCustomers = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await fetchCustomers(password);
        setCustomers(data.customers || []);
        setLastUpdated(new Date());
        setError('');
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          onLogout();
          return;
        }
        setError(err.message || 'Failed to load customers.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [password, onLogout]
  );

  // Initial load + polling every 10 seconds for near-real-time check-ins
  useEffect(() => {
    loadCustomers(false);
    pollRef.current = setInterval(() => loadCustomers(true), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadCustomers]);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.mobile.includes(q);
  });

  const totalVisits = customers.reduce((sum, c) => sum + (c.visitCount || 0), 0);
  const repeatCustomers = customers.filter((c) => c.visitCount > 1).length;

  return (
    <div className="page-shell">
      <div className="brandbar">
        <span className="brandbar-dot" />
        <span className="brandbar-label">Counter Rewards · Admin</span>
      </div>

      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Customer check-ins</h1>
            <p className="admin-subtitle">
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString()} · refreshes every 10s`
                : 'Loading…'}
            </p>
          </div>
          <div className="admin-controls">
            <input
              className="admin-search"
              type="text"
              placeholder="Search by name or mobile…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="admin-btn"
              type="button"
              onClick={() => loadCustomers(true)}
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner dark" /> : '↻'} Refresh
            </button>
            <button
              className="admin-btn primary"
              type="button"
              onClick={() => downloadCsv(filtered)}
              disabled={filtered.length === 0}
            >
              ⬇ Export CSV
            </button>
            <button
              className="admin-btn"
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                onLogout();
              }}
            >
              Log out
            </button>
          </div>
        </div>

        <div className="admin-stats">
          <div className="stat-chip">
            <div className="stat-chip-value">{customers.length}</div>
            <div className="stat-chip-label">Total customers</div>
          </div>
          <div className="stat-chip">
            <div className="stat-chip-value">{totalVisits}</div>
            <div className="stat-chip-label">Total check-ins</div>
          </div>
          <div className="stat-chip">
            <div className="stat-chip-value">{repeatCustomers}</div>
            <div className="stat-chip-label">Repeat customers</div>
          </div>
        </div>

        {error && <div className="form-banner error">{error}</div>}

        <div className="table-wrap">
          {loading ? (
            <div className="loading-row">
              <span className="spinner dark" /> Loading customers…
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              {customers.length === 0
                ? 'No check-ins yet. Once a customer scans the counter QR, they will show up here.'
                : 'No customers match your search.'}
            </div>
          ) : (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Visits</th>
                  <th>Latest discount</th>
                  <th>Remarks</th>
                  <th>First visit</th>
                  <th>Last visit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.mobile}</td>
                    <td>{c.email || '—'}</td>
                    <td>
                      <span className="pill pill-visit">Visit #{c.visitCount}</span>
                    </td>
                    <td>
                      <span className="pill pill-discount">{c.lastDiscount}% off</span>
                    </td>
                    <td>{c.remarks || '—'}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>{formatDate(c.lastVisitAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState(() => localStorage.getItem(STORAGE_KEY) || '');

  if (!password) {
    return <AdminLogin onSuccess={(pw) => setPassword(pw)} />;
  }

  return <AdminDashboard password={password} onLogout={() => setPassword('')} />;
}
