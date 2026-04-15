const crypto = require('crypto');
const config = require('../config');

/**
 * Vérifie la signature HMAC d'un scan QR : sig = HMAC-SHA256(`${qr_code}|${ts}`, secret) en hex.
 * ts = epoch secondes ; valide si |now - ts| <= maxSkewSec (défaut 600s).
 */
function verifyQrScanSignature(qrCode, ts, sig, maxSkewSec = 600) {
  if (!qrCode || ts === undefined || ts === null || !sig) return false;
  const t = typeof ts === 'string' ? parseInt(ts, 10) : ts;
  if (!Number.isFinite(t)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - t) > maxSkewSec) return false;

  const secret = config.jwtSecret;
  const expected = crypto.createHmac('sha256', secret).update(`${qrCode}|${t}`).digest('hex');

  try {
    const a = Buffer.from(String(sig), 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Utile pour générer un lien QR côté admin / script (même secret que verify).
 */
function signQrScanPayload(qrCode, tsSec = Math.floor(Date.now() / 1000)) {
  const secret = config.jwtSecret;
  const sig = crypto.createHmac('sha256', secret).update(`${qrCode}|${tsSec}`).digest('hex');
  return { ts: tsSec, sig };
}

module.exports = { verifyQrScanSignature, signQrScanPayload };
