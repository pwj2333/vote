const test = require('node:test');
const assert = require('node:assert/strict');
const {
  clampRemainingSeconds,
  formatCountdown,
  COUNTDOWN_MAX_SECONDS,
} = require('../public/js/countdown-utils');

test('formats a normal remaining time as m:ss', () => {
  assert.equal(formatCountdown(3 * 60 * 1000), '3:00');
  assert.equal(formatCountdown(125 * 1000), '2:05');
  assert.equal(formatCountdown(9 * 1000), '0:09');
});

test('never shows more than the total voting duration', () => {
  // 浏览器时钟比服务器慢 30 秒时，旧实现会算出 210 秒并显示 3:30
  assert.equal(formatCountdown(210 * 1000), '3:00');
  assert.equal(formatCountdown(10 * 60 * 1000), '3:00');
  assert.equal(clampRemainingSeconds(210 * 1000), COUNTDOWN_MAX_SECONDS);
});

test('clamps negative, zero and invalid values to 0:00', () => {
  assert.equal(formatCountdown(0), '0:00');
  assert.equal(formatCountdown(-5000), '0:00');
  assert.equal(formatCountdown(NaN), '0:00');
  assert.equal(formatCountdown(undefined), '0:00');
  assert.equal(clampRemainingSeconds(-1), 0);
});

test('honours a custom maximum duration', () => {
  assert.equal(formatCountdown(600 * 1000, 300), '5:00');
  assert.equal(clampRemainingSeconds(600 * 1000, 300), 300);
});
