import { useState, useEffect, useCallback, useMemo } from 'react';
import { membersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/UI/Navbar';
import Modal from '../components/UI/Modal';
import TreeView from '../components/Tree/TreeView';
import MemberList from '../components/Members/MemberList';
import MemberForm from '../components/Members/MemberForm';
import UserManage from '../components/Admin/UserManage';
import DataManage from '../components/Admin/DataManage';
import MahromPanel from '../components/Members/MahromPanel';
import { useToast } from '../components/UI/Toast';

const genLabel = g => `Generasi ${g+1}`;

export default function AppPage() {
  const [tab, setTab] = useState('tree');
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [focusMemberId, setFocusMemberId] = useState(null);
  const [detailTab, setDetailTab] = useState('info'); // 'info' | 'mahrom'
  const [activeFamilyIndex, setActiveFamilyIndex] = useState(0);
  const { isAdmin, isEditor } = useAuth();
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { data } = await membersApi.getAll();
    const computed = (function calc(mems) {
      const map = {};
      mems.forEach(m => map[m.id] = { ...m, _gen: -1 });
      const getG = id => {
        const m = map[id]; if(!m) return 0;
        if(m._gen !== -1) return m._gen;
        const pids = m.parentIds || [];
        m._gen = pids.length ? Math.max(...pids.map(getG)) + 1 : 0;
        return m._gen;
      };
      mems.forEach(m => getG(m.id));
      for(let i=0; i<3; i++) mems.forEach(m => {
        if(m.spouse_id && map[m.spouse_id]) {
          const s = map[m.spouse_id];
          const mx = Math.max(map[m.id]._gen, map[s.id]._gen);
          map[m.id]._gen = map[s.id]._gen = mx;
        }
      });
      return mems.map(m => ({ ...m, generation: map[m.id]._gen }));
    })(data);
    setMembers(computed);
  }, []);

  useEffect(()=>{ load(); }, [load]);



  const families = useMemo(() => {
    if (!members || members.length === 0) return [];
    const allIds = new Set(members.map(m => m.id));
    const roots = members.filter(m =>
      m.gender === 'male' &&
      (!m.parentIds || m.parentIds.length === 0 || m.parentIds.every(pid => !allIds.has(pid)))
    );
    if (roots.length === 0) return [{ root: { name: 'Semua' }, members }];
    const getBloodlineIds = (rootId) => {
      const result = new Set([rootId]);
      const queue = [rootId];
      while (queue.length > 0) {
        const curr = queue.shift();
        members.forEach(m => {
          if (!result.has(m.id) && m.parentIds && m.parentIds.includes(curr)) {
            result.add(m.id);
            queue.push(m.id);
          }
        });
      }
      return result;
    };
    const result = roots.map(root => {
      const bloodlineIds = getBloodlineIds(root.id);
      const familyIds = new Set(bloodlineIds);
      bloodlineIds.forEach(id => {
        const m = members.find(x => x.id === id);
        if (m?.spouse_id && allIds.has(m.spouse_id)) familyIds.add(m.spouse_id);
      });
      return { root, members: members.filter(m => familyIds.has(m.id)) };
    });
    result.sort((a, b) => b.members.length - a.members.length);
    return result;
  }, [members]);

  // Adjust active index if it goes out of bounds
  useEffect(() => {
    if (activeFamilyIndex >= families.length && families.length > 0) {
      setActiveFamilyIndex(0);
    }
  }, [families.length, activeFamilyIndex]);

  // Auto-switch family if `selected` changes and it belongs to a different family
  useEffect(() => {
    if (selected && families.length > 0) {
      const famIndex = families.findIndex(fam => fam.members.some(m => m.id === selected.id));
      if (famIndex !== -1 && famIndex !== activeFamilyIndex) {
        setActiveFamilyIndex(famIndex);
      }
    }
  }, [selected, families, activeFamilyIndex]);

  let filtered = members;
  if (focusMemberId) {
    const _focus = members.find(m => m.id === focusMemberId);
    if (_focus) {
      const parentIds = _focus.parentIds || [];
      const spouseId = _focus.spouse_id;
      const childrenIds = members.filter(m => m.parentIds?.includes(focusMemberId) || (spouseId && m.parentIds?.includes(spouseId))).map(m => m.id);
      const allowedIds = new Set([focusMemberId, ...parentIds, ...childrenIds]);
      if (spouseId) allowedIds.add(spouseId);
      filtered = members.filter(m => allowedIds.has(m.id));
    } else {
      setFocusMemberId(null);
    }
  } else {
    const familyMembers = families[activeFamilyIndex]?.members || [];
    const familyIds = new Set(familyMembers.map(m => m.id));
    
    filtered = members.filter(m =>
      familyIds.has(m.id) &&
      (!search || m.name.toLowerCase().includes(search.toLowerCase()))
    );
  }

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



  return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff', display:'flex', flexDirection:'column' }}>
      <Navbar tab={tab} setTab={setTab} />

      {/* Toolbar */}
      <div style={{ background:'#fff', padding:'10px 20px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', borderBottom:'1px solid #f1f5f9', boxShadow:'0 1px 4px #0001' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari anggota keluarga..."
            style={{ width:'100%', padding:'8px 12px 8px 34px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => {
              const d = document.getElementById('family-dropdown');
              d.style.display = d.style.display === 'none' ? 'block' : 'none';
            }}
            style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            <span>👨‍👩‍👧‍👦 {families[activeFamilyIndex] ? `Keluarga ${families[activeFamilyIndex].root.name}` : 'Pilih Keluarga'}</span>
            <span style={{ fontSize:10 }}>▼</span>
          </button>
          <div id="family-dropdown" style={{ display:'none', position:'absolute', top:'100%', left:0, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, marginTop:8, padding:10, boxShadow:'0 10px 25px #0002', zIndex:101, minWidth:200 }}>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {families.map((fam, idx) => (
                <div key={idx} onClick={() => { setActiveFamilyIndex(idx); document.getElementById('family-dropdown').style.display = 'none'; }}
                  style={{ padding:'8px 12px', borderRadius:8, cursor:'pointer', fontSize:13, background: activeFamilyIndex === idx ? '#f5f3ff' : 'transparent', color: activeFamilyIndex === idx ? '#6366f1' : '#475569', fontWeight: activeFamilyIndex === idx ? 600 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Keluarga {fam.root.name}</span>
                  <span style={{ fontSize:11, opacity:0.7 }}>({fam.members.length})</span>
                </div>
              ))}
            </div>
          </div>
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
              <div style={{ width:280, background:'#fff', borderRadius:16, boxShadow:'0 4px 20px #0001', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                {/* Header */}
                <div style={{ padding:'14px 16px 0', flexShrink:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontWeight:700, color:'#1e293b', fontSize:14 }}>{selected.name}</span>
                    <button onClick={()=>{ setSelected(null); setDetailTab('info'); }} style={{ border:'none', background:'#f1f5f9', borderRadius:6, width:24, height:24, cursor:'pointer', fontSize:14 }}>×</button>
                  </div>
                  {/* Tab switcher */}
                  <div style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:10, padding:3, marginBottom:12 }}>
                    {[['info','📋 Detail'],['mahrom','☪️ Mahrom']].map(([key, label]) => (
                      <button key={key} onClick={() => setDetailTab(key)}
                        style={{ flex:1, padding:'6px 4px', borderRadius:8, border:'none', fontSize:12, fontWeight:600,
                          background: detailTab === key ? '#fff' : 'transparent',
                          color: detailTab === key ? '#4f46e5' : '#64748b',
                          cursor:'pointer', boxShadow: detailTab === key ? '0 1px 4px #0002' : 'none',
                          transition:'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrollable content */}
                <div style={{ overflowY:'auto', flex:1, padding:'0 16px 16px' }}>
                  {detailTab === 'info' && (
                    <>
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
                          <span style={{ color:'#1e293b', fontWeight:500, textAlign:'right', maxWidth:150 }}>{val}</span>
                        </div>
                      ))}
                      {selected.notes && <div style={{ marginTop:10, padding:10, background:'#f8fafc', borderRadius:8, fontSize:12, color:'#64748b', fontStyle:'italic' }}>{selected.notes}</div>}
                      
                      <div style={{ marginTop: 14 }}>
                        <button onClick={() => setFocusMemberId(focusMemberId === selected.id ? null : selected.id)}
                          style={{ width:'100%', padding:'8px', borderRadius:9, border:'1.5px solid #6366f1', background: focusMemberId === selected.id ? '#6366f1' : 'transparent', color: focusMemberId === selected.id ? '#fff' : '#6366f1', fontWeight:600, cursor:'pointer' }}>
                          {focusMemberId === selected.id ? 'Tampilkan Semua Keluarga' : 'Tampilkan Keluarga Kecil'}
                        </button>
                      </div>

                      {(isAdmin||isEditor) && (
                        <div style={{ display:'flex', gap:8, marginTop:8 }}>
                          <button onClick={()=>{setEditTarget(selected);setShowForm(true);}}
                            style={{ flex:1, padding:'8px', borderRadius:9, border:'none', background:'#6366f1', color:'#fff', fontWeight:600, cursor:'pointer' }}>Edit</button>
                          {isAdmin && <button onClick={()=>handleDelete(selected.id)}
                            style={{ flex:1, padding:'8px', borderRadius:9, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, cursor:'pointer' }}>Hapus</button>}
                        </div>
                      )}
                    </>
                  )}

                  {detailTab === 'mahrom' && (
                    <MahromPanel person={selected} allMembers={members} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='list' && (
          <MemberList members={filtered} onEdit={m=>{setEditTarget(m);setShowForm(true);}} onDelete={handleDelete} />
        )}

        {tab==='admin' && isAdmin && <UserManage members={members} />}
        {tab==='data' && isAdmin && <DataManage members={members} />}
      </div>

      {showForm && (
        <Modal title={editTarget?'✏️ Edit Anggota':'➕ Tambah Anggota'} onClose={()=>{setShowForm(false);setEditTarget(null);}}>
          <MemberForm members={members} initial={editTarget} onSave={handleSave} onClose={()=>{setShowForm(false);setEditTarget(null);}} />
        </Modal>
      )}
    </div>
  );
}
