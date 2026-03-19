import { useState, useEffect } from 'react';
import { usersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../UI/Toast';

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const { user: me } = useAuth();
  const { toast } = useToast();

  const load = async () => { const {data}=await usersApi.getAll(); setUsers(data); };
  useEffect(()=>{ load(); }, []);

  const changeRole = async (id, role) => {
    await usersApi.setRole(id, role);
    toast('✅ Role berhasil diubah');
    load();
  };
  const delUser = async id => {
    if (!confirm('Yakin hapus pengguna ini?')) return;
    await usersApi.remove(id);
    toast('🗑 Pengguna dihapus');
    load();
  };

  return (
    <div>
      <h3 style={{ margin:'0 0 16px', color:'#1e293b' }}>⚙️ Manajemen Pengguna</h3>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {users.map(u => (
          <div key={u.id} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px #0001', border:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:30 }}>👤</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#1e293b' }}>{u.name}</div>
              <div style={{ fontSize:13, color:'#64748b' }}>{u.email}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>Bergabung: {new Date(u.created_at).toLocaleDateString('id-ID')}</div>
            </div>
            <select value={u.role} disabled={u.id===me.id}
              onChange={e=>changeRole(u.id,e.target.value)}
              style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:13, fontWeight:600,
                color: u.role==='admin'?'#7c3aed':u.role==='editor'?'#0284c7':'#64748b' }}>
              <option value="viewer">👁 Penonton</option>
              <option value="editor">✏️ Editor</option>
              <option value="admin">👑 Admin</option>
            </select>
            {u.id!==me.id && (
              <button onClick={()=>delUser(u.id)}
                style={{ padding:'6px 12px', borderRadius:8, border:'none', background:'#fee2e2', color:'#ef4444', fontWeight:600, cursor:'pointer', fontSize:13 }}>
                Hapus
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
