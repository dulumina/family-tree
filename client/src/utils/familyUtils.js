
export const getFamilies = (members) => {
  if (!members || members.length === 0) return [];

  const allIds = new Set(members.map(m => m.id));

  // 1. Find all roots: males with no parents in the dataset
  const roots = members.filter(m =>
    m.gender === 'male' &&
    (!m.parentIds || m.parentIds.length === 0 || m.parentIds.every(pid => !allIds.has(pid)))
  );

  // If no male roots found, return all as one family or empty
  if (roots.length === 0) {
    if (members.length > 0) return [{ root: members[0], members }];
    return [];
  }

  // 2. For each root, collect all bloodline descendants (downward BFS via parentIds)
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

  // 3. Build each family: bloodline + their spouses
  const result = roots.map(root => {
    const bloodlineIds = getBloodlineIds(root.id);

    // Add spouses of every bloodline member
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

  // Sort by largest member count
  result.sort((a, b) => b.members.length - a.members.length);
  return result;
};
