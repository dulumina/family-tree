/**
 * Utilitas perhitungan MAHROM berdasarkan fiqih Islam
 *
 * MAHROM (bagi seorang laki-laki) adalah:
 * 1. Ibu, nenek, dst (garis ke atas)
 * 2. Anak perempuan, cucu perempuan, dst (garis ke bawah)
 * 3. Saudara perempuan (sekandung / seayah / seibu)
 * 4. Bibi (saudara perempuan ayah atau ibu), dan seterusnya ke atas
 * 5. Keponakan perempuan (anak perempuan dari saudara laki-laki/perempuan) dan seterusnya ke bawah
 * 6. Ibu mertua, nenek mertua
 * 7. Anak/cucu perempuan tiri (anak istri dari suami lain)
 * 8. Menantu perempuan (istri anak laki-laki)
 *
 * Catatan: Mahrom berlaku antara laki-laki dgn perempuan. Sesama gender tidak relevan.
 * Fungsi ini menghitung: dari perspektif `person`, apakah `other` mahrom baginya?
 */

/**
 * Bangun map id -> member dan hubungan lengkap
 */
function buildMap(members) {
  const map = {};
  members.forEach(m => { map[m.id] = m; });
  return map;
}

/**
 * Dapatkan semua ancestor (leluhur) dari seorang member.
 * Returns: Set of ids, dengan kedalaman (depth) ke-n
 * depth 1 = orang tua, 2 = kakek/nenek, dst
 */
function getAncestors(id, map, maxDepth = 20) {
  const result = new Map(); // id -> depth
  const queue = [{ id, depth: 0 }];
  const visited = new Set();
  while (queue.length > 0) {
    const { id: curr, depth } = queue.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    const member = map[curr];
    if (!member) continue;
    const parentIds = member.parentIds || [];
    parentIds.forEach(pid => {
      if (map[pid] && !visited.has(pid) && depth + 1 <= maxDepth) {
        result.set(pid, depth + 1);
        queue.push({ id: pid, depth: depth + 1 });
      }
    });
  }
  return result;
}

/**
 * Dapatkan semua descendant (keturunan) dari seorang member.
 * Returns: Map of id -> depth
 */
function getDescendants(id, map, members, maxDepth = 20) {
  const result = new Map(); // id -> depth
  const queue = [{ id, depth: 0 }];
  const visited = new Set();
  while (queue.length > 0) {
    const { id: curr, depth } = queue.shift();
    if (visited.has(curr)) continue;
    visited.add(curr);
    members.forEach(m => {
      if (!visited.has(m.id) && m.parentIds && m.parentIds.includes(curr) && depth + 1 <= maxDepth) {
        result.set(m.id, depth + 1);
        queue.push({ id: m.id, depth: depth + 1 });
      }
    });
  }
  return result;
}

/**
 * Tentukan label hubungan antara `person` dan `other` dari perspektif mahrom
 * Returns: { isMahrom: boolean, reason: string, category: string } | null (jika sama gender)
 */
