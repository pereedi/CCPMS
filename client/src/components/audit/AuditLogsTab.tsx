import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Activity, Shield, User, Globe, Calendar, Search } from 'lucide-react';

export const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res: any = await api.get('/audit');
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading audit logs...</div>;
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.resource && log.resource.toLowerCase().includes(term)) ||
      (log.username && log.username.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Shield style={{ width: '18px', height: '18px', color: 'var(--accent-blue)' }} />
            <span className="badge badge-role">OFEM SYSTEM SECURITY AUDIT TRAIL</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>System Audit Trail</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Immutable, chronological security & operational activity log tracking every report submission, executive review, return, and login
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search action, user, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div className="glass-panel table-responsive-container" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TIMESTAMP</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTION</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>RESOURCE</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>USER HANDLE</th>
              <th style={{ padding: '14px 20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit trail records found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>
                    {log.resource}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>
                    @{log.username || 'system'}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {log.details || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
