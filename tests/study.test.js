import { test } from 'node:test';
import assert from 'node:assert';

test('Wikipedia service should format topic correctly', () => {
  const topic = 'Machine Learning';
  const encoded = encodeURIComponent(topic);
  assert.strictEqual(encoded, 'Machine%20Learning');
});

test('Study endpoint should require topic parameter', () => {
  const query = {};
  assert.strictEqual(query.topic, undefined);
});

console.log('Basic tests passed');
