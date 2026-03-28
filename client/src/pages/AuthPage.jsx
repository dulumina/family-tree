import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [err, setErr] = useState('');
  const { login, register } = useAuth();
  const s = (k,v) => setForm(p=>({...p,[k]:v}));

  const handle = async () => {
    setErr('');
    try {
      if (mode==='login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch(e) {
      setErr(e.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:24, padding:36, width:360, boxShadow:'0 24px 60px #0004' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🌳</div>
          <h1 style={{ margin:0, fontSize:22, color:'#1e293b' }}>{mode==='login'?'Masuk':'Daftar Akun'}</h1>
          <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:14 }}>Pohon Silsilah Keluarga</p>
        </div>
        {mode==='register' && (
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:5 }}>Nama Lengkap</label>
            <input value={form.name} onChange={e=>s('name',e.target.value)} placeholder="Nama Anda"
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
          </div>
        )}
        {[['Email','email','email'],['Password','password','password']].map(([lbl,key,type])=>(
          <div key={key} style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:5 }}>{lbl}</label>
            <input type={type} value={form[key]} onChange={e=>s(key,e.target.value)}
              placeholder={key==='email'?'email@contoh.com':'••••••••'}
              onKeyDown={e=>e.key==='Enter'&&handle()}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box' }} />
          </div>
        ))}
        {err && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{err}</div>}
        <button onClick={handle} style={{ width:'100%', padding:'11px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', marginBottom:14 }}>
          {mode==='login'?'Masuk':'Daftar Sekarang'}
        </button>
        <div style={{ textAlign:'center', fontSize:13, color:'#64748b' }}>
          {mode==='login'?'Belum punya akun?':'Sudah punya akun?'}{' '}
          <span style={{ color:'#6366f1', cursor:'pointer', fontWeight:600 }} onClick={()=>setMode(mode==='login'?'register':'login')}>
            {mode==='login'?'Daftar':'Masuk'}
          </span>
        </div>
        {mode==='login' && !import.meta.env.PROD && (
          <div style={{ marginTop:16, padding:12, background:'#f8fafc', borderRadius:10, fontSize:12, color:'#94a3b8', textAlign:'center' }}>
            Demo: <b>admin@keluarga.id</b> / <b>admin123</b>
          </div>
        )}
      </div>
    </div>
  );
}
