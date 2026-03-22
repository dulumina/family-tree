import { dataApi } from '../../api';
import { useToast } from '../UI/Toast';
import * as topola from 'topola';
import * as d3 from 'd3';

const TREE_CSS = `
  .detailed text {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .detailed rect.background { rx: 2 !important; ry: 2 !important; stroke-width: 0 !important; }
  .detailed rect.male { fill: #7697a5 !important; }
  .detailed rect.female { fill: #c68994 !important; }
  .detailed rect.nocolor { fill: #cbd5e1 !important; }
  .detailed rect.border {
    fill: transparent !important;
    stroke: #444 !important;
    stroke-width: 0.6px !important;
    rx: 2 !important; ry: 2 !important;
    pointer-events: none;
  }
  .link { fill: none; stroke: #555; stroke-width: 0.8px; }
  .additional-marriage { stroke-dasharray: 4, 3; stroke: #888; }
`;

export default function DataManage({ members }) {
  const { toast } = useToast();

  const handleExportJson = async () => {
    try {
      const { data } = await dataApi.exportJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'family-tree.json'; a.click();
      toast('✅ Data JSON diekspor');
    } catch(e) { toast('❌ Gagal ekspor JSON'); }
  };

  const handleExportGedcom = async () => {
    try {
      const { data } = await dataApi.exportGedcom();
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = 'family-tree.ged'; a.click();
      toast('✅ Data GEDCOM diekspor');
    } catch(e) { toast('❌ Gagal ekspor GEDCOM'); }
  };

  const handleImportJson = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    if(!confirm('Import akan MENGHAPUS semua data silsilah saat ini. Lanjutkan?')) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
       try {
         const json = JSON.parse(event.target.result);
         await dataApi.importJson(json);
         toast('✅ Import JSON berhasil! Memuat ulang...');
         setTimeout(() => window.location.reload(), 1500);
       } catch(e) { toast('❌ Gagal import JSON: ' + (e.response?.data?.error || 'Format salah')); }
    };
    reader.readAsText(file);
  };

  const handleImportGedcom = async (e) => {
    const file = e.target.files[0]; if(!file) return;
    if(!confirm('Import akan MENGHAPUS semua data silsilah saat ini. Lanjutkan?')) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
       try {
         await dataApi.importGedcom(event.target.result);
         toast('✅ Import GEDCOM berhasil! Memuat ulang...');
         setTimeout(() => window.location.reload(), 1500);
       } catch(e) { toast('❌ Gagal import GEDCOM: ' + (e.response?.data?.error || 'Format salah')); }
    };
    reader.readAsText(file);
  };

  const handleExportSvg = async () => {
    try {
      if(!members || members.length === 0) return toast('⚠️ Tidak ada data untuk diekspor');
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '2000px';
      container.style.height = '2000px';
      document.body.appendChild(container);
      
      const svgId = 'svg-export-temp';
      container.innerHTML = `<svg id="${svgId}"><style>${TREE_CSS}</style></svg>`;
      
      const indis = [];
      const famsMap = new Map();
      const getFamId = pids => pids.slice().sort().join('-');
      
      members.forEach(m => {
        if(m.spouse_id) {
          const spouse = members.find(s => s.id === m.spouse_id);
          if(spouse) {
            const id = getFamId([m.id, m.spouse_id]);
            if(!famsMap.has(id)) {
              famsMap.set(id, { id, husb: String(m.id), wife: String(spouse.id), children: [] });
            }
          }
        }
        if(m.parentIds?.length) {
          const id = getFamId(m.parentIds);
          if(!famsMap.has(id)) famsMap.set(id, { id, husb: String(m.parentIds[0]), wife: String(m.parentIds[1] || ''), children: [] });
          if (!famsMap.get(id).children.includes(String(m.id))) {
            famsMap.get(id).children.push(String(m.id));
          }
        }
      });
      
      members.forEach(m => {
        const famsForIndi = [];
        famsMap.forEach(f => { if(f.husb===String(m.id) || f.wife===String(m.id)) famsForIndi.push(f.id); });
        indis.push({
          id: String(m.id), firstName: m.name, sex: m.gender==='male'?'M':'F',
          birth: m.born_year ? { date:{year:parseInt(m.born_year)} } : undefined,
          death: m.died_year ? { date:{year:parseInt(m.died_year)} } : undefined,
          famc: m.parentIds?.length ? getFamId(m.parentIds) : undefined,
          fams: famsForIndi.length ? famsForIndi : undefined
        });
      });

      class CustomRenderer extends topola.DetailedRenderer {
        getPreferredIndiSize(id) {
          const size = super.getPreferredIndiSize(id);
          return [size[0] + 45, Math.max(42, size[1] - 8)];
        }
      }

      const chart = topola.createChart({
        json: { indis, fams: Array.from(famsMap.values()) },
        chartType: topola.RelativesChart,
        renderer: CustomRenderer,
        svgSelector: `#${svgId}`,
        indiCallback: () => {}
      });
      chart.render({ startIndi: String(members[0].id) });

      const svgEl = container.querySelector('svg');
      
      // Post-process to add avatars (similar to TreeView)
      d3.select(svgEl).selectAll('g.indi').each(function() {
        const indiG = d3.select(this);
        const bg = indiG.select('rect.background');
        if (bg.empty()) return;
        
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
          .attr('x', 0).attr('y', 0).attr('width', avatarW).attr('height', h)
          .attr('fill', avatarBg).attr('rx', 2).attr('ry', 2);

        indiG.insert('path', '.border')
          .attr('d', 'M17,10 c-3.3,0 -6,2.7 -6,6 c0,3.3 2.7,6 6,6 c3.3,0 6,-2.7 6,-6 c0,-3.3 -2.7,-6 -6,-6 z M17,24 c-6.6,0 -12,3.6 -12,8 v2 h24 v-2 c0,-4.4 -5.4,-8 -12,-8 z')
          .attr('fill', '#ffffff').attr('opacity', 0.85)
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

      const nodeBbox = svgEl.getBBox();
      
      // Add white background covering the whole diagram area
      d3.select(svgEl).insert('rect', ':first-child')
        .attr('x', nodeBbox.x - 20)
        .attr('y', nodeBbox.y - 20)
        .attr('width', nodeBbox.width + 40)
        .attr('height', nodeBbox.height + 40)
        .attr('fill', '#ffffff');

      // Re-calculate BBox after adding background
      const finalBbox = svgEl.getBBox();
      svgEl.setAttribute('viewBox', `${finalBbox.x} ${finalBbox.y} ${finalBbox.width} ${finalBbox.height}`);
      svgEl.setAttribute('width', finalBbox.width);
      svgEl.setAttribute('height', finalBbox.height);
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'family-tree.svg'; a.click();
      
      document.body.removeChild(container);
      toast('✅ Data visual SVG diekspor');
    } catch(e) { console.error(e); toast('❌ Gagal ekspor SVG'); }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', color:'#1e293b' }}>💾 Manajemen Data</h3>
        <p style={{ color: '#64748b', fontSize: 14 }}>Kelola cadangan data silsilah keluarga Anda dengan fitur ekspor dan impor.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20 }}>
        
        <div style={{ background:'#fff', padding:24, borderRadius:20, border:'1.5px solid #e2e8f0', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight:700, color:'#475569', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize: 24 }}>📤</span>
            <div>
              <div style={{ fontSize: 16 }}>Ekspor Data</div>
              <div style={{ fontSize:10, background:'#e2e8f0', padding:'2px 6px', borderRadius:4, width: 'fit-content', marginTop: 2 }}>BACKUP</div>
            </div>
          </div>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:20, lineHeight: 1.5 }}>Unduh data silsilah keluarga Anda untuk cadangan atau digunakan di aplikasi lain.</p>
          <div style={{ display:'flex', flexDirection: 'column', gap:12 }}>
            <button onClick={handleExportJson} style={{ width: '100%', padding:'12px', borderRadius:12, border:'2px solid #6366f1', color:'#6366f1', background:'transparent', fontWeight:700, cursor:'pointer', fontSize:13, transition: 'all 0.2s' }}>
              EKSPOR JSON
            </button>
            <button onClick={handleExportGedcom} style={{ width: '100%', padding:'12px', borderRadius:12, border:'2px solid #10b981', color:'#10b981', background:'transparent', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              EKSPOR GEDCOM
            </button>
            <button onClick={handleExportSvg} style={{ width: '100%', padding:'12px', borderRadius:12, border:'2px solid #ef4444', color:'#ef4444', background:'transparent', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              EKSPOR SVG (VISUAL)
            </button>
          </div>
        </div>

        <div style={{ background:'#fff', padding:24, borderRadius:20, border:'1.5px solid #e2e8f0', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontWeight:700, color:'#475569', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize: 24 }}>📥</span>
            <div>
              <div style={{ fontSize: 16 }}>Impor Data</div>
              <div style={{ fontSize:10, background:'#fee2e2', color:'#ef4444', padding:'2px 6px', borderRadius:4, width: 'fit-content', marginTop: 2 }}>BERBAHAYA</div>
            </div>
          </div>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:20, lineHeight: 1.5 }}>Unggah data silsilah. <strong style={{ color: '#ef4444' }}>Hati-hati:</strong> Ini akan menghapus dan menimpa SEMUA data yang ada saat ini!</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <label style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:'#f8fafc', border:'2px dashed #cbd5e1', cursor:'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontSize:20 }}>📄</span>
              <span style={{ flex:1, fontSize:13, fontWeight:600 }}>Pilih Berkas JSON</span>
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display:'none' }} />
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, background:'#f0fdf4', border:'2px dashed #bbf7d0', cursor:'pointer' }}>
              <span style={{ fontSize:20 }}>📜</span>
              <span style={{ flex:1, fontSize:13, fontWeight:600 }}>Pilih Berkas GEDCOM</span>
              <input type="file" accept=".ged" onChange={handleImportGedcom} style={{ display:'none' }} />
            </label>
          </div>
        </div>

      </div>
      
      <div style={{ marginTop: 30, background: '#fefce8', padding: 16, borderRadius: 12, border: '1px solid #fef08a', display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <p style={{ fontSize: 12, color: '#854d0e', margin: 0, lineHeight: 1.5 }}>
          Disarankan untuk melakukan ekspor data secara berkala sebagai cadangan sebelum melakukan perubahan besar atau melakukan impor data baru.
        </p>
      </div>
    </div>
  );
}
