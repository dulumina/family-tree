import { useState, useEffect, useRef } from 'react';
import { membersApi } from '../../api';
import { getMahromStatus } from '../../utils/mahromUtils';
import useMobile from '../../hooks/useMobile';

export function SearchSelect({ label, placeholder, initialIds, single, members, onSelect, excludeId }) {
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
        let filtered = data.filter(m => m.id !== excludeId);
        
        // Custom filter for spouse or other logic
        if (label === 'Pasangan' && members && excludeId) {
          const currentPerson = members.find(m => m.id === excludeId);
          if (currentPerson) {
            filtered = filtered.filter(m => {
              if (m.gender === currentPerson.gender) return false;
              const status = getMahromStatus(currentPerson, m, members);
              return !status || status.isMahrom !== true;
            });
          }
        }
        
        setResults(filtered);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query, open, excludeId, label, members]);

  useEffect(() => {
    const clickOut = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const selectedMembers = initialIds.map(id => members.find(m => m.id === id)).filter(Boolean);

  const toggle = (m) => {
    if (single) {
      onSelect(m.id === initialIds[0] ? [] : [m.id]);
      setOpen(false); setQuery('');
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
  const isMobile = useMobile();
  const [f, setF] = useState({
    name:'', gender:'male', born_year:'', died_year:'', photo:'🧑',
    notes:'', spouse_id:null, parentIds:[],
    birth_place:'', birth_date:'', is_alive:1, death_date:'', burial_place:'',
    ...initial
  });
  const s = (k,v) => setF(p=>({...p,[k]:v}));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, maxHeight: isMobile ? '70vh' : '80vh', overflowY: 'auto', paddingRight: 4 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: 'span 2', marginBottom: 12 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Nama Lengkap *</label>
          <input type="text" value={f.name||''} onChange={e=>s('name', e.target.value.replace(/\b\w/g, c => c.toUpperCase()))}
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
        </div>
        
        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Tempat Lahir</label>
          <input type="text" value={f.birth_place||''} onChange={e=>s('birth_place', e.target.value.replace(/\b\w/g, c => c.toUpperCase()))}
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:4 }}>Tanggal Lahir</label>
          <input type="date" value={f.birth_date||''} onChange={e=>s('birth_date',e.target.value)}
            style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
        </div>
      </div>

      <div style={{ marginBottom:12, display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
        <input type="checkbox" id="is_alive" checked={f.is_alive === 1} onChange={e=>s('is_alive', e.target.checked ? 1 : 0)} 
          style={{ width: 18, height: 18, cursor: 'pointer' }} />
        <label htmlFor="is_alive" style={{ fontSize: 14, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Masih Hidup</label>
      </div>

      {f.is_alive === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12, padding: 12, background: '#fff1f2', borderRadius: 12, border: '1.5px solid #fecaca' }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#991b1b', marginBottom:4 }}>Tanggal Wafat</label>
            <input type="date" value={f.death_date||''} onChange={e=>s('death_date',e.target.value)}
              style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #fca5a5', fontSize:13 }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#991b1b', marginBottom:4 }}>Tempat Dimakamkan</label>
            <input type="text" value={f.burial_place||''} onChange={e=>s('burial_place', e.target.value.replace(/\b\w/g, c => c.toUpperCase()))}
              style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1.5px solid #fca5a5', fontSize:13 }} />
          </div>
        </div>
      )}
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
