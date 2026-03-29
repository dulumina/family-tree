/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { categorizeMahrom } from '../../utils/mahromUtils';
import useMobile from '../../hooks/useMobile';

const CATEGORY_ICONS = {
  direct_ascendant: '⬆️',
  direct_descendant: '⬇️',
  sibling: '↔️',
  aunt: '👵',
  niece: '👧',
  in_law: '💍',
  step_child: '🏠',
  spouse: '💑',
  relative_non_mahrom: '🔗',
  non_relative: '👤',
};

const CATEGORY_LABELS = {
  direct_ascendant: 'Leluhur',
  direct_descendant: 'Keturunan',
  sibling: 'Saudara',
  aunt: 'Bibi/Paman',
  niece: 'Keponakan',
  in_law: 'Ipar/Mertua',
  step_child: 'Anak Tiri',
  spouse: 'Pasangan',
  relative_non_mahrom: 'Kerabat',
  non_relative: 'Lainnya',
};

function MemberBadge({ item, gender }) {
  const bgColor = item.member.gender === 'male' ? '#e0eaf0' : '#fce8ec';
  const textColor = item.member.gender === 'male' ? '#2d6a8a' : '#8a2d3d';
  const icon = item.member.gender === 'male' ? '♂' : '♀';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '8px 10px',
      borderRadius: 10,
      background: bgColor,
      marginBottom: 6,
    }}>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: textColor,
        minWidth: 16,
        marginTop: 1,
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', lineHeight: 1.3 }}>
          {item.member.name}
          {item.member.born_year && (
            <span style={{ fontWeight: 400, color: '#64748b', fontSize: 11, marginLeft: 4 }}>
              ({item.member.born_year})
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 1.3 }}>
          {CATEGORY_ICONS[item.category] || '•'} {item.reason}
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, bgColor, borderColor, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      marginBottom: 12,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: bgColor,
          border: 'none',
          cursor: 'pointer',
          gap: 6,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color }}>{title}</span>
        </span>
        <span style={{ fontSize: 12, color, fontWeight: 600 }}>
          {children.props?.children?.length || 0} {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '10px 12px', background: '#fff' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function MahromPanel({ person, allMembers }) {
  const isMobile = useMobile();
  const { mahrom, bukan_mahrom } = useMemo(
    () => categorizeMahrom(person, allMembers),
    [person, allMembers]
  );

  const isMale = person.gender === 'male';
  const isFemale = person.gender === 'female';

  if (!isMale && !isFemale) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        Gender tidak diketahui. Tidak dapat menghitung mahrom.
      </div>
    );
  }

  // Urutkan mahrom berdasarkan kategori prioritas
  const categoryOrder = ['direct_ascendant', 'direct_descendant', 'sibling', 'aunt', 'niece', 'in_law', 'step_child', 'spouse'];
  const sortedMahrom = [...mahrom].sort((a, b) =>
    (categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
  );

  // Pisahkan bukan mahrom: kerabat vs orang lain
  const kerabatBukanMahrom = bukan_mahrom.filter(i => i.category === 'relative_non_mahrom');
  const lainBukanMahrom = bukan_mahrom.filter(i => i.category !== 'relative_non_mahrom');

  return (
    <div>
      {/* Info header */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1.5px solid #86efac',
        borderRadius: 12,
        padding: '10px 14px',
        marginBottom: 14,
        fontSize: 12,
        color: '#15803d',
        lineHeight: 1.6,
      }}>
        <strong>Perspektif:</strong> Mahrom dari sisi <strong>{person.name}</strong>{' '}
        ({isMale ? 'Laki-laki' : 'Perempuan'}). Dihitung berdasarkan fiqih Islam.
      </div>

      {/* MAHROM */}
      <div style={{
        marginBottom: 12,
        border: '1.5px solid #fca5a5',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#fef2f2',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: isMobile ? 16 : 18 }}>🚫</span>
            <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: '#dc2626' }}>
              {isMobile ? 'MAHROM' : 'MAHROM'} ({sortedMahrom.length})
            </span>
          </span>
          <span style={{
            fontSize: isMobile ? 9 : 10,
            background: '#dc2626',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 999,
            fontWeight: 700,
          }}>{isMobile ? '🚫 Haram' : 'Haram dinikahi'}</span>
        </div>
        <div style={{ padding: '10px 12px', background: '#fff' }}>
          {sortedMahrom.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: 8 }}>
              Tidak ada mahrom terdeteksi
            </div>
          ) : (
            sortedMahrom.map((item, i) => (
              <MemberBadge key={item.member.id + '-' + i} item={item} />
            ))
          )}
        </div>
      </div>

      {/* BUKAN MAHROM - Kerabat */}
      {kerabatBukanMahrom.length > 0 && (
        <div style={{
          marginBottom: 12,
          border: '1.5px solid #93c5fd',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#eff6ff',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: isMobile ? 16 : 18 }}>✅</span>
              <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: '#1d4ed8' }}>
                {isMobile ? 'NON-MAHROM' : 'BUKAN MAHROM'} ({kerabatBukanMahrom.length})
              </span>
            </span>
            <span style={{
              fontSize: isMobile ? 9 : 10,
              background: '#1d4ed8',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 700,
            }}>{isMobile ? '✅ Boleh' : 'Boleh menikah'}</span>
          </div>
          <div style={{ padding: '10px 12px', background: '#fff' }}>
            {kerabatBukanMahrom.map((item, i) => (
              <MemberBadge key={item.member.id + '-k-' + i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* BUKAN MAHROM - Lainnya (tidak ada hubungan) */}
      {lainBukanMahrom.length > 0 && (
        <div style={{
          marginBottom: 12,
          border: '1.5px solid #d1d5db',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#f9fafb',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
                BUKAN MAHROM — Lainnya ({lainBukanMahrom.length})
              </span>
            </span>
            <span style={{
              fontSize: 10,
              background: '#6b7280',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 700,
            }}>Boleh menikah</span>
          </div>
          <div style={{ padding: '10px 12px', background: '#fff' }}>
            {lainBukanMahrom.map((item, i) => (
              <MemberBadge key={item.member.id + '-l-' + i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Catatan fiqih */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: 10,
        padding: '10px 12px',
        fontSize: 11,
        color: '#92400e',
        lineHeight: 1.6,
      }}>
        <strong>📋 Keterangan:</strong> Mahrom dihitung berdasarkan nasab (keturunan), 
        mushaharah (pernikahan), dan rodho'ah (persusuan — tidak terdeteksi otomatis). 
        Konsultasikan dengan ulama untuk kepastian hukum.
      </div>
    </div>
  );
}
