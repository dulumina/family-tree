import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import useMobile from '../../hooks/useMobile';

export default function MemberList({ members, onEdit, onDelete }) {
  const { isAdmin, isEditor } = useAuth();
  const isMobile = useMobile();
  const [showSpousesOf, setShowSpousesOf] = useState([]);

  // isBlood: true if this person should be the primary card (has parents or is primary in couple)
  const isBlood = (m) => {
    if (m.parentIds && m.parentIds.length > 0) return true;
    if (!m.spouse_id) return true;
    const spouse = members.find(s => s.id === m.spouse_id);
    if (!spouse) return true;
    if (spouse.parentIds && spouse.parentIds.length > 0) return false;
    return m.id <= spouse.id;
  };

  const filteredMembers = useMemo(() => {
    // Only show primary members at the grid level
    return members.filter(m => isBlood(m));
  }, [members, isBlood]);

  const gens = [...new Set(filteredMembers.map(m=>m.generation))].sort((a,b)=>a-b);
  const genLabel = g => `Generasi ${g+1}`;

  const toggleSpouse = id => setShowSpousesOf(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {gens.map(g => (
        <div key={g} style={{ marginBottom:28 }}>
          <div style={{ 
            fontWeight:800, color:'#6366f1', fontSize:13, letterSpacing:'0.05em', 
            textTransform:'uppercase', marginBottom:12, paddingBottom:6, 
            borderBottom:'2px solid #eef2ff', display:'flex', alignItems:'center', gap:10
          }}>
            <span style={{ background:'#eef2ff', padding:'2px 10px', borderRadius:6 }}>{genLabel(g)}</span>
            <div style={{ flex:1, height:1, background:'#f1f5f9' }}></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {filteredMembers.filter(m=>m.generation===g).map(m=>{
              const accent = m.gender==='male'?'#3b82f6':'#ec4899';
              // Find all spouses (handle multiple spouses if any)
              const spouses = members.filter(s => s.spouse_id === m.id || m.spouse_id === s.id);
              const showingSpouse = showSpousesOf.includes(m.id);

              return (
                <div key={m.id} style={{
                  background: '#fff',
                  border: `1.5px solid ${showingSpouse ? accent : '#e2e8f0'}`,
                  borderRadius:12, padding:10, display:'flex', flexDirection:'column', gap:8,
                  boxShadow: showingSpouse ? `0 8px 20px ${accent}15` : '0 2px 4px #00000005',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}>
                  {/* Primary Member Info */}
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ 
                      fontSize:28, background: m.gender==='male'?'#eff6ff':'#fdf2f8', 
                      width:44, height:44, display:'flex', alignItems:'center', 
                      justifyContent:'center', borderRadius:10, border:`1px solid ${accent}20`
                    }}>
                      {m.photo}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                      <div style={{ fontSize:10, color:'#64748b' }}>
                        {m.gender==='male'?'Laki-laki':'Perempuan'} • {m.born_year||'-'}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {(isAdmin||isEditor) && (
                        <button onClick={()=>onEdit(m)} style={{ 
                          padding:'3px 6px', borderRadius:6, border:'none', 
                          background:'#f1f5f9', color:'#475569', fontSize:9, 
                          fontWeight:600, cursor:'pointer'
                        }}>Edit</button>
                      )}
                      {isAdmin && (
                        <button onClick={()=>onDelete(m.id)} style={{ 
                          padding:'2px 6px', borderRadius:6, border:'none', 
                          background:'#fef2f2', color:'#ef4444', fontSize:9, 
                          fontWeight:600, cursor:'pointer'
                        }}>Hapus</button>
                      )}
                    </div>
                  </div>

                  {/* Toggle Spouse Button */}
                  {spouses.length > 0 && (
                    <button onClick={()=>toggleSpouse(m.id)} style={{ 
                      width:'100%', padding:'6px', borderRadius:8, border:'none', 
                      background: showingSpouse ? accent : '#f8fafc', 
                      color: showingSpouse ? '#fff' : accent, 
                      fontSize:10, fontWeight:700, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:4
                    }}>
                      {showingSpouse ? '▲ Tutup Pasangan' : `▼ Tampilkan Pasangan (${spouses.length})`}
                    </button>
                  )}

                  {/* Spouses Integrated in same card */}
                  {showingSpouse && (
                    <div style={{ 
                      marginTop: 2, padding: '8px 0 0 0', 
                      borderTop: `1px dashed ${accent}30`,
                      display:'flex', flexDirection:'column', gap:6
                    }}>
                      {spouses.map(s => {
                        const sAccent = s.gender==='male'?'#3b82f6':'#ec4899';
                        return (
                          <div key={s.id} style={{ 
                            display:'flex', gap:8, alignItems:'center', 
                            padding:6, background:s.gender==='male'?'#f8fafc':'#fffafb', 
                            borderRadius:8, border:`1px solid ${sAccent}10`
                          }}>
                            <div style={{ fontSize:22 }}>{s.photo}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:600, fontSize:11, color:'#334155', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                <span style={{ fontSize:8, background:sAccent, color:'#fff', padding:'1px 3px', borderRadius:4, marginRight:4, verticalAlign:'middle' }}>Pasangan</span>
                                {s.name}
                              </div>
                              <div style={{ fontSize:9, color:'#94a3b8' }}>{s.gender==='male'?'Laki-laki':'Perempuan'} • {s.born_year||'-'}</div>
                            </div>
                            <div style={{ display:'flex', gap:4 }}>
                              {(isAdmin||isEditor) && (
                                <button onClick={()=>onEdit(s)} style={{ border:'none', background:'none', color:'#94a3b8', cursor:'pointer', fontSize:10 }} title="Edit">✎</button>
                              )}
                              {isAdmin && (
                                <button onClick={()=>onDelete(s.id)} style={{ border:'none', background:'none', color:'#fda4af', cursor:'pointer', fontSize:12 }} title="Hapus">×</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

