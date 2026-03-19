import { useState, useEffect, useCallback } from 'react';
import { membersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/UI/Navbar';
import Modal from '../components/UI/Modal';
import TreeView from '../components/Tree/TreeView';
import MemberList from '../components/Members/MemberList';
import MemberForm from '../components/Members/MemberForm';
import UserManage from '../components/Admin/UserManage';
import { useToast } from '../components/UI/Toast';

const genLabel = g => ['G1 Kakek/Nenek','G2 Orang Tua','G3 Anak','G4 Cucu','G5+'][g]??`G${g+1}`;

export default function AppPage() {
  const [tab, setTab] = useState('tree');
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [visGens, setVisGens] = useState([0,1,2,3,4]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const { isAdmin, isEditor } = useAuth();
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { data } = await membersApi.getAll();
    setMembers(data);
    const allGens = [...new Set(data.map(m=>m.generation))];
    setVisGens(allGens);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const maxGen = Math.max(...members.map(m=>m.generation), 0);
  const allGens = Array.from({length:maxGen+1},(_,i)=>i);

  const filtered = members.filter(m =>
    visGens.includes(m.generation) &&
    (!search || m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async f => {
    try {
      if (editTarget) { await membersApi.update(editTarget.id, f); toast('✅ Anggota diperbarui!'); }
      else { await membersApi.create(f); toast('✅ Anggota baru ditambahkan!'); }
      setShowForm(false); setEditTarget(null); load();
    } catch(e) { toast('❌ '+( e.response?.data?.error||'Gagal menyimpan')); }
  };

  const handleDelete = async id => {
    if (!confirm('Yakin hapus anggota ini?')) return;
    await membersApi.remove(id);
    toast('🗑 Anggota dihapus'); setSelected(null); load();
  };

  const toggleGen = g => setVisGens(gs => gs.includes(g)?gs.filter(x=>x!==g):[...gs,g]);

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', display:'flex', flexDirection:'column' }}>
      <Navbar tab={tab} setTab={setTab} />

      {/* Toolbar */}
      <div style={{ background:'#fff', padding:'10px 20px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', borderBottom:'1px solid #f1f5f9', boxShadow:'0 1px 4px #0001' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari anggota keluarga..."
            style={{ width:'100%', padding:'8px 12px 8px 34px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#64748b' }}>Lapisan:</span>
          {allGens.map(g=>(
            <button key={g} onClick={()=>toggleGen(g)}
              style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid #6366f1',
                background: visGens.includes(g)?'#6366f1':'transparent',
                color: visGens.includes(g)?'#fff':'#6366f1',
                fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {genLabel(g)}
            </button>
          ))}
        </div>
        {isEditor && (
          <button onClick={()=>{setEditTarget(null);setShowForm(true);}}
            style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            + Tambah Anggota
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:20, overflow:'auto' }}>
        {tab==='tree' && (
          <div style={{ display:'flex', gap:16, height:'calc(100vh - 200px)' }}>
            <div style={{ flex:1, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 20px #0001', border:'1px solid #e2e8f0' }}>
              <TreeView members={filtered} selected={selected} onSelect={setSelected} />
            </div>
            {selected && (
              <div style={{ width:260, background:'#fff', borderRadius:16, padding:20, boxShadow:'0 4px 20px #0001', border:'1px solid #e2e8f0', overflowY:'auto' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <span style={{ fontWeight:700, color:'#1e293b' }}>Detail</span>
                  <button onClick={()=>setSelected(null)} style={{ border:'none', background:'#f1f5f9', borderRadius:6, width:24, height:24, cursor:'pointer' }}>×</button>
                </div>
                <div style={{ textAlign:'center', marginBottom:14 }}>
                  <div style={{ fontSize:52 }}>{selected.photo}</div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{genLabel(selected.generation)}</div>
                </div>
                {[['⚧️ Gender', selected.gender==='male'?'Laki-laki':'Perempuan'],
                  ['🎂 Lahir', selected.born_year||'-'],
                  ['✝️ Wafat', selected.died_year||'Masih hidup'],
                  ['🔗 Orang Tua', (selected.parentIds||[]).map(pid=>members.find(m=>m.id===pid)?.name).filter(Boolean).join(', ')||'-'],
                  ['💑 Pasangan', members.find(m=>m.id===selected.spouse_id)?.name||'-']
                ].map(([lbl,val])=>(
                  <div key={lbl} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                    <span style={{ color:'#64748b' }}>{lbl}</span>
                    <span style={{ color:'#1e293b', fontWeight:500, textAlign:'right', maxWidth:140 }}>{val}</span>
                  </div>
                ))}
                {selected.notes && <div style={{ marginTop:10, padding:10, background:'#f8fafc', borderRadius:8, fontSize:12, color:'#64748b', fontStyle:'italic' }}>{selected.notes}</div>}
                {(isAdmin||isEditor) && (
                  <div style={{ display:'flex', gap:8, marginTop:14 }}>
                    <button onClick={()=>{setEditTarget(selected);setShowForm(true);}}
                      style={{ flex:1, padding:'8px', borderRadius:9, border:'none', background:'#6366f1', color:'#fff', fontWeight:600, cursor:'pointer' }}>Edit</button>
                    {isAdmin && <button onClick={()=>handleDelete(selected.id)}
                      style={{ flex:1, padding:'8px', borderRadius:9, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, cursor:'pointer' }}>Hapus</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab==='list' && (
          <MemberList members={filtered} onEdit={m=>{setEditTarget(m);setShowForm(true);}} onDelete={handleDelete} />
        )}

        {tab==='admin' && isAdmin && <UserManage />}
      </div>

      {showForm && (
        <Modal title={editTarget?'✏️ Edit Anggota':'➕ Tambah Anggota'} onClose={()=>{setShowForm(false);setEditTarget(null);}}>
          <MemberForm members={members} initial={editTarget} onSave={handleSave} onClose={()=>{setShowForm(false);setEditTarget(null);}} />
        </Modal>
      )}
    </div>
  );
}
