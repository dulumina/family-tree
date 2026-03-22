import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MemberList({ members, onEdit, onDelete }) {
  const { isAdmin, isEditor } = useAuth();
  const [showSpousesOf, setShowSpousesOf] = useState([]);

  const isBlood = (m) => {
    if (m.parentIds.length > 0) return true;
    if (!m.spouse_id) return true;
    const spouse = members.find(s => s.id === m.spouse_id);
    if (!spouse) return true;
    if (spouse.parentIds.length > 0) return false;
    return m.id <= spouse.id;
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (isBlood(m)) return true;
      const spouseId = m.spouse_id;
      return spouseId && showSpousesOf.includes(spouseId);
    });
  }, [members, showSpousesOf]);

  const gens = [...new Set(filteredMembers.map(m=>m.generation))].sort((a,b)=>a-b);
  const genLabel = g => `Generasi ${g+1}`;

  const toggleSpouse = id => setShowSpousesOf(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  return (
    <div>
      {gens.map(g => (
        <div key={g} style={{ marginBottom:24 }}>
          <div style={{ fontWeight:700, color:'#6366f1', fontSize:15, marginBottom:10, padding:'6px 0', borderBottom:'2px solid #eef2ff' }}>{genLabel(g)}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:10 }}>
            {filteredMembers.filter(m=>m.generation===g).map(m=>{
              const blood = isBlood(m);
              const accent = m.gender==='male'?'#3b82f6':'#ec4899';
              const hasSpouse = members.some(x => x.spouse_id === m.id || m.spouse_id === x.id);
              return (
                <div key={m.id} style={{
                  background: m.gender==='male'?'#eff6ff':'#fdf2f8',
                  border: blood ? `1.5px solid ${accent}` : `1.5px dashed ${accent}80`,
                  borderRadius:14, padding:14, display:'flex', gap:12, alignItems:'flex-start',
                  boxShadow: blood ? '0 2px 4px #0001' : 'none',
                  opacity: blood ? 1 : 0.9,
                  marginLeft: blood ? 0 : 20
                }}>
                  <div style={{ fontSize:34 }}>{m.photo}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>
                      {!blood && <span style={{ fontSize:10, background:accent, color:'#fff', padding:'1px 4px', borderRadius:4, marginRight:4, verticalAlign:'middle' }}>Pasangan</span>}
                      {m.name}
                    </div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{m.gender==='male'?'Laki-laki':'Perempuan'}</div>
                    <div style={{ fontSize:12, color:'#475569' }}>
                      Lahir: {m.born_year||'-'} {m.died_year?`| Wafat: ${m.died_year}`:''}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {blood && hasSpouse && (
                      <button onClick={()=>toggleSpouse(m.id)} style={{ padding:'4px 10px', borderRadius:7, border:`1px solid ${accent}`, background: showSpousesOf.includes(m.id)?accent:'transparent', color: showSpousesOf.includes(m.id)?'#fff':accent, fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        {showSpousesOf.includes(m.id) ? 'Tutup' : 'Pasangan'}
                      </button>
                    )}
                    {(isAdmin||isEditor) && (
                      <>
                        <button onClick={()=>onEdit(m)} style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#94a3b8', color:'#fff', fontSize:11, cursor:'pointer' }}>Edit</button>
                        {isAdmin&&<button onClick={()=>onDelete(m.id)} style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#ef444430', color:'#ef4444', fontSize:11, cursor:'pointer' }}>Hapus</button>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
