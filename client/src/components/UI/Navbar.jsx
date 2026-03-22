import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function Navbar({ tab, setTab }) {
  const { user, logout, isAdmin } = useAuth();
  const tabs = [
    ['tree', '🌲', 'Pohon'], 
    ['list', '📋', 'Daftar'], 
    ...(isAdmin ? [['admin', '⚙️', 'Admin'], ['data', '💾', 'Manajemen Data']] : [])
  ];
  return (
    <header style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', boxShadow: '0 2px 16px #0003' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 58 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26, animation: 'float 3s ease-in-out infinite', display: 'inline-block' }}>🌳</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 17 }}>Pohon Silsilah Keluarga</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin && <span style={{ background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>ADMIN</span>}
          <span style={{ color: '#e2e8f0', fontSize: 13 }}>👤 {user?.name}</span>
          <button onClick={logout} style={{ background: '#fff2', border: '1px solid #fff4', color: '#fff', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: 13 }}>Keluar</button>
        </div>
      </div>
      <div style={{ display: 'flex', padding: '0 16px' }}>
        {tabs.map(([k, icon, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '10px 20px', border: 'none', background: 'transparent',
            color: tab === k ? '#fff' : '#c4b5fd', fontWeight: 700, fontSize: 14,
            borderBottom: tab === k ? '3px solid #fff' : '3px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'color 0.2s',
          }}>
            {icon} {label}
          </button>
        ))}
      </div>
    </header>
  );
}
