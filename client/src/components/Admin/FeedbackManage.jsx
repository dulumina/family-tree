import { useState, useEffect } from 'react';
import { feedbackApi } from '../../api';
import { useToast } from '../UI/Toast';

export default function FeedbackManage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      const { data } = await feedbackApi.getAll();
      setFeedbacks(data);
    } catch (e) {
      toast('❌ Gagal mengambil feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await feedbackApi.updateStatus(id, status);
      toast(`✅ Status diubah menjadi ${status}`);
      load();
    } catch (e) {
      toast('❌ Gagal mengubah status');
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'processed': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  if (loading) return <div style={{ textAlign:'center', padding:40, color:'#64748b' }}>Memuat data...</div>;

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h3 style={{ margin:0, color:'#1e293b' }}>📥 Semua Saran / Kritik</h3>
        <button onClick={load} style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>🔄 Segarkan</button>
      </div>

      {feedbacks.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, background:'#f8fafc', borderRadius:16, border:'1.5px dashed #cbd5e1', color:'#64748b' }}>
          Belum ada saran atau kritik yang masuk.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {feedbacks.map(f => (
            <div key={f.id} style={{ 
              background:'#fff', padding:16, borderRadius:12, border:'1.5px solid #e2e8f0',
              display:'flex', flexDirection:'column', gap:8
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontWeight:700, color:'#1e293b' }}>{f.user_name || 'Anonim'}</span>
                    {f.email && <span style={{ fontSize:12, color:'#64748b' }}>({f.email})</span>}
                    {f.member_id && <span style={{ fontSize:10, background:'#e0e7ff', color:'#4338ca', padding:'1px 6px', borderRadius:4 }}>ID Anggota: {f.member_id}</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{new Date(f.created_at).toLocaleString('id-ID')}</div>
                </div>
                <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', color: getStatusColor(f.status), padding:'2px 8px', borderRadius:6, border:`1px solid ${getStatusColor(f.status)}` }}>
                  {f.status}
                </div>
              </div>
              
              <div style={{ padding:10, background:'#f1f5f9', borderRadius:8, fontSize:13, color:'#334155', whiteSpace:'pre-wrap' }}>
                {f.content}
              </div>

              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button onClick={() => handleUpdateStatus(f.id, 'processed')} 
                  style={{ padding:'4px 10px', fontSize:11, background:'#f0fdf4', color:'#166534', border:'1px solid #bbf7d0', borderRadius:6, cursor:'pointer', fontWeight:600 }}>
                  Terima / Proses
                </button>
                <button onClick={() => handleUpdateStatus(f.id, 'rejected')} 
                  style={{ padding:'4px 10px', fontSize:11, background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontWeight:600 }}>
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
