import { useAuth } from '../../context/AuthContext';

export default function MemberList({ members, onEdit, onDelete }) {
  const { isAdmin, isEditor } = useAuth();
  const gens = [...new Set(members.map(m=>m.generation))].sort((a,b)=>a-b);
  const genLabel = g => ['Gen 1 — Kakek/Nenek','Gen 2 — Orang Tua','Gen 3 — Anak','Gen 4 — Cucu','Gen 5+'][g]??`Gen ${g+1}`;

  return (
    <div>
      {gens.map(g => (
        <div key={g} style={{ marginBottom:24 }}>
          <div style={{ fontWeight:700, color:'#6366f1', fontSize:15, marginBottom:10, padding:'6px 0', borderBottom:'2px solid #eef2ff' }}>{genLabel(g)}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
            {members.filter(m=>m.generation===g).map(m=>{
              const accent = m.gender==='male'?'#3b82f6':'#ec4899';
              return (
                <div key={m.id} style={{ background: m.gender==='male'?'#eff6ff':'#fdf2f8', border:`1.5px solid ${accent}30`, borderRadius:14, padding:14, display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ fontSize:34 }}>{m.photo}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{m.name}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{m.gender==='male'?'Laki-laki':'Perempuan'}</div>
                    <div style={{ fontSize:12, color:'#475569' }}>
                      Lahir: {m.born_year||'-'} {m.died_year?`| Wafat: ${m.died_year}`:''}
                    </div>
                    {m.notes&&<div style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic', marginTop:4 }}>{m.notes}</div>}
                  </div>
                  {(isAdmin||isEditor) && (
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      <button onClick={()=>onEdit(m)} style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#3b82f6', color:'#fff', fontSize:12, cursor:'pointer' }}>Edit</button>
                      {isAdmin&&<button onClick={()=>onDelete(m.id)} style={{ padding:'4px 10px', borderRadius:7, border:'none', background:'#ef4444', color:'#fff', fontSize:12, cursor:'pointer' }}>Hapus</button>}
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
