const http = require('http');
async function test() {
  const resp = await fetch('http://localhost:6001/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'test', email: 'test@test.com', password: 'password123' })
  });
  const data = await resp.json();
  const token = data.data?.access_token || data.access_token;
  if (!token) {
    const login = await fetch('http://localhost:6001/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
    });
    const loginData = await login.json();
    var finalToken = loginData.data?.access_token || loginData.access_token;
  } else {
    finalToken = token;
  }
  
  const cust = await fetch('http://localhost:6001/v1/customers?page=1&limit=5', {
    headers: { 'Authorization': `Bearer ${finalToken}` }
  });
  console.log(await cust.json());
}
test();
