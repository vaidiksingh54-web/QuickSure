import http from 'http';
import app from '../src/app.js';

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`Test server running on ephemeral port ${port}`);

  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Health Payload:', JSON.stringify(data, null, 2));

    if (res.status === 200 && data.success === true && data.data.service === 'quicksure-api') {
      console.log('✅ HEALTH CHECK PASSED: Stage 1 API Gateway handshake verified successfully!');
      server.close(() => process.exit(0));
    } else {
      console.error('❌ HEALTH CHECK FAILED: Unexpected response format');
      server.close(() => process.exit(1));
    }
  } catch (err) {
    console.error('❌ HEALTH CHECK FAILED WITH ERROR:', err);
    server.close(() => process.exit(1));
  }
});
