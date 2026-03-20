/* eslint-disable react/prop-types */
import { useEffect, useRef } from 'react';
import * as topola from 'topola';
import * as d3 from 'd3';

export default function TreeView({ members, selected, onSelect }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current || !members || members.length === 0) return;
    
    // Clear previous SVG contents
    containerRef.current.innerHTML = '<svg id="topola-svg" width="100%" height="100%" style="user-select:none; cursor:grab;"></svg>';
    
    const indis = [];
    const famsMap = new Map(); // key -> fam object
    
    const getFamId = (pids) => {
       if (!pids || pids.length === 0) return null;
       return pids.slice().sort().join('-');
    };

    const assignRoles = (p1, p2) => {
      let husb = null, wife = null;
      const assign = (p) => {
        if (!p) return;
        if (p.gender === 'male' && !husb) husb = p.id;
        else if (p.gender === 'female' && !wife) wife = p.id;
        else if (!husb) husb = p.id;
        else wife = p.id;
      };
      assign(p1);
      assign(p2);
      return { husb, wife };
    };

    // Construct Families
    members.forEach(m => {
      if (m.spouse_id) {
        const id = getFamId([m.id, m.spouse_id]);
        if (!famsMap.has(id)) {
          const spouse = members.find(s => s.id === m.spouse_id);
          const { husb, wife } = assignRoles(m, spouse);
          famsMap.set(id, { id, husb: husb ? String(husb) : undefined, wife: wife ? String(wife) : undefined, children: [] });
        }
      }

      if (m.parentIds && m.parentIds.length > 0) {
        const id = getFamId(m.parentIds);
        if (!famsMap.has(id)) {
          const p1 = members.find(p => p.id === m.parentIds[0]);
          const p2 = m.parentIds[1] ? members.find(p => p.id === m.parentIds[1]) : null;
          const { husb, wife } = assignRoles(p1, p2);
          famsMap.set(id, { id, husb: husb ? String(husb) : undefined, wife: wife ? String(wife) : undefined, children: [] });
        }
        famsMap.get(id).children.push(String(m.id));
      }
    });

    // Populate Individuals
    members.forEach(m => {
      let famc = undefined;
      if (m.parentIds && m.parentIds.length > 0) {
        famc = getFamId(m.parentIds);
      }

      const famsForIndi = [];
      famsMap.forEach(fam => {
        if (fam.husb === String(m.id) || fam.wife === String(m.id)) {
          famsForIndi.push(fam.id);
        }
      });
      
      indis.push({
        id: String(m.id),
        firstName: m.name,
        lastName: '',
        sex: m.gender === 'male' ? 'M' : m.gender === 'female' ? 'F' : 'U',
        birth: m.born_year ? { date: { year: parseInt(m.born_year) } } : undefined,
        death: m.died_year ? { date: { year: parseInt(m.died_year) } } : undefined,
        famc: famc,
        fams: famsForIndi.length > 0 ? famsForIndi : undefined,
      });
    });

    const json = { indis, fams: Array.from(famsMap.values()) };

    // Use RelativesChart and start from the tree's root or any member to build context
    const startIndi = String(members.length > 0 ? members[0].id : 1);

    try {
      const chart = topola.createChart({
        json,
        chartType: topola.RelativesChart,
        renderer: topola.DetailedRenderer,
        svgSelector: '#topola-svg',
        indiCallback: (info) => {
          const member = members.find(m => String(m.id) === info.id);
          if (member) onSelect(member);
        },
        animate: true
      });
      
      chart.render({ startIndi }).then(() => {
        // Init D3 Drag and Zoom after topola renders
        const svg = d3.select(containerRef.current).select('svg');
        const g = svg.select('g');
        
        const zoomSetup = d3.zoom()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        svg.call(zoomSetup);
        
        // Grab Topola's initial transform to prevent jumping
        let currentTransformStr = g.attr('transform');
        if (currentTransformStr) {
           const match = currentTransformStr.match(/translate\(([^,]+),\s*([^)]+)\)\s*scale\(([^)]+)\)/);
           if (match) {
             const [_, x, y, k] = match;
             const t = d3.zoomIdentity.translate(parseFloat(x), parseFloat(y)).scale(parseFloat(k));
             svg.call(zoomSetup.transform, t);
           }
        }
      });
      
    } catch (e) {
      console.error("Topola render error:", e);
    }
  }, [members, onSelect]);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'linear-gradient(135deg,#f8faff,#eef2ff)', borderRadius:16, overflow:'hidden' }}>
      <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
      <div style={{ position:'absolute', bottom:12, left:12, background:'#ffffffcc', borderRadius:10, padding:'6px 12px', fontSize:11, color:'#64748b', backdropFilter:'blur(6px)' }}>
        🖱 Topola Family Tree · Drag geser · Scroll zoom · Klik node detail
      </div>
    </div>
  );
}
