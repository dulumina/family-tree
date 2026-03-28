import { useState } from 'react';
import { feedbackApi } from '../../api';

export default function FeedbackModal({ memberId, onClose }) {
  const [f, setF] = useState({ user_name: '', email: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.content) return;
    setLoading(true);
    setError('');
    try {
      await feedbackApi.submit({ ...f, member_id: memberId });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      setError(err.message || 'Gagal mengirim saran');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', 
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        overflow: 'hidden', animation: 'modalIn 0.3s ease-out'
      }}>
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Saran & Kritik</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>Bantu kami melengkapi & memperbaiki data silsilah</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 600, color: '#15803d' }}>Terima kasih! Saran Anda telah terkirim.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Nama Anda (Opsional)</label>
                <input type="text" value={f.user_name} onChange={e => setF({ ...f, user_name: e.target.value })}
                  placeholder="Nama lengkap"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email (Opsional)</label>
                <input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })}
                  placeholder="Alamat email untuk dihubungi"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Pesan / Koreksi Data *</label>
                <textarea value={f.content} onChange={e => setF({ ...f, content: e.target.value })}
                  required rows={4} placeholder="Contoh: Tanggal lahir si Fulan salah, yang benar 12 Mei 1990..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }} />
              </div>

              {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={onClose}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={loading || !f.content}
                  style={{ 
                    flex: 2, padding: '12px', borderRadius: 12, border: 'none', 
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', 
                    fontWeight: 700, cursor: 'pointer', opacity: (loading || !f.content) ? 0.7 : 1 
                  }}>
                  {loading ? 'Mengirim...' : 'Kirim Saran'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
      <style>{`
        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
