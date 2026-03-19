import { useState, useCallback, useEffect } from 'react';

let _push = null;
export function useToast() {
  return { toast: msg => _push?.(msg) };
}

export function ToastContainer() {
  const [items, setItems] = useState([]);
  _push = useCallback(msg => {
    const id = Date.now();
    setItems(s => [...s, { id, msg }]);
    setTimeout(() => setItems(s => s.filter(x => x.id !== id)), 3000);
  }, []);

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {items.map(({ id, msg }) => (
        <div key={id} style={{ background:'#1e293b', color:'#fff', padding:'12px 20px', borderRadius:12, fontSize:14, fontWeight:600, boxShadow:'0 8px 24px #0003', animation:'slideIn .3s ease' }}>
          {msg}
        </div>
      ))}
    </div>
  );
}
