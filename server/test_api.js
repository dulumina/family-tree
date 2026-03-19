const BASE_URL = 'http://localhost:3001/api';
let token = '';

async function test() {
  console.log('--- Testing API (using fetch) ---');

  try {
    // 1. Login
    console.log('\n[1] Login as admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@keluarga.id',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
    token = loginData.token;
    console.log('✅ Login success. Role:', loginData.user.role);

    const authHeader = { 'Authorization': `Bearer ${token}` };

    // 2. Get Members
    console.log('\n[2] Get all members...');
    const membersRes = await fetch(`${BASE_URL}/members`, { headers: authHeader });
    const membersData = await membersRes.json();
    if (!membersRes.ok) throw new Error(JSON.stringify(membersData));
    console.log('✅ Got', membersData.length, 'members.');

    // 3. Create a test member
    console.log('\n[3] Create test member...');
    const newMember = {
      name: 'Test Member',
      gender: 'male',
      generation: 0,
      photo: '👤'
    };
    const createRes = await fetch(`${BASE_URL}/members`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(JSON.stringify(createData));
    const testMemberId = createData.id;
    console.log('✅ Created member with ID:', testMemberId);

    // 4. Update member (add parent)
    console.log('\n[4] Update member (add parent)...');
    // Let's use Kakek Sutarno (ID 1) as parent
    const updateRes = await fetch(`${BASE_URL}/members/${testMemberId}`, {
      method: 'PUT',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newMember,
        parentIds: [1]
      })
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(JSON.stringify(updateData));
    console.log('✅ Updated member parents:', updateData.parentIds);

    // 5. Get Users (Admin only)
    console.log('\n[5] Get users (Admin only)...');
    const usersRes = await fetch(`${BASE_URL}/users`, { headers: authHeader });
    const usersData = await usersRes.json();
    if (!usersRes.ok) throw new Error(JSON.stringify(usersData));
    console.log('✅ Got', usersData.length, 'users.');

    // 6. Delete test member
    console.log('\n[6] Delete test member...');
    const delRes = await fetch(`${BASE_URL}/members/${testMemberId}`, {
      method: 'DELETE',
      headers: authHeader
    });
    if (!delRes.ok) throw new Error(await delRes.text());
    console.log('✅ Deleted test member.');

    console.log('\n🎉 ALL TESTS PASSED!');
  } catch (err) {
    console.error('\n❌ TEST FAILED!');
    console.error(err.message);
    process.exit(1);
  }
}

test();
