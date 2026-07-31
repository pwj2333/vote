const DEFAULT_VOTING_DURATION_SECONDS = 210;
const MIN_VOTING_DURATION_SECONDS = 1;
const MAX_VOTING_DURATION_SECONDS = 24 * 60 * 60;

function normalizeVotingDurationSeconds(value) {
  const seconds = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (!Number.isInteger(seconds)) {
    throw new Error('Voting duration must use whole seconds.');
  }

  if (seconds < MIN_VOTING_DURATION_SECONDS || seconds > MAX_VOTING_DURATION_SECONDS) {
    throw new Error(`Voting duration must be between ${MIN_VOTING_DURATION_SECONDS} and ${MAX_VOTING_DURATION_SECONDS} seconds.`);
  }

  return seconds;
}

function getVotingDurationSeconds(value) {
  try {
    return normalizeVotingDurationSeconds(value);
  } catch {
    return DEFAULT_VOTING_DURATION_SECONDS;
  }
}

module.exports = {
  DEFAULT_VOTING_DURATION_SECONDS,
  getVotingDurationSeconds,
  normalizeVotingDurationSeconds,
};
