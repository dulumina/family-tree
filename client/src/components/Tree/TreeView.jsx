/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useMemo } from 'react';
import * as topola from 'topola';
import * as d3 from 'd3';

const TREE_CSS = `
  .detailed text {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  .detailed rect.background {
    rx: 2 !important;
    ry: 2 !important;
    stroke-width: 0 !important;
  }

  /* Warna exact dari screenshot */
  .detailed rect.male { fill: #7697a5 !important; }
  .detailed rect.female { fill: #c68994 !important; }
  .detailed rect.nocolor { fill: #cbd5e1 !important; }
  
  .detailed rect.border {
    fill: transparent !important;
    stroke: #444 !important;
    stroke-width: 0.6px !important;
    rx: 2 !important;
    ry: 2 !important;
    pointer-events: none;
  }

  .link {
    fill: none;
    stroke: #555;
    stroke-width: 0.8px;
  }
  .additional-marriage {
    stroke-dasharray: 4, 3;
    stroke: #888;
  }
  
  .indi {
    cursor: default;
  }
`;

export default function TreeView({ members, selected, onSelect }) {
  const containerRef = useRef(null);
  const [activeFamilyIndex, setActiveFamilyIndex] = useState(0);

  const families = useMemo(() => {
    if (!members || members.length === 0) return [];

    const allIds = new Set(members.map(m => m.id));

    // 1. Temukan semua pucuk: laki-laki yang tidak punya orang tua dalam dataset
    const roots = members.filter(m =>
      m.gender === 'male' &&
      (!m.parentIds || m.parentIds.length === 0 || m.parentIds.every(pid => !allIds.has(pid)))
    );

    // Jika tidak ada pucuk laki-laki ditemukan, tampilkan semua sebagai satu keluarga
    if (roots.length === 0) return [members];

    // 2. Untuk setiap pucuk, kumpulkan semua keturunan darah (downward BFS via parentIds)
    const getBloodlineIds = (rootId) => {
      const result = new Set([rootId]);
      const queue = [rootId];
      while (queue.length > 0) {
        const curr = queue.shift();
        members.forEach(m => {
          if (!result.has(m.id) && m.parentIds && m.parentIds.includes(curr)) {
            result.add(m.id);
            queue.push(m.id);
          }
        });
      }
      return result;
    };

    // 3. Bangun anggota tiap tab = keturunan darah + pasangan mereka
    const result = roots.map(root => {
      const bloodlineIds = getBloodlineIds(root.id);

      // Tambahkan pasangan dari setiap anggota bloodline
      const familyIds = new Set(bloodlineIds);
      bloodlineIds.forEach(id => {
        const m = members.find(x => x.id === id);
        if (m?.spouse_id && allIds.has(m.spouse_id)) {
          familyIds.add(m.spouse_id);
        }
      });

      return {
        root,
        members: members.filter(m => familyIds.has(m.id)),
      };
    });

    // Urutkan berdasarkan jumlah anggota terbesar
    result.sort((a, b) => b.members.length - a.members.length);
    return result;
  }, [members]);

  // Adjust active index if it goes out of bounds
  useEffect(() => {
    if (activeFamilyIndex >= families.length && families.length > 0) {
      setActiveFamilyIndex(0);
    }
  }, [families.length, activeFamilyIndex]);

  // Auto-switch tab if `selected` changes and it belongs to a different family
  useEffect(() => {
    if (selected && families.length > 0) {
      const famIndex = families.findIndex(fam => fam.members.some(m => m.id === selected.id));
      if (famIndex !== -1 && famIndex !== activeFamilyIndex) {
        setActiveFamilyIndex(famIndex);
      }
    }
  }, [selected, families, activeFamilyIndex]);

  const activeMembers = (families[activeFamilyIndex]?.members) || [];

  useEffect(() => {
    if (!containerRef.current || activeMembers.length === 0) {
      if (containerRef.current) containerRef.current.innerHTML = '';
      return;
    }

    containerRef.current.innerHTML = `
      <svg id="topola-svg" width="100%" height="100%" style="user-select:none; cursor:grab; background: #ffffff;">
        <style>${TREE_CSS}</style>
      </svg>
    `;

    const indis = [];
    const famsMap = new Map();

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
      assign(p1); assign(p2);
      return { husb, wife };
    };

    activeMembers.forEach(m => {
      if (m.spouse_id) {
        const spouse = activeMembers.find(s => s.id === m.spouse_id);
        if (spouse) {
          const id = getFamId([m.id, m.spouse_id]);
          if (!famsMap.has(id)) {
            const { husb, wife } = assignRoles(m, spouse);
            famsMap.set(id, { id, husb: husb ? String(husb) : undefined, wife: wife ? String(wife) : undefined, children: [] });
          }
        }
      }
      if (m.parentIds && m.parentIds.length > 0) {
        const validParentIds = m.parentIds.filter(pid => activeMembers.some(p => p.id === pid));
        if (validParentIds.length > 0) {
          const id = getFamId(validParentIds);
          if (!famsMap.has(id)) {
            const p1 = activeMembers.find(p => p.id === validParentIds[0]);
            const p2 = validParentIds[1] ? activeMembers.find(p => p.id === validParentIds[1]) : null;
            const { husb, wife } = assignRoles(p1, p2);
            famsMap.set(id, { id, husb: husb ? String(husb) : undefined, wife: wife ? String(wife) : undefined, children: [] });
          }
          famsMap.get(id).children.push(String(m.id));
        }
      }
    });

    activeMembers.forEach(m => {
      let famc = undefined;
      const validParentIds = m.parentIds ? m.parentIds.filter(pid => activeMembers.some(p => p.id === pid)) : [];
      if (validParentIds.length > 0) famc = getFamId(validParentIds);
      const famsForIndi = [];
      famsMap.forEach(fam => {
        if (fam.husb === String(m.id) || fam.wife === String(m.id)) famsForIndi.push(fam.id);
      });
      indis.push({
        id: String(m.id),
        firstName: m.name,
        lastName: '',
        sex: m.gender === 'male' ? 'M' : m.gender === 'female' ? 'F' : 'U',
        birth: m.born_year ? { date: { year: parseInt(m.born_year) } } : undefined,
        death: m.died_year ? { date: { year: parseInt(m.died_year) } } : undefined,
        famc,
        fams: famsForIndi.length > 0 ? famsForIndi : undefined,
      });
    });

    const json = { indis, fams: Array.from(famsMap.values()) };
    
    // Mulai dari pucuk keluarga tab aktif agar diagram dimulai dari leluhur
    const activeRoot = families[activeFamilyIndex]?.root;
    let startIndi;
    if (selected && activeMembers.some(m => m.id === selected.id)) {
      startIndi = String(selected.id);
    } else if (activeRoot) {
      startIndi = String(activeRoot.id);
    } else {
      startIndi = String(activeMembers.length > 0 ? activeMembers[0].id : 1);
    }

    // Kustomisasi ukuran node di layout engine Topola untuk jarak yang tepat
    class CustomRenderer extends topola.DetailedRenderer {
      getPreferredIndiSize(id) {
        const size = super.getPreferredIndiSize(id);
        // Tambah lebar +45px untuk avatar box agar layout tidak tumpang tindih
        // Kurangi tinggi sedikit agar lebih rapat (default Topola agak lebar y-nya)
        return [size[0] + 45, Math.max(42, size[1] - 8)];
      }
    }

    try {
      const chart = topola.createChart({
        json,
        chartType: topola.RelativesChart,
        renderer: CustomRenderer,
        svgSelector: '#topola-svg',
        colors: topola.ChartColors.COLOR_BY_SEX,
        indiCallback: (info) => {
          const member = activeMembers.find(m => String(m.id) === info.id);
          if (member) onSelect(member);
        },
      });

      chart.render({ startIndi });

      const svg = d3.select(containerRef.current).select('svg');
      // Reset ukuran agar Topola tidak mengecilkan batas SVG 
      svg.attr('width', '100%').attr('height', '100%');
      
      svg.selectAll('g.indi').each(function() {
        const indiG = d3.select(this);
        const bg = indiG.select('rect.background');
        if (bg.empty()) return;

        const w = parseFloat(bg.attr('width'));
        const h = parseFloat(bg.attr('height'));
        
        const texts = [];
        indiG.selectAll('text').each(function() {
          const el = d3.select(this);
          const t = el.text().trim();
          if (t && !['*', '+', '\u26AD', 'M', 'F', 'U', '♂', '♀'].includes(t)) {
            texts.push({
              type: el.classed('name') ? 'name' : 'details',
              text: t
            });
          }
        });

        indiG.selectAll('text').remove();

        const avatarW = 34; 
        
        const isMale = bg.classed('male');
        const isFemale = bg.classed('female');
        const avatarBg = isMale ? '#4f6c77' : isFemale ? '#a16671' : '#64748b';
        
        indiG.insert('rect', '.border')
          .attr('x', 0).attr('y', 0)
          .attr('width', avatarW).attr('height', h)
          .attr('fill', avatarBg)
          .attr('rx', 2).attr('ry', 2);

        indiG.insert('path', '.border')
          .attr('d', 'M17,10 c-3.3,0 -6,2.7 -6,6 c0,3.3 2.7,6 6,6 c3.3,0 6,-2.7 6,-6 c0,-3.3 -2.7,-6 -6,-6 z M17,24 c-6.6,0 -12,3.6 -12,8 v2 h24 v-2 c0,-4.4 -5.4,-8 -12,-8 z')
          .attr('fill', '#ffffff')
          .attr('opacity', 0.85)
          .attr('transform', `translate(0, ${(h - 38)/2})`);

        let currentY = 18;
        texts.forEach(item => {
           indiG.append('text')
             .text(item.text)
             .attr('x', avatarW + 8)
             .attr('y', currentY)
             .attr('font-size', item.type === 'name' ? '11.5px' : '9.5px')
             .attr('font-weight', item.type === 'name' ? '600' : '400')
             .attr('fill', '#111')
             .style('pointer-events', 'none');
           currentY += item.type === 'name' ? 14 : 11;
        });
      });

      // ── Auto Fit to Screen & Center ──
      const g = svg.select('g');
      const zoomSetup = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => { g.attr('transform', event.transform); });
      
      svg.call(zoomSetup);

      // Hitung skala agar seluruh diagram pas dalam dimensi kontainer
      const svgRect = containerRef.current.getBoundingClientRect();
      const nodeBBox = g.node().getBBox();
      
      if (nodeBBox.width > 0 && nodeBBox.height > 0) {
        // Beri margin sedikit (padding 5%)
        const scale = Math.min(
           (svgRect.width * 0.95) / nodeBBox.width,
           (svgRect.height * 0.95) / nodeBBox.height,
           1.2 // Max initial zoom scale
        );
        
        const tx = (svgRect.width - nodeBBox.width * scale) / 2 - nodeBBox.x * scale;
        const ty = (svgRect.height - nodeBBox.height * scale) / 2 - nodeBBox.y * scale;
        
        svg.call(zoomSetup.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }

    } catch (e) {
      console.error("Topola render error:", e);
    }
  }, [activeMembers, onSelect]); // only depend on activeMembers and onSelect

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {families.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {families.map((fam, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFamilyIndex(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                background: activeFamilyIndex === idx ? '#4f46e5' : '#e2e8f0',
                color: activeFamilyIndex === idx ? '#fff' : '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              Keluarga {fam.root.name} ({fam.members.length})
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
