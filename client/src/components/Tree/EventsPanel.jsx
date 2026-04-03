import { useMemo } from 'react';

export default function EventsPanel({ members }) {
  const events = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const result = [];

    members.forEach(m => {
      // Birthday
      if (m.birth_date) {
        const b = new Date(m.birth_date);
        const bMonth = b.getMonth();
        const bDay = b.getDate();
        
        // Upcoming in the next 30 days or same month
        if (bMonth === currentMonth || (bMonth === (currentMonth + 1) % 12)) {
          result.push({
            type: 'birthday',
            date: b,
            member: m,
            label: `Ulang Tahun: ${b.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`,
            daysUntil: (bMonth === currentMonth && bDay >= currentDay) ? bDay - currentDay : 30 // Simplified
          });
        }
      }

      // Death Anniversary (Haul)
      if (m.is_alive === 0 && m.death_date) {
        const d = new Date(m.death_date);
        const dMonth = d.getMonth();
        const dDay = d.getDate();

        if (dMonth === currentMonth || (dMonth === (currentMonth + 1) % 12)) {
          result.push({
            type: 'haul',
            date: d,
            member: m,
            label: `Haul (Wafat): ${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`,
            daysUntil: (dMonth === currentMonth && dDay >= currentDay) ? dDay - currentDay : 30
          });
        }
      }
    });

    // Sort by day of month (approximate)
    return result.sort((a, b) => a.date.getDate() - b.date.getDate()).slice(0, 10);
  }, [members]);

  if (events.length === 0) return null;

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0',
      padding: '16px', boxShadow: '0 4px 12px #0001', marginBottom: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>📅</span>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Pengingat Terdekat</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((ev, i) => (
          <div key={i} style={{ 
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', 
            borderRadius: 10, background: ev.type === 'birthday' ? '#f0f9ff' : '#fff1f2',
            border: `1px solid ${ev.type === 'birthday' ? '#bae6fd' : '#fecaca'}`
          }}>
            <span style={{ fontSize: 20 }}>{ev.type === 'birthday' ? '🎂' : '🥀'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{ev.member.name}</div>
              <div style={{ fontSize: 11, color: ev.type === 'birthday' ? '#0369a1' : '#be123c', fontWeight: 600 }}>{ev.label}</div>
            </div>
            {ev.daysUntil === 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>HARI INI</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
