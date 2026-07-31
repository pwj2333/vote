const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_VOTING_DURATION_SECONDS,
  getVotingDurationSeconds,
  normalizeVotingDurationSeconds,
} = require('../voting-duration');

test('defaults the voting duration to three minutes and thirty seconds', () => {
  assert.equal(DEFAULT_VOTING_DURATION_SECONDS, 210);
  assert.equal(getVotingDurationSeconds(null), 210);
  assert.equal(getVotingDurationSeconds('invalid'), 210);
});

test('normalizes valid whole-second durations', () => {
  assert.equal(normalizeVotingDurationSeconds('210'), 210);
  assert.equal(normalizeVotingDurationSeconds(420), 420);
});

test('rejects durations outside the supported range', () => {
  assert.throws(() => normalizeVotingDurationSeconds(0), /between/);
  assert.throws(() => normalizeVotingDurationSeconds(86401), /between/);
  assert.throws(() => normalizeVotingDurationSeconds(3.5), /whole seconds/);
});
