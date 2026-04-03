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
import FeedbackManage from '../components/Admin/FeedbackManage';
import MahromPanel from '../components/Members/MahromPanel';
import FeedbackModal from '../components/UI/FeedbackModal';
import EventsPanel from '../components/Tree/EventsPanel';
import { useToast } from '../components/UI/Toast';
import useMobile from '../hooks/useMobile';

const genLabel = g => `Generasi ${g+1}`;

export default function AppPage() {
  const [tab, setTab] = useState('tree');
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [focusMemberId, setFocusMemberId] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [detailTab, setDetailTab] = useState('info'); // 'info' | 'mahrom'
  const [activeFamilyIndex, setActiveFamilyIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMemberId, setFeedbackMemberId] = useState(null);
  const { isAdmin, isEditor } = useAuth();
  const { toast } = useToast();
  const isMobile = useMobile();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



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

  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    return members.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);
  }, [search, members]);

  const getDescendantsIds = useCallback((rootId) => {
    const result = new Set();
    const queue = [rootId];
    while (queue.length > 0) {
      const currId = queue.shift();
      if (result.has(currId)) continue;
      result.add(currId);
      const m = members.find(x => x.id === currId);
      if (m?.spouse_id) result.add(m.spouse_id);
      members.forEach(child => {
        if (child.parentIds?.includes(currId)) {
          queue.push(child.id);
        }
      });
    }
    return result;
  }, [members]);

  let filtered = members;
  if (focusMemberId) {
    const allowedIds = getDescendantsIds(focusMemberId);
    filtered = members.filter(m => allowedIds.has(m.id));
  } else {
    const familyMembers = families[activeFamilyIndex]?.members || [];
    const familyIds = new Set(familyMembers.map(m => m.id));
    filtered = members.filter(m => familyIds.has(m.id));
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
      <Navbar tab={tab} setTab={(k) => k === 'feedback_form' ? (setFeedbackMemberId(null), setShowFeedback(true)) : setTab(k)} />

      {/* Toolbar */}
      <div style={{ 
        background:'#fff', 
        padding: isMobile ? '6px 10px' : '10px 20px', 
        display:'flex', 
        gap: isMobile ? 6 : 12, 
        alignItems:'center', 
        flexWrap:'wrap', 
        borderBottom:'1px solid #f1f5f9', 
        boxShadow:'0 1px 4px #0001',
        position: 'sticky',
        top: isMobile ? 88 : 105, 
        zIndex: 105
      }}>
        {/* Row 1: Family & Actions */}
        <div style={{ display: 'flex', width: isMobile ? '100%' : 'auto', gap: 6, flex: isMobile ? 'none' : 'none', order: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <button onClick={() => {
                const d = document.getElementById('family-dropdown');
                d.style.display = d.style.display === 'none' ? 'block' : 'none';
              }}
              style={{ width: '100%', padding: isMobile ? '7px 10px' : '8px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:isMobile ? 12 : 13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent: 'space-between', gap:4 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👨‍👩‍👧‍👦 {families[activeFamilyIndex] ? (isMobile ? families[activeFamilyIndex].root.name : `Keluarga ${families[activeFamilyIndex].root.name}`) : 'Pilih'}</span>
              <span style={{ fontSize:10 }}>▼</span>
            </button>
            <div id="family-dropdown" style={{ display:'none', position:'absolute', top:'100%', left:0, right: 0, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, marginTop:8, padding:10, boxShadow:'0 10px 25px #0002', zIndex:1001, minWidth:200 }}>
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
              style={{ padding: isMobile ? '0 12px' : '8px 12px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontSize: isMobile ? 12 : 14 }}>
              {isMobile ? '+ Anggota' : '+ Tambah Anggota'}
            </button>
          )}

          {!isEditor && (
            <button onClick={() => { setFeedbackMemberId(null); setShowFeedback(true); }}
              style={{ width: isMobile ? 36 : 'auto', height: isMobile ? 36 : 'auto', padding: isMobile ? '0' : '8px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', color:'#6366f1', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent: 'center', gap:6 }}>
              <span>💡</span>
              {!isMobile && <span>Saran / Kritik</span>}
            </button>
          )}
        </div>

        {/* Row 2: Search */}
        <div className="search-container" style={{ position:'relative', flex: isMobile ? '1 1 100%' : 1, minWidth: isMobile ? '100%': 200, order: 2 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>🔍</span>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setShowSearchResults(true); }} placeholder={isMobile ? "Cari anggota..." : "Cari anggota keluarga..."}
            onFocus={() => setShowSearchResults(true)}
            style={{ width:'100%', padding: isMobile ? '7px 12px 7px 34px' : '8px 12px 8px 34px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box' }} />
          {showSearchResults && searchResults.length > 0 && (
            <div style={{ position:'absolute', top:'105%', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, boxShadow:'0 10px 25px #0002', zIndex:1000, overflow:'hidden' }}>
              {searchResults.map(m => (
                <div key={m.id} onClick={() => { setFocusMemberId(m.id); setSearch(''); setShowSearchResults(false); setSelected(m); }}
                  style={{ padding: isMobile ? '8px 12px' : '10px 14px', cursor:'pointer', fontSize:14, borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>{m.photo}</span>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    <span style={{ fontWeight:600, color:'#1e293b' }}>{m.name}</span>
                    <span style={{ fontSize:11, color:'#64748b' }}>{genLabel(m.generation)} • {m.born_year || '?'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding: tab==='tree' ? 0 : (isMobile ? 12 : 20), overflow: tab==='tree'?'hidden':'auto' }}>
        {tab==='tree' && (
          <div style={{ 
            position: 'relative',
            height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 165px)',
            background: '#fff',
            overflow: 'hidden',
          }}>
            <TreeView members={filtered} selected={selected} onSelect={setSelected} />
            
            {/* Floating Overlays */}
            {selected ? (
              <div style={{ 
                position: 'absolute',
                top: 12,
                right: 12,
                bottom: 12,
                width: isMobile ? 'calc(100% - 24px)' : 300, 
                background: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(8px)',
                borderRadius: 16, 
                boxShadow: '0 4px 25px rgba(0,0,0,0.15)', 
                border: '1.5px solid #e2e8f0', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                zIndex: 10
              }}>
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
                        ['📍 Lahir', selected.birth_place || selected.born_year || '-'],
                        ['📅 Tgl Lahir', selected.birth_date || '-'],
                        ['💀 Status', selected.is_alive === 0 ? 'Wafat' : 'Hidup'],
                        selected.is_alive === 0 && ['⚰️ Tgl Wafat', selected.death_date || selected.died_year || '-'],
                        selected.is_alive === 0 && ['🪦 Dimakamkan', selected.burial_place || '-'],
                        ['🔗 Orang Tua', (selected.parentIds||[]).map(pid=>members.find(m=>m.id===pid)?.name).filter(Boolean).join(', ')||'-'],
                        ['💑 Pasangan', members.find(m=>m.id===selected.spouse_id)?.name||'-']
                      ].filter(Boolean).map(([lbl,val])=>(
                        <div key={lbl} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                          <span style={{ color:'#64748b' }}>{lbl}</span>
                          <span style={{ color:'#1e293b', fontWeight:500, textAlign:'right', maxWidth:150 }}>{val}</span>
                        </div>
                      ))}
                      
                      {!isEditor && (
                        <div style={{ marginTop: 12, marginBottom: 12 }}>
                          <button onClick={() => { setFeedbackMemberId(selected.id); setShowFeedback(true); }}
                            style={{ width:'100%', padding:'6px', borderRadius:8, border:'1.5px dashed #cbd5e1', background:'transparent', color:'#64748b', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                            💡 Laporkan Koreksi Data
                          </button>
                        </div>
                      )}

                      {selected.notes && <div style={{ marginTop:10, padding:10, background:'#f8fafc', borderRadius:8, fontSize:12, color:'#64748b', fontStyle:'italic' }}>{selected.notes}</div>}
                      
                      <div style={{ marginTop: 14 }}>
                        <button onClick={() => setFocusMemberId(focusMemberId === selected.id ? null : selected.id)}
                          style={{ width:'100%', padding:'8px', borderRadius:9, border:'1.5px solid #6366f1', background: focusMemberId === selected.id ? '#6366f1' : 'transparent', color: focusMemberId === selected.id ? '#fff' : '#6366f1', fontWeight:600, cursor:'pointer' }}>
                          {focusMemberId === selected.id ? 'Tampilkan Semua Keluarga' : 'Fokus & Lihat Keturunan'}
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
            ) : (
              <div style={{ 
                position: 'absolute',
                bottom: 12,
                right: 12,
                width: isMobile ? 'calc(100% - 24px)' : 260,
                maxHeight: '40%',
                overflowY: 'auto',
                pointerEvents: 'auto',
                zIndex: 10
              }}>
                <EventsPanel members={members} />
              </div>
            )}
          </div>
        )}


        {tab==='list' && (
          <MemberList members={filtered} onEdit={m=>{setEditTarget(m);setShowForm(true);}} onDelete={handleDelete} />
        )}

        {tab==='admin' && isAdmin && <UserManage members={members} />}
        {tab==='data' && isAdmin && <DataManage members={members} />}
        {tab==='feedback' && isAdmin && <FeedbackManage />}
      </div>

      {showForm && (
        <Modal title={editTarget?'✏️ Edit Anggota':'➕ Tambah Anggota'} onClose={()=>{setShowForm(false);setEditTarget(null);}}>
          <MemberForm members={members} initial={editTarget} onSave={handleSave} onClose={()=>{setShowForm(false);setEditTarget(null);}} />
        </Modal>
      )}

      {showFeedback && (
        <FeedbackModal memberId={feedbackMemberId} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}
