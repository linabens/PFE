const Parser = require('rss-parser');
const config = require('../config');

// Example RSS feeds map. In a real app, URLs would come from config or database.
const FEEDS = {
  general: 'https://www.aljazeera.net/aljazeerarss/all/rss.xml',
  sports: 'https://www.aljazeera.net/aljazeerarss/sports/rss.xml',
  technology: 'https://www.aljazeera.net/aljazeerarss/technology/rss.xml',
};

class NewsService {
  constructor() {
    this.parser = new Parser();
  }

  async fetch(category = 'general', limit = 20) {
    const url = FEEDS[category] || FEEDS.general;
    const feed = await this.parser.parseURL(url);
    return feed.items.slice(0, limit).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet,
    }));
  }
}

module.exports = new NewsService();
