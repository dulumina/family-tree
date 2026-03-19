import { useState, useEffect, useRef } from 'react';
import { membersApi } from '../../api';

const PHOTOS = ['👴','👵','👨','👩','🧑','👧','👦','🧓','👶','🧔'];

function SearchSelect({ label, placeholder, initialIds, single, members, onSelect, excludeId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!open) return;
      setLoading(true);
      try {
        const { data } = await membersApi.getAll(query);
        setResults(data.filter(m => m.id !== excludeId));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query, open, excludeId]);

  useEffect(() => {
    const clickOut = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const selectedMembers = initialIds.map(id => members.find(m => m.id === id)).filter(Boolean);

  const toggle = (m) => {
    if (single) {
      onSelect(m.id === initialIds[0] ? [] : [m.id]);
      setOpen(false);
      setQuery('');
    } else {
      const isSelected = initialIds.includes(m.id);
      onSelect(isSelected ? initialIds.filter(id => id !== m.id) : [...initialIds, m.id]);
    }
  };

  return (
    <div style={{ marginBottom: 12, position: 'relative' }} ref={containerRef}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '7px 10px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff' }} onClick={() => setOpen(true)}>
        {selectedMembers.map(m => (
          <div key={m.id} style={{ background: '#eef2ff', color: '#6366f1', padding: '2px 8px', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            {m.photo} {m.name}
            <span style={{ cursor: 'pointer', fontSize: 14 }} onClick={(e) => { e.stopPropagation(); toggle(m); }}>×</span>
          </div>
        ))}
        <input value={query} onChange={e => {setQuery(e.target.value); setOpen(true);}} placeholder={selectedMembers.length ? '' : placeholder}
          style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 100, fontSize: 14 }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px #0002' }}>
          {loading && <div style={{ padding: 10, fontSize: 12, color: '#64748b' }}>Mencari...</div>}
          {!loading && results.length === 0 && <div style={{ padding: 10, fontSize: 12, color: '#64748b' }}>Tidak ditemukan</div>}
          {!loading && results.map(m => (
            <div key={m.id} onClick={() => toggle(m)}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, background: initialIds.includes(m.id) ? '#f1f5f9' : 'transparent' }}>
              <span style={{ fontSize: 18 }}>{m.photo}</span>
              <span>{m.name}</span>
              {initialIds.includes(m.id) && <span style={{ marginLeft: 'auto', color: '#6366f1' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MemberForm({ members, initial, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    name:'', gender:'male', born_year:'', died_year:'', photo:'🧑',
    notes:'', spouse_id:null, parentIds:[]
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

      <SearchSelect label="Orang Tua" placeholder="Cari orang tua..." initialIds={f.parentIds} members={members} excludeId={initial?.id}
        onSelect={ids => s('parentIds', ids)} />

      <SearchSelect label="Pasangan" placeholder="Cari pasangan..." initialIds={f.spouse_id?[f.spouse_id]:[]} single members={members} excludeId={initial?.id}
        onSelect={ids => s('spouse_id', ids[0]||null)} />

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