export function getMahromStatus(person, other, members) {
  if (!person || !other || person.id === other.id) return null;

  const map = buildMap(members);

  // Tentukan siapa yg laki-laki & perempuan
  // Mahrom hanya relevan antar beda gender
  const isPersonMale = person.gender === 'male';
  const isOtherMale = other.gender === 'male';

  // Jika sesama gender → tidak relevan
  if (isPersonMale === isOtherMale) {
    return {
      isMahrom: null,
      reason: 'Sesama gender — konsep mahrom tidak berlaku',
      category: 'same_gender',
    };
  }

  // Dari perspektif laki-laki terhadap perempuan
  // male = person yg kita hitung mahrom-nya, female = kandidat
  const male = isPersonMale ? person : other;
  const female = isPersonMale ? other : person;

  // 1. Cek: apakah female adalah ISTRI / mantan istri?
  if (male.spouse_id === female.id || female.spouse_id === male.id) {
    return { isMahrom: true, reason: 'Istri (halal dinikahi, bukan mahrom tp boleh bersama)', category: 'spouse' };
  }

  const maleAncestors = getAncestors(male.id, map);
  const femaleAncestors = getAncestors(female.id, map);
  const maleDescendants = getDescendants(male.id, map, members);
  const femaleDescendants = getDescendants(female.id, map, members);

  // 2. IBU / NENEK female adalah leluhur laki-laki
  if (femaleDescendants.has(male.id)) {
    const depth = femaleDescendants.get(male.id);
    if (depth === 1) return { isMahrom: true, reason: 'Ibu kandung', category: 'direct_ascendant' };
    if (depth === 2) return { isMahrom: true, reason: 'Nenek', category: 'direct_ascendant' };
    return { isMahrom: true, reason: `Leluhur perempuan (${depth} tingkat ke atas)`, category: 'direct_ascendant' };
  }

  // 3. ANAK / CUCU female adalah keturunan laki-laki
  if (maleDescendants.has(female.id)) {
    const depth = maleDescendants.get(female.id);
    if (depth === 1) return { isMahrom: true, reason: 'Anak perempuan kandung', category: 'direct_descendant' };
    if (depth === 2) return { isMahrom: true, reason: 'Cucu perempuan', category: 'direct_descendant' };
    return { isMahrom: true, reason: `Keturunan perempuan (${depth} tingkat ke bawah)`, category: 'direct_descendant' };
  }

  // 4. SAUDARA PEREMPUAN: berbagi minimal 1 orang tua yang sama
  const malePIDs = new Set(male.parentIds || []);
  const femalePIDs = new Set(female.parentIds || []);
  const sharedParents = [...malePIDs].filter(p => femalePIDs.has(p));
  if (sharedParents.length > 0) {
    const maleParents = (male.parentIds || []).map(pid => map[pid]).filter(Boolean);
    const femaleParents = (female.parentIds || []).map(pid => map[pid]).filter(Boolean);
    const bothParentsShared = maleParents.length >= 2 && femaleParents.length >= 2 && sharedParents.length >= 2;
    if (bothParentsShared) return { isMahrom: true, reason: 'Saudara perempuan sekandung', category: 'sibling' };
    return { isMahrom: true, reason: 'Saudara perempuan seayah atau seibu', category: 'sibling' };
  }

  // 5. BIBI (saudara perempuan ayah/ibu):
  // female adalah saudara dari salah satu leluhur male
  for (const [ancId, ancDepth] of maleAncestors) {
    const anc = map[ancId];
    if (!anc) continue;
    // cek apakah female adalah saudara dari anc
    const ancPIDs = new Set(anc.parentIds || []);
    const femalePIDsArr = female.parentIds || [];
    const shared = femalePIDsArr.filter(p => ancPIDs.has(p));
    if (shared.length > 0) {
      if (ancDepth === 1) return { isMahrom: true, reason: `Bibi (saudara perempuan ${anc.gender === 'male' ? 'ayah' : 'ibu'})`, category: 'aunt' };
      return { isMahrom: true, reason: `Bibi jauh (saudara perempuan leluhur ${ancDepth} tingkat)`, category: 'aunt' };
    }
  }

  // 6. KEPONAKAN PEREMPUAN (anak perempuan saudara laki-laki/perempuan):
  // female adalah keturunan dari seseorang yang berbagi orang tua dengan male
  const maleSiblings = members.filter(m => {
    if (m.id === male.id) return false;
    const sibPIDs = new Set(m.parentIds || []);
    return [...malePIDs].some(p => sibPIDs.has(p));
  });
  for (const sib of maleSiblings) {
    const sibDescendants = getDescendants(sib.id, map, members);
    if (sibDescendants.has(female.id)) {
      const depth = sibDescendants.get(female.id);
      if (depth === 1) return { isMahrom: true, reason: `Keponakan perempuan (anak dari saudara ${sib.gender === 'male' ? 'laki-laki' : 'perempuan'} ${sib.name})`, category: 'niece' };
      return { isMahrom: true, reason: `Keponakan jauh perempuan (${depth} tingkat dari ${sib.name})`, category: 'niece' };
    }
  }

  // 7. IBU MERTUA (ibu dari istri):
  const wife = map[male.spouse_id];
  if (wife) {
    const wifeAncestors = getAncestors(wife.id, map);
    if (wifeAncestors.has(female.id)) {
      const depth = wifeAncestors.get(female.id);
      if (depth === 1) return { isMahrom: true, reason: 'Ibu mertua (ibu dari istri)', category: 'in_law' };
      return { isMahrom: true, reason: `Mertua jauh (${depth} tingkat leluhur istri)`, category: 'in_law' };
    }

    // 8. ANAK TIRI (anak istri dari suami lain):
    const wifeDescendants = getDescendants(wife.id, map, members);
    if (wifeDescendants.has(female.id)) {
      const depth = wifeDescendants.get(female.id);
      // pastikan bukan anak kandung male juga
      if (!maleDescendants.has(female.id)) {
        if (depth === 1) return { isMahrom: true, reason: 'Anak perempuan tiri (anak istri dari suami lain)', category: 'step_child' };
        return { isMahrom: true, reason: `Keturunan perempuan tiri (${depth} tingkat ke bawah dari istri)`, category: 'step_child' };
      }
    }
  }

  // 9. MENANTU PEREMPUAN (istri dari anak laki-laki):
  const maleSons = members.filter(m => m.gender === 'male' && maleDescendants.has(m.id) && maleDescendants.get(m.id) === 1);
  for (const son of maleSons) {
    if (son.spouse_id === female.id || female.spouse_id === son.id) {
      return { isMahrom: true, reason: `Menantu perempuan (istri dari ${son.name})`, category: 'in_law' };
    }
    const sonSpouse = map[son.spouse_id];
    if (sonSpouse && sonSpouse.id === female.id) {
      return { isMahrom: true, reason: `Menantu perempuan (istri dari ${son.name})`, category: 'in_law' };
    }
  }

  // Cek ada hubungan darah tidak langsung (sepupu, dll) untuk info
  // Cari common ancestor
  let commonAncestor = null;
  let minDist = Infinity;
  for (const [ancId] of maleAncestors) {
    if (femaleAncestors.has(ancId)) {
      const dist = maleAncestors.get(ancId) + femaleAncestors.get(ancId);
      if (dist < minDist) {
        minDist = dist;
        commonAncestor = map[ancId];
      }
    }
  }

  if (commonAncestor) {
    const md = maleAncestors.get(commonAncestor.id);
    const fd = femaleAncestors.get(commonAncestor.id);
    let rel = 'Kerabat jauh';
    if (md === 1 && fd === 1) rel = 'Sepupu pertama';
    else if ((md === 1 && fd === 2) || (md === 2 && fd === 1)) rel = 'Sepupu satu kali dibuang';
    else rel = `Kerabat dengan jarak ${md + fd} dari ${commonAncestor.name}`;
    return { isMahrom: false, reason: rel + ' — boleh menikah', category: 'relative_non_mahrom' };
  }

  return { isMahrom: false, reason: 'Tidak ada hubungan kekerabatan yang ditemukan — boleh menikah', category: 'non_relative' };
}

/**
 * Kategorikan semua anggota dari perspektif `person`
 * Returns: { mahrom: [...], bukan_mahrom: [...], tidak_relevan: [...] }
 */
export function categorizeMahrom(person, allMembers) {
  const others = allMembers.filter(m => m.id !== person.id);
  const mahrom = [];
  const bukan_mahrom = [];
  const tidak_relevan = [];

  others.forEach(other => {
    const status = getMahromStatus(person, other, allMembers);
    if (!status) return;
    if (status.category === 'same_gender') {
      tidak_relevan.push({ member: other, ...status });
    } else if (status.isMahrom === true) {
      mahrom.push({ member: other, ...status });
    } else {
      bukan_mahrom.push({ member: other, ...status });
    }
  });

  return { mahrom, bukan_mahrom, tidak_relevan };
}
