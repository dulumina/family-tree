import { useState, useEffect } from 'react';
import { feedbackApi } from '../../api';
import { useToast } from '../UI/Toast';
import useMobile from '../../hooks/useMobile';

export default function FeedbackManage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useMobile();

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
      <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom:20, gap: 10 }}>
        <h3 style={{ margin:0, color:'#1e293b', fontSize: isMobile ? 18 : 22 }}>📥 Saran / Kritik</h3>
        <button onClick={load} style={{ width: isMobile ? '100%' : 'auto', padding:'6px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>🔄 Segarkan</button>
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
              <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 6 }}>
                <div>
                  <div style={{ display:'flex', flexWrap: 'wrap', alignItems:'center', gap: isMobile ? 4 : 8 }}>
                    <span style={{ fontWeight:700, color:'#1e293b', fontSize: isMobile ? 14 : 16 }}>{f.user_name || 'Anonim'}</span>
                    {f.email && <span style={{ fontSize: isMobile ? 11 : 12, color:'#64748b' }}>({f.email})</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {f.member_id && <span style={{ fontSize:10, background:'#e0e7ff', color:'#4338ca', padding:'1px 6px', borderRadius:4 }}>Anggota ID: {f.member_id}</span>}
                    <div style={{ fontSize:10, color:'#94a3b8' }}>{new Date(f.created_at).toLocaleString('id-ID')}</div>
                  </div>
                </div>
                <div style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', color: getStatusColor(f.status), padding:'2px 8px', borderRadius:6, border:`1px solid ${getStatusColor(f.status)}`, background: '#fff' }}>
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
