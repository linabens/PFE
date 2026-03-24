// TND (dinar tunisien) utilise les millimes: 1 TND = 1000 millimes.
function toMillimes(value) {
  if (value === undefined || value === null) return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000);
}

function fromMillimes(millimes) {
  const n = Number(millimes);
  if (!Number.isFinite(n)) return '0.00';
  return (n / 1000).toFixed(3);
}

module.exports = { toMillimes, fromMillimes };

