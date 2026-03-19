import { useState, useRef, useCallback } from 'react';

const NODE_W = 126, NODE_H = 88, GAP_X = 48, GAP_Y = 108;

function buildLayout(members) {
  const gens = [...new Set(members.map(m => m.generation))].sort((a,b)=>a-b);
  const pos = {};
  gens.forEach((g, gi) => {
    const row = members.filter(m => m.generation === g);
    const totalW = row.length * NODE_W + (row.length - 1) * GAP_X;
    const sx = -totalW / 2;
    row.forEach((m, i) => { pos[m.id] = { x: sx + i * (NODE_W + GAP_X), y: gi * (NODE_H + GAP_Y) }; });
  });
  return pos;
}

export default function TreeView({ members, selected, onSelect }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const last = useRef(null);
  const svgH = Math.max(...members.map(m=>m.generation), 0) * (NODE_H + GAP_Y) + NODE_H + 80;

  const pos = buildLayout(members);
  const CX = 600, CY = 50;

  const edges = [];
  members.forEach(m => {
    (m.parentIds || []).forEach(pid => {
      if (pos[pid] && pos[m.id]) {
        const p = pos[pid], c = pos[m.id];
        edges.push({ type:'parent', x1:CX+p.x+NODE_W/2, y1:CY+p.y+NODE_H, x2:CX+c.x+NODE_W/2, y2:CY+c.y });
      }
    });
    if (m.spouse_id && pos[m.spouse_id] && pos[m.id] && m.id < m.spouse_id) {
      const a = pos[m.id], b = pos[m.spouse_id];
      edges.push({ type:'spouse', x1:CX+a.x+NODE_W, y1:CY+a.y+NODE_H/2, x2:CX+b.x, y2:CY+b.y+NODE_H/2 });
    }
  });

  const onMD = e => { dragging.current=true; last.current={x:e.clientX-pan.x, y:e.clientY-pan.y}; };
  const onMM = e => { if(dragging.current) setPan({x:e.clientX-last.current.x, y:e.clientY-last.current.y}); };
  const onMU = () => { dragging.current=false; };
  const onWheel = e => { e.preventDefault(); setZoom(z=>Math.min(2.5,Math.max(0.25,z-e.deltaY*.001))); };

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'linear-gradient(135deg,#f8faff,#eef2ff)', borderRadius:16, overflow:'hidden', cursor: dragging.current?'grabbing':'grab' }}
      onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
      <div style={{ position:'absolute', top:12, right:12, zIndex:10, display:'flex', gap:6 }}>
        {[['+',0.15],['-',-0.15],['↺',0]].map(([lbl,d])=>(
          <button key={lbl} onClick={()=>d===0?(setPan({x:0,y:0}),setZoom(1)):setZoom(z=>Math.min(2.5,Math.max(0.25,z+d)))}
            style={{ width:32,height:32,borderRadius:8,border:'none',background:'#fff',boxShadow:'0 2px 8px #0002',cursor:'pointer',fontWeight:700,fontSize:16 }}>{lbl}</button>
        ))}
      </div>
      <svg width="100%" height="100%" onWheel={onWheel} style={{ userSelect:'none' }}>
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {edges.map((e,i)=>
            e.type==='spouse'
              ? <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#f472b6" strokeWidth={2.5} strokeDasharray="6,4" />
              : <path key={i} d={`M${e.x1},${e.y1} C${e.x1},${(e.y1+e.y2)/2} ${e.x2},${(e.y1+e.y2)/2} ${e.x2},${e.y2}`}
                  fill="none" stroke="#94a3b8" strokeWidth={2} />
          )}
          {members.map(m=>{
            const p=pos[m.id]; if(!p) return null;
            const px=CX+p.x, py=CY+p.y, sel=selected?.id===m.id;
            const bg = sel ? (m.gender==='male'?'#3b82f6':'#ec4899') : (m.gender==='male'?'#eff6ff':'#fdf2f8');
            const stroke = m.gender==='male'?'#3b82f6':'#ec4899';
            return (
              <g key={m.id} onClick={()=>onSelect(m)} style={{cursor:'pointer'}}>
                <rect x={px} y={py} width={NODE_W} height={NODE_H} rx={13}
                  fill={bg} stroke={stroke} strokeWidth={sel?3:1.5}
                  filter={sel?'drop-shadow(0 4px 14px rgba(99,102,241,.4))':'drop-shadow(0 2px 6px rgba(0,0,0,.08))'} />
                <text x={px+NODE_W/2} y={py+27} textAnchor="middle" fontSize={22}>{m.photo}</text>
                <text x={px+NODE_W/2} y={py+50} textAnchor="middle" fontSize={10} fontWeight="700" fill={sel?'#fff':'#1e293b'}>
                  {m.name.length>15?m.name.slice(0,14)+'…':m.name}
                </text>
                <text x={px+NODE_W/2} y={py+65} textAnchor="middle" fontSize={9} fill={sel?'#e2e8f0':'#64748b'}>
                  {m.born_year||'?'}{m.died_year?`–${m.died_year}`:''}
                </text>
                {m.died_year && <text x={px+NODE_W-9} y={py+14} fontSize={11} textAnchor="middle">✝</text>}
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ position:'absolute', bottom:12, left:12, background:'#ffffffcc', borderRadius:10, padding:'6px 12px', fontSize:11, color:'#64748b', backdropFilter:'blur(6px)' }}>
        🖱 Drag geser · Scroll zoom · Klik node detail
      </div>
    </div>
  );
}
