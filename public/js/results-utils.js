function getVisibleStats(stats) {
  return Array.isArray(stats) ? stats.slice(0, 3) : [];
}

if (typeof module !== 'undefined') {
  module.exports = { getVisibleStats };
}
