/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useMemo } from 'react';
import * as topola from 'topola';
import * as d3 from 'd3';
import { useToast } from '../UI/Toast';
import useMobile from '../../hooks/useMobile';

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
  const [showExport, setShowExport] = useState(false);
  const { toast } = useToast();
  const isMobile = useMobile();

  const activeMembers = members || [];

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

    // Identifikasi siapa saja yang merupakan keturunan (punya orang tua di dalam sistem ini)
    const relativeIds = new Set(activeMembers.filter(m => 
      m.parentIds && m.parentIds.some(pid => activeMembers.some(p => p.id === pid))
    ).map(m => String(m.id)));

    activeMembers.forEach(m => {
      let famc = undefined;
      const validParentIds = m.parentIds ? m.parentIds.filter(pid => activeMembers.some(p => p.id === pid)) : [];
      if (validParentIds.length > 0) famc = getFamId(validParentIds);
      const isSelected = selected && String(selected.id) === String(m.id);
      const famsForIndi = [];
      famsMap.forEach(fam => {
        const isHusb = fam.husb === String(m.id);
        const isWife = fam.wife === String(m.id);
        if (isHusb) {
          famsForIndi.push(fam.id);
        } else if (isWife) {
          const husbIsRelative = fam.husb && relativeIds.has(String(fam.husb));
          // Tampilkan anak di bawah ibu jika:
          // 1. Ibu sedang dipilih (fokus)
          // 2. Tidak ada suami
          // 3. Suami bukan berasal dari keluarga ini (outsider), jadi tidak ada risiko duplikasi
          if (isSelected || !fam.husb || !husbIsRelative) {
            famsForIndi.push(fam.id);
          } else {
            // Hanya gunakan versi tanpa anak jika suami juga ada di garis keturunan (cegah duplikasi sub-pohon)
            famsForIndi.push(fam.id + '_s');
          }
        }
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

    const allFams = [];
    famsMap.forEach(fam => {
      allFams.push(fam);
      allFams.push({ ...fam, id: fam.id + '_s', children: [] });
    });

    const json = { indis, fams: allFams };
    
    const activeRoot = activeMembers.find(m => 
      m.gender === 'male' && 
      (!m.parentIds || m.parentIds.length === 0 || m.parentIds.every(pid => !activeMembers.some(p => p.id === pid)))
    );

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
        const extraWidth = isMobile ? 30 : 45;
        const height = isMobile ? 38 : Math.max(42, size[1] - 8);
        return [size[0] + extraWidth, height];
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

        const avatarW = isMobile ? 24 : 34; 
        
        const isMale = bg.classed('male');
        const isFemale = bg.classed('female');
        const avatarBg = isMale ? '#4f6c77' : isFemale ? '#a16671' : '#64748b';
        
        indiG.insert('rect', '.border')
          .attr('x', 0).attr('y', 0)
          .attr('width', avatarW).attr('height', h)
          .attr('fill', avatarBg)
          .attr('rx', 2).attr('ry', 2);

        const avatarIconScale = h < 40 ? 0.7 : 1;
        indiG.insert('path', '.border')
          .attr('d', 'M17,10 c-3.3,0 -6,2.7 -6,6 c0,3.3 2.7,6 6,6 c3.3,0 6,-2.7 6,-6 c0,-3.3 -2.7,-6 -6,-6 z M17,24 c-6.6,0 -12,3.6 -12,8 v2 h24 v-2 c0,-4.4 -5.4,-8 -12,-8 z')
          .attr('fill', '#ffffff')
          .attr('opacity', 0.85)
          .attr('transform', `translate(${isMobile ? -4 : 0}, ${(h - (38 * avatarIconScale))/2}) scale(${avatarIconScale})`);

        let currentY = isMobile ? 14 : 18;
        texts.forEach(item => {
           indiG.append('text')
             .text(item.text)
             .attr('x', avatarW + (isMobile ? 5 : 8))
             .attr('y', currentY)
             .attr('font-size', item.type === 'name' ? (isMobile ? '9px' : '11.5px') : (isMobile ? '7.5px' : '9.5px'))
             .attr('font-weight', item.type === 'name' ? '600' : '400')
             .attr('fill', '#111')
             .style('pointer-events', 'none');
           currentY += item.type === 'name' ? (isMobile ? 11 : 14) : (isMobile ? 9 : 11);
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
           (svgRect.width * (isMobile ? 0.98 : 0.95)) / nodeBBox.width,
           (svgRect.height * (isMobile ? 0.98 : 0.95)) / nodeBBox.height,
           isMobile ? 1.5 : 1.2 // Max initial zoom scale
        );
        
        const tx = (svgRect.width - nodeBBox.width * scale) / 2 - nodeBBox.x * scale;
        const ty = isMobile ? 20 : (svgRect.height - nodeBBox.height * scale) / 2 - nodeBBox.y * scale;
        
        svg.call(zoomSetup.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }

    } catch (e) {
      console.error("Topola render error:", e);
    }
  }, [activeMembers, onSelect]); // only depend on activeMembers and onSelect

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.export-container')) {
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportJson = () => {
    try {
      const memberIds = new Set(activeMembers.map(m => m.id));
      const parents = [];
      activeMembers.forEach(m => {
        if (m.parentIds) {
          m.parentIds.forEach(pid => {
            if (memberIds.has(pid)) {
              parents.push({ member_id: m.id, parent_id: pid });
            }
          });
        }
      });
      const data = { members: activeMembers, parents };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = 'family-tree-view.json';
      a.click();
      toast('✅ Data JSON diekspor');
      setShowExport(false);
    } catch(e) { toast('❌ Gagal ekspor JSON'); }
  };

  const handleExportGedcom = () => {
    try {
      const memberIds = new Set(activeMembers.map(m => m.id));
      const parents = [];
      activeMembers.forEach(m => {
        if (m.parentIds) {
          m.parentIds.forEach(pid => {
            if (memberIds.has(pid)) parents.push({ member_id: m.id, parent_id: pid });
          });
        }
      });

      let ged = `0 HEAD\n1 CHAR UTF-8\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n`;
      activeMembers.forEach(m => {
        ged += `0 @I${m.id}@ INDI\n`;
        ged += `1 NAME ${m.name.replace(/\//g, '')} /${m.name.split(' ').pop()}/\n`;
        ged += `1 SEX ${m.gender === 'male' ? 'M' : 'F'}\n`;
        if (m.born_year) ged += `1 BIRT\n2 DATE ${m.born_year}\n`;
        if (m.died_year) ged += `1 DEAT\n2 DATE ${m.died_year}\n`;
      });

      const famMap = {};
      activeMembers.forEach(m => {
        const pids = parents.filter(p => p.member_id === m.id).map(p => p.parent_id).sort();
        if (pids.length > 0) {
          const key = pids.join('_');
          if (!famMap[key]) famMap[key] = [];
          famMap[key].push(m.id);
        }
      });

      Object.entries(famMap).forEach(([pids, children], idx) => {
        const ids = pids.split('_');
        ged += `0 @F${idx+1}@ FAM\n`;
        ids.forEach(pid => {
          const p = activeMembers.find(m => m.id == pid);
          if (p) {
            if (p.gender === 'male') ged += `1 HUSB @I${p.id}@\n`;
            else ged += `1 WIFE @I${p.id}@\n`;
          }
        });
        children.forEach(cid => { ged += `1 CHIL @I${cid}@\n`; });
      });
      ged += `0 TRLR\n`;

      const blob = new Blob([ged], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = 'family-tree-view.ged';
      a.click();
      toast('✅ Data GEDCOM diekspor');
      setShowExport(false);
    } catch(e) { toast('❌ Gagal ekspor GEDCOM'); }
  };

  const handleExportSvg = () => {
    try {
      const originalSvg = containerRef.current.querySelector('svg');
      if (!originalSvg) return;
      
      const svgCopy = originalSvg.cloneNode(true);
      const g = svgCopy.querySelector('g');
      if (!g) return;
      
      // Get the bounding box of the content
      // Since cloneNode doesn't have a layout, we must use the original's bbox
      const originalG = originalSvg.querySelector('g');
      const bbox = originalG.getBBox();
      
      // Reset transform on top-level g in copy to export the full thing cleanly
      g.removeAttribute('transform');
      
      const padding = 20;
      svgCopy.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding*2} ${bbox.height + padding*2}`);
      svgCopy.setAttribute('width', bbox.width + padding*2);
      svgCopy.setAttribute('height', bbox.height + padding*2);
      svgCopy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Add white background
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', bbox.x - padding);
      rect.setAttribute('y', bbox.y - padding);
      rect.setAttribute('width', bbox.width + padding*2);
      rect.setAttribute('height', bbox.height + padding*2);
      rect.setAttribute('fill', '#ffffff');
      svgCopy.insertBefore(rect, svgCopy.firstChild);

      const svgData = new XMLSerializer().serializeToString(svgCopy);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'family-tree-view.svg';
      a.click();
      toast('✅ SVG diekspor');
      setShowExport(false);
    } catch(e) { 
      console.error(e);
      toast('❌ Gagal ekspor SVG'); 
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Export Button */}
      <div className="export-container" style={{ position: 'absolute', top: isMobile ? 8 : 16, left: isMobile ? 8 : 16, zIndex: 50 }}>
        <button 
          onClick={() => setShowExport(!showExport)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 10, 
            background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 700, color: '#475569', transition: 'all 0.2s'
          }}
        >
          <span>📤 {isMobile ? '' : 'Ekspor'}</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
        </button>

        {showExport && (
          <div style={{ 
            position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#fff', 
            borderRadius: 12, border: '1.5px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            minWidth: 180, overflow: 'hidden', zIndex: 100
          }}>
            <div 
              onClick={handleExportJson}
              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #f1f5f9', color: '#6366f1' }}
              onMouseOver={(e) => e.target.style.background = '#f5f3ff'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              EKSPOR JSON
            </div>
            <div 
              onClick={handleExportGedcom}
              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #f1f5f9', color: '#10b981' }}
              onMouseOver={(e) => e.target.style.background = '#f0fdf4'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              EKSPOR GEDCOM
            </div>
            <div 
              onClick={handleExportSvg}
              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#ef4444' }}
              onMouseOver={(e) => e.target.style.background = '#fef2f2'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              EKSPOR SVG (VISUAL)
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
