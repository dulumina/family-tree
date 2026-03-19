import { useState } from 'react';

const PHOTOS = ['👴','👵','👨','👩','🧑','👧','👦','🧓','👶','🧔'];

export default function MemberForm({ members, initial, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    name:'', gender:'male', born_year:'', died_year:'', photo:'🧑',
    generation:0, notes:'', spouse_id:'', parentIds:[]
  });
  const s = (k,v) => setF(p=>({...p,[k]:v}));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Photo picker */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {PHOTOS.map(p => (
          <button key={p} onClick={()=>s('photo',p)}
            style={{ fontSize:22, padding:6, borderRadius:8, border: f.photo===p?'2px solid #6366f1':'2px solid #e2e8f0', background: f.photo===p?'#eef2ff':'transparent', cursor:'pointer' }}>{p}</button>
        ))}
      </div>

      {[['Nama Lengkap *','name','text'],['Tahun Lahir','born_year','text'],['Tahun Wafat','died_year','text']].map(([lbl,key,type])=>(
        <div key={key} style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>{lbl}</label>
          <input type={type} value={f[key]||''} onChange={e=>s(key,e.target.value)}
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
        </div>
      ))}

      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Jenis Kelamin</label>
        <select value={f.gender} onChange={e=>s('gender', e.target.value)}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14 }}>
          <option value="male">Laki-laki</option>
          <option value="female">Perempuan</option>
        </select>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Orang Tua</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {members.filter(m=>m.id!==initial?.id).map(m=>(
            <label key={m.id} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, cursor:'pointer',
              background: f.parentIds.includes(m.id)?'#eef2ff':'#f8fafc',
              padding:'4px 8px', borderRadius:8, border:`1px solid ${f.parentIds.includes(m.id)?'#6366f1':'#e2e8f0'}` }}>
              <input type="checkbox" checked={f.parentIds.includes(m.id)}
                onChange={e=>s('parentIds', e.target.checked?[...f.parentIds,m.id]:f.parentIds.filter(x=>x!==m.id))} />
              {m.photo} {m.name}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Pasangan</label>
        <select value={f.spouse_id||''} onChange={e=>s('spouse_id',e.target.value||null)}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14 }}>
          <option value=''>— Tidak ada —</option>
          {members.filter(m=>m.id!==initial?.id).map(m=>(
            <option key={m.id} value={m.id}>{m.photo} {m.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Catatan</label>
        <textarea value={f.notes||''} onChange={e=>s('notes',e.target.value)} rows={2}
          style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, resize:'vertical', boxSizing:'border-box' }} />
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ padding:'9px 20px', borderRadius:10, border:'2px solid #6366f1', background:'transparent', color:'#6366f1', fontWeight:600, cursor:'pointer' }}>Batal</button>
        <button onClick={()=>f.name&&onSave(f)}
          style={{ padding:'9px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, cursor:'pointer' }}>
          Simpan
        </button>
      </div>
    </div>
  );
}
