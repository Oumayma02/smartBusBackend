const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const app = require('../app');

test('GET /api/health reports database readiness accurately', async () => {
  const originalReadyState = mongoose.connection.readyState;
  const server = app.listen(0, '127.0.0.1');

  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    const url = `http://127.0.0.1:${server.address().port}/api/health`;

    mongoose.connection.readyState = 1;

    const healthyResponse = await fetch(url);
    assert.equal(healthyResponse.status, 200);
    assert.deepEqual(await healthyResponse.json(), {
      status: 'ok',
      database: 'connected',
    });

    mongoose.connection.readyState = 0;

    const unhealthyResponse = await fetch(url);
    assert.equal(unhealthyResponse.status, 503);
    assert.deepEqual(await unhealthyResponse.json(), {
      status: 'unavailable',
      database: 'disconnected',
    });
  } finally {
    mongoose.connection.readyState = originalReadyState;

    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
