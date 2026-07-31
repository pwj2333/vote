const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { getVisibleStats } = require('../public/js/results-utils');

test('returns only the first three departments for the public results page', () => {
  const stats = [
    { name: 'first', votes: 5 },
    { name: 'second', votes: 4 },
    { name: 'third', votes: 3 },
    { name: 'fourth', votes: 2 },
  ];

  assert.deepEqual(getVisibleStats(stats), stats.slice(0, 3));
});

test('keeps shorter and empty result sets unchanged', () => {
  const stats = [{ name: 'first', votes: 1 }];

  assert.deepEqual(getVisibleStats(stats), stats);
  assert.deepEqual(getVisibleStats([]), []);
});

test('version-busts the public results scripts', () => {
  const html = fs.readFileSync('views/results.html', 'utf8');

  assert.match(html, /\/js\/results-utils\.js\?v=[^"']+/);
  assert.match(html, /\/js\/results\.js\?v=[^"']+/);
});
