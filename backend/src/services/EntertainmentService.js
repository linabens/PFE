// In-memory data for quotes, tips and videos. Could be moved to DB later.
const quotes = [
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  // ... add more quotes up to 50
];

const tips = [
  "Drink water first thing in the morning.",
  "Take regular breaks when working to boost productivity.",
  // ... add more tips up to 30
];

const videos = [
  { id: 1, title: 'Quick Coffee Brewing Hack', url: 'https://example.com/video1.mp4' },
  { id: 2, title: 'Healthy Morning Routine', url: 'https://example.com/video2.mp4' },
  // ... more short vertical videos
];

class EntertainmentService {
  getQuotes(limit = 50) {
    return quotes.slice(0, limit);
  }

  getTips(limit = 30) {
    return tips.slice(0, limit);
  }

  getVideos(limit = 20) {
    return videos.slice(0, limit);
  }
}

module.exports = new EntertainmentService();
