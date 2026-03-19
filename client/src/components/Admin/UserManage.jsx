import { useState, useEffect } from 'react';
import { usersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../UI/Toast';
import { SearchSelect } from '../Members/MemberForm';

export default function UserManage({ members }) {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'viewer', member_id:null });
  const { user: me } = useAuth();
  const { toast } = useToast();

  const load = async () => { const {data}=await usersApi.getAll(); setUsers(data); };
  useEffect(()=>{ load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await usersApi.create(form);
      setForm({ name:'', email:'', password:'', role:'viewer', member_id:null });
      setShowAdd(false);
      toast('✅ Pengguna baru ditambahkan!');
      load();
    } catch(err) {
      toast('❌ ' + (err.response?.data?.error || 'Gagal menambahkan'));
    }
  };

  const updateUser = async (id, data) => {
    await usersApi.update(id, data);
    toast('✅ Data pengguna berhasil diperbarui');
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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ margin:0, color:'#1e293b' }}>⚙️ Manajemen Pengguna</h3>
        <button onClick={() => setShowAdd(!showAdd)} 
          style={{ padding:'8px 20px', borderRadius:10, border:'none', background:showAdd?'#64748b':'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, cursor:'pointer' }}>
          {showAdd ? 'Batal' : '+ Tambah Pengguna'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background:'#fff', padding:20, borderRadius:16, border:'1.5px solid #e2e8f0', marginBottom:20, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, boxShadow:'0 4px 15px #0001', alignItems:'end' }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, marginBottom:4, color:'#475569' }}>Nama Lengkap</label>
            <input required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{ width:'100%', padding:8, borderRadius:8, border:'1px solid #e2e8f0' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, marginBottom:4, color:'#475569' }}>Email</label>
            <input required type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={{ width:'100%', padding:8, borderRadius:8, border:'1px solid #e2e8f0' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, marginBottom:4, color:'#475569' }}>Password</label>
            <input required type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} style={{ width:'100%', padding:8, borderRadius:8, border:'1px solid #e2e8f0' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, marginBottom:4, color:'#475569' }}>Role</label>
            <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{ width:'100%', padding:8, borderRadius:8, border:'1px solid #e2e8f0' }}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ transform:'translateY(-12px)' }}>
            <SearchSelect label="Hubungkan Anggota" placeholder="Pilih anggota..." members={members} initialIds={form.member_id ? [form.member_id] : []} single onSelect={ids => setForm(p=>({...p,member_id:ids[0]||null}))} />
          </div>
          <button type="submit" style={{ padding:'10px', borderRadius:8, border:'none', background:'#10b981', color:'#fff', fontWeight:800, cursor:'pointer' }}>SIMPAN PENGGUNA</button>
        </form>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {users.map(u => (
          <div key={u.id} style={{ background:'#fff', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 2px 8px #0001', border:'1px solid #e2e8f0' }}>
            <div style={{ fontSize:30 }}>👤</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'#1e293b' }}>{u.name}</div>
              <div style={{ fontSize:13, color:'#64748b' }}>{u.email}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>
                🔗 {u.member_name ? `Terhubung: ${u.member_name}` : 'Tidak terhubung ke profil'}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <SearchSelect members={members} initialIds={u.member_id ? [u.member_id] : []} single onSelect={ids => updateUser(u.id, { member_id: ids[0]||null })} placeholder="Pilih anggota..." />
              <select value={u.role} disabled={u.id===me.id}
                onChange={e=>updateUser(u.id, { role: e.target.value })}
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
          </div>
        ))}
      </div>
    </div>
  );
}
