const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');

test('GET /api/health returns 503 when MongoDB is not connected', async () => {
  const response = await request(app)
    .get('/api/health');

  assert.equal(response.status, 503);
  assert.equal(response.body.status, 'error');
  assert.equal(response.body.database, 'disconnected');
});
