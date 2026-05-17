const Parser = require('rss-parser');

// RSS feeds per category
const FEEDS = {
  general:    ['https://www.aljazeera.net/aljazeerarss/all/rss.xml'],
  sports:     [
    'https://www.beinsports.com/fr/rss/news',         // beIN Sports (Updated URL)
    'https://www.lequipe.fr/rss/actu_rss.xml',       // L'Équipe
    'https://www.eurosport.fr/rss.xml',              // Eurosport
    'https://fr.hespress.com/sport/feed',            // Hespress Sport
  ],
  technology: ['https://www.aljazeera.net/aljazeerarss/technology/rss.xml'],
};

// Cache TTL: 30 minutes (Reduced for better reactivity in dev)
const CACHE_TTL = 30 * 60 * 1000;

class NewsService {
  constructor() {
    this.parser = new Parser({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      timeout: 8000, // 8s timeout
    });
    this.cache = {};  // { category: { data, timestamp } }
  }

  /**
   * Fetch articles by category
   */
  async fetch(category = 'general', limit = 20) {
    const cached = this.cache[category];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data.slice(0, limit);
    }

    const feedUrls = FEEDS[category] || FEEDS.general;
    const articles = [];

    console.log(`[NewsService] Fetching ${category} news from ${feedUrls.length} sources...`);

    for (const url of feedUrls) {
      try {
        const feed = await this.parser.parseURL(url);
        console.log(`[NewsService] ✅ Success: ${feed.title || url} (${feed.items.length} items)`);
        
        articles.push(
          ...feed.items.map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            contentSnippet: (item.contentSnippet || item.content || '').substring(0, 200),
            source: feed.title || 'Sport News',
          }))
        );
      } catch (err) {
        console.warn(`[NewsService] ⚠️ Failed feed (${url}):`, err.message);
      }
    }

    if (articles.length === 0) {
      console.error(`[NewsService] ❌ No articles found for category: ${category}`);
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
