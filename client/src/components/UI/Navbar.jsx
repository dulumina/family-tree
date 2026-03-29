import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import useMobile from '../../hooks/useMobile';

export default function Navbar({ tab, setTab }) {
  const { user, logout, isAdmin } = useAuth();
  const isMobile = useMobile();
  const tabs = [
    ['tree', '🌲', isMobile ? 'Pohon' : 'Silsilah'], 
    ['list', '📋', 'Daftar'], 
    ...(isAdmin ? [
      ['admin', '👥', isMobile ? 'Admin' : 'Pengguna'], 
      ['data', '💾', isMobile ? 'Data' : 'Database'],
      ['feedback', '📥', isMobile ? 'Saran' : 'Saran / Kritik']
    ] : [])
  ];
  return (
    <header style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', boxShadow: '0 2px 16px #0003', position: 'sticky', top: 0, zIndex: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 12px' : '0 24px', height: isMobile ? 52 : 58 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
          <span style={{ fontSize: isMobile ? 22 : 26, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>🌳</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 14 : 17, whiteSpace: 'nowrap' }}>Silsilah Keluarga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
          {isAdmin && !isMobile && <span style={{ background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>ADMIN</span>}
          <span style={{ color: '#e2e8f0', fontSize: isMobile ? 11 : 13, maxWidth: isMobile ? 80 : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👤 {user?.name}</span>
          <button onClick={logout} style={{ background: '#fff2', border: '1px solid #fff4', color: '#fff', borderRadius: 8, padding: isMobile ? '4px 8px' : '5px 14px', cursor: 'pointer', fontSize: isMobile ? 11 : 13 }}>Keluar</button>
        </div>
      </div>
      <div style={{ display: 'flex', padding: isMobile ? '0 6px' : '0 16px', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {tabs.map(([k, icon, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: isMobile ? '10px 12px' : '10px 20px', border: 'none', background: 'transparent',
            color: tab === k ? '#fff' : '#c4b5fd', fontWeight: 700, fontSize: isMobile ? 12 : 14,
            borderBottom: tab === k ? '3px solid #fff' : '3px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'color 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            {icon} {label}
          </button>
        ))}
      </div>
    </header>
  );
}
