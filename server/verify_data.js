const BASE_URL = 'http://localhost:3001/api';

async function verifyData() {
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@keluarga.id', password: 'admin123' })
  });
  const { token } = await loginRes.json();
  
  const membersRes = await fetch(`${BASE_URL}/members`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const members = await membersRes.json();
  
  console.log('--- Data Verification ---');
  members.forEach(m => {
    console.log(`ID: ${m.id}, Name: ${m.name}, Parents: ${JSON.stringify(m.parentIds)}, Spouse: ${m.spouse_id}`);
    if (m.parentIds.some(pid => typeof pid !== 'number')) console.log('⚠️ Parent ID is not a number!');
    if (m.spouse_id && typeof m.spouse_id !== 'number') console.log('⚠️ Spouse ID is not a number!');
  });
}

verifyData();
