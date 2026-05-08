/**
 * EmbeddingService — local embeddings via @xenova/transformers.
 * Model: multilingual-e5-small → 384-dim vectors, runs fully offline.
 * Downloads ~120 MB from HuggingFace on first use, then cached locally.
 */

const { pipeline, env } = require('@xenova/transformers');

// Store model cache next to this file so it survives npm ci
env.cacheDir = require('path').join(__dirname, '../../.model-cache');

const MODEL = 'Xenova/multilingual-e5-small';

let _extractor = null;

async function getExtractor() {
  if (!_extractor) {
    console.log('   [EmbeddingService] Loading model (first run downloads ~120 MB)...');
    _extractor = await pipeline('feature-extraction', MODEL);
    console.log('   [EmbeddingService] Model ready.');
  }
  return _extractor;
}

/**
 * Converts text to a 384-dimensional embedding vector.
 * Handles French, Arabic, and English.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embed(text) {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data); // Float32Array → plain number[]
}

/**
 * Cosine similarity between two equal-length vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} 0–1
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { embed, cosineSimilarity };
