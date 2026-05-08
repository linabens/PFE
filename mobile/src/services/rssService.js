const RSS_FEEDS = {
  alJazeeraEN: 'https://www.aljazeera.com/xml/rss/all.xml',
  alJazeeraAR: 'https://www.aljazeera.net/xml/rss/all.xml',
  beinSports:  'https://www.beinsports.com/ar/rss',
};

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
}

function extractImageFromContent(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function parseItems(xml, source, category) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title       = extractTag(block, 'title');
    const link        = extractTag(block, 'link');
    const description = extractTag(block, 'description').replace(/<[^>]*>/g, '').trim();
    const pubDate     = extractTag(block, 'pubDate');
    const enclosureM  = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
    const mediaM      = block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
    const contentM    = block.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
    const image = enclosureM?.[1] || mediaM?.[1] || extractImageFromContent(contentM?.[1]);

    if (!title) continue;
    items.push({
      id: link || `${source}-${Date.now()}-${Math.random()}`,
      title,
      description: description.slice(0, 200),
      link,
      pubDate,
      image,
      source,
      category,
    });
  }
  return items;
}

async function fetchFeed(url, source, category) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CoffeeTime/1.0', 'Accept': 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseItems(text, source, category);
  } catch {
    return [];
  }
}

export async function fetchAllFeeds() {
  const results = await Promise.allSettled([
    fetchFeed(RSS_FEEDS.alJazeeraEN, 'Al Jazeera', 'world'),
    fetchFeed(RSS_FEEDS.alJazeeraAR, 'Al Jazeera AR', 'world'),
    fetchFeed(RSS_FEEDS.beinSports,  'Bein Sports',  'sports'),
  ]);
  const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  return all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}
