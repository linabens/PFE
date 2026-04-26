const Parser = require('rss-parser');

// RSS feeds per category
const FEEDS = {
  general:    ['https://www.aljazeera.net/aljazeerarss/all/rss.xml'],
  sports:     ['https://www.aljazeera.net/aljazeerarss/sports/rss.xml'],
  technology: ['https://www.aljazeera.net/aljazeerarss/technology/rss.xml'],
};

// Cache TTL: 2 hours
const CACHE_TTL = 2 * 60 * 60 * 1000;

class NewsService {
  constructor() {
    this.parser = new Parser();
    this.cache = {};  // { category: { data, timestamp } }
  }

  /**
   * Fetch articles by category — uses in-memory cache (2h TTL)
   */
  async fetch(category = 'general', limit = 20) {
    const cached = this.cache[category];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data.slice(0, limit);
    }

    const feedUrls = FEEDS[category] || FEEDS.general;
    const articles = [];

    for (const url of feedUrls) {
      try {
        const feed = await this.parser.parseURL(url);
        articles.push(
          ...feed.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            contentSnippet: item.contentSnippet || '',
            source: feed.title || url,
          }))
        );
      } catch (err) {
        // Graceful degradation — skip failed feeds
        console.warn(`⚠️ RSS feed failed (${url}):`, err.message);
      }
    }

    // Sort by date descending
    articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Cache the result
    this.cache[category] = { data: articles, timestamp: Date.now() };

    return articles.slice(0, limit);
  }

  /**
   * Force refresh all cached categories
   */
  async refreshAll() {
    const categories = Object.keys(FEEDS);
    const results = {};

    for (const category of categories) {
      // Clear cache for this category to force re-fetch
      delete this.cache[category];
      try {
        const articles = await this.fetch(category);
        results[category] = { count: articles.length, status: 'ok' };
      } catch (err) {
        results[category] = { count: 0, status: 'error', error: err.message };
      }
    }

    return { refreshed_at: new Date().toISOString(), categories: results };
  }

  /**
   * Get cache status for all categories
   */
  getCacheStatus() {
    const status = {};
    for (const [category, entry] of Object.entries(this.cache)) {
      const age = Date.now() - entry.timestamp;
      status[category] = {
        cached: true,
        articles: entry.data.length,
        age_minutes: Math.round(age / 60000),
        expires_in_minutes: Math.max(0, Math.round((CACHE_TTL - age) / 60000)),
      };
    }
    // Add uncached categories
    for (const cat of Object.keys(FEEDS)) {
      if (!status[cat]) {
        status[cat] = { cached: false, articles: 0 };
      }
    }
    return status;
  }
}

module.exports = new NewsService();
