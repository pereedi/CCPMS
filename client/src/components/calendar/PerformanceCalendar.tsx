import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, FileText, CheckCircle2, Target, Eye, X } from 'lucide-react';

export const PerformanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 31)); // July 2026
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDayReports, setSelectedDayReports] = useState<{ dateStr: string; items: any[] } | null>(null);

  useEffect(() => {
    fetchCalendarReports();
  }, []);

  const fetchCalendarReports = async () => {
    try {
      const res: any = await api.get('/reports');
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.warn('Calendar reports fetch error, using sample items', err);
      setReports([
        {
          id: '1',
          title: 'July 2026 Technology Directorate Performance Summary',
          period: '2026-07-31',
          createdAt: '2026-07-31T10:00:00Z',
          summary: 'Goal Achievement: 90%. Financial Achievement: $135,000.',
          status: 'SUBMITTED',
          directorate: { name: 'Technology & Innovation', code: 'TECH' },
          author: { name: 'Directorate Director' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getReportsForDay = (dayNum: number) => {
    const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
    const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return reports.filter((r) => {
      if (r.createdAt && r.createdAt.startsWith(targetDateStr)) return true;
      if (r.period && r.period.includes(targetDateStr)) return true;
      return false;
    });
  };

  const handleDayClick = (dayNum: number) => {
    const dayItems = getReportsForDay(dayNum);
    const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const formattedMonth = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`;
    const dateStr = `${monthNames[month]} ${dayNum}, ${year}`;

    setSelectedDayReports({
      dateStr,
      items: dayItems,
    });
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading performance calendar...</div>;
  }

  // Build grid days
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarGrid.push(d);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Calendar Header Control */}
      <div className="glass-panel glow-panel" style={{
        padding: '20px 28px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.4) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--kingschat-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(245, 158, 11, 0.3)'
          }}>
            <CalendarIcon style={{ width: '22px', height: '22px', color: '#ffffff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
              Performance & Submissions Calendar
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Track daily, weekly, monthly, and quarterly directorate report submissions & milestones
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={prevMonth} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </button>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', minWidth: '150px', textAlign: 'center' }}>
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px' }}>
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        {/* Days of week header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {calendarGrid.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} style={{ minHeight: '90px', background: 'rgba(255,255,255,0.01)', borderRadius: '10px' }} />;
            }

            const dayReports = getReportsForDay(dayNum);
            const isToday = dayNum === 31 && month === 6 && year === 2026;

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => handleDayClick(dayNum)}
                style={{
                  minHeight: '90px',
                  padding: '8px',
                  borderRadius: '10px',
                  background: isToday ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  border: isToday ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = isToday ? 'var(--accent-blue)' : 'var(--border-color)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? 'var(--accent-blue)' : '#ffffff'
                  }}>
                    {dayNum}
                  </span>
                  {isToday && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'var(--accent-blue)', color: '#ffffff', padding: '1px 5px', borderRadius: '4px' }}>
                      TODAY
                    </span>
                  )}
                </div>

                {/* Badges for reports on this day */}
                <div>
                  {dayReports.map((r, rIdx) => (
                    <div key={rIdx} style={{
                      marginTop: '4px',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      fontSize: '0.68rem',
                      color: '#34d399',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      📄 {r.directorate?.code || 'TECH'} Report
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL FOR DAY REPORTS */}
      {selectedDayReports && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '480px', padding: '24px', borderRadius: '16px', background: '#111827' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarIcon style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  {selectedDayReports.dateStr}
                </h3>
              </div>
              <button onClick={() => setSelectedDayReports(null)} className="btn btn-secondary btn-sm" style={{ padding: '4px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {selectedDayReports.items.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No directorate reports submitted on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedDayReports.items.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.summary}</div>
                    <div style={{ fontSize: '0.7rem', color: '#60a5fa', marginTop: '6px' }}>
                      Directorate: {item.directorate?.name} • Submitted by {item.author?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
