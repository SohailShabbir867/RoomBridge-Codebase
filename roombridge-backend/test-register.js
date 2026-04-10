const http = require('http');
const data = JSON.stringify({
  name: 'Test User',
  email: 'testuser123@test.com',
  password: 'Test@1234',
  role: 'seeker',
  phone: '03001234567',
  city: 'Lahore'
});

const opts = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  }
};

const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
  });
});
req.write(data);
req.end();
