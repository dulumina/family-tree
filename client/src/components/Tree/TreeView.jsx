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
  const [resizeKey, setResizeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
           2.5 // Max initial zoom scale
        );
        
        const tx = (svgRect.width - nodeBBox.width * scale) / 2 - nodeBBox.x * scale;
        const ty = isMobile ? 20 : (svgRect.height - nodeBBox.height * scale) / 2 - nodeBBox.y * scale;
        
        svg.call(zoomSetup.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
      // Trigger re-fit after a tick to ensure container size is settled
      requestAnimationFrame(() => {
        const svgRectFit = containerRef.current.getBoundingClientRect();
        const nodeBBoxFit = g.node().getBBox();
        if (nodeBBoxFit.width > 0 && nodeBBoxFit.height > 0) {
          const s = Math.min(
             (svgRectFit.width * (isMobile ? 0.98 : 0.95)) / nodeBBoxFit.width,
             (svgRectFit.height * (isMobile ? 0.98 : 0.95)) / nodeBBoxFit.height,
             2.5
          );
          const txFit = (svgRectFit.width - nodeBBoxFit.width * s) / 2 - nodeBBoxFit.x * s;
          const tyFit = isMobile ? 20 : (svgRectFit.height - nodeBBoxFit.height * s) / 2 - nodeBBoxFit.y * s;
          svg.call(zoomSetup.transform, d3.zoomIdentity.translate(txFit, tyFit).scale(s));
        }
      });

    } catch (e) {
      console.error("Topola render error:", e);
    }
  }, [activeMembers, onSelect, isMobile, resizeKey]); // added resizeKey to deps

  useEffect(() => {
    const handleResize = () => setResizeKey(k => k + 1);
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const handleFullscreen = () => {
    const el = containerRef.current.parentElement.parentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Fullscreen Button */}
      <div style={{ position: 'absolute', bottom: isMobile ? 12 : 20, right: isMobile ? 12 : 20, zIndex: 100, opacity: 0.5 }}>
        <button 
          onClick={handleFullscreen}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: 10, 
            background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            cursor: 'pointer', transition: 'all 0.2s', padding: 0
          }}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20 }}>
              <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20 }}>
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
