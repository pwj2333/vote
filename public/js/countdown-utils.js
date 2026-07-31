// 倒计时纯函数工具
// 服务端只下发剩余秒数，客户端负责换算与格式化，避免依赖浏览器与服务器时钟一致

const COUNTDOWN_MAX_SECONDS = 3 * 60;

// 把剩余毫秒裁剪到 [0, maxSeconds] 区间内的整秒
// 防止时钟偏差或异常返回值导致显示超过投票总时长（例如 3:30）
function clampRemainingSeconds(remainingMs, maxSeconds = COUNTDOWN_MAX_SECONDS) {
  const seconds = Math.floor(Number(remainingMs) / 1000);
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.min(seconds, maxSeconds);
}

// 格式化为 m:ss
function formatCountdown(remainingMs, maxSeconds = COUNTDOWN_MAX_SECONDS) {
  const seconds = clampRemainingSeconds(remainingMs, maxSeconds);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

if (typeof module !== 'undefined') {
  module.exports = { clampRemainingSeconds, formatCountdown, COUNTDOWN_MAX_SECONDS };
}
