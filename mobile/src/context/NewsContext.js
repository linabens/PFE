import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAllFeeds } from '../services/rssService';

const NewsContext = createContext({});

export function NewsProvider({ children }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const articles = await fetchAllFeeds();
      setNews(articles);
      setLastRefresh(new Date());
      await AsyncStorage.setItem('cachedNews', JSON.stringify(articles));
      await AsyncStorage.setItem('lastNewsRefresh', new Date().toISOString());
    } catch {
      const cached = await AsyncStorage.getItem('cachedNews');
      if (cached) setNews(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const refreshNews = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem('cachedNews');
      const lastTime = await AsyncStorage.getItem('lastNewsRefresh');
      if (cached) {
        setNews(JSON.parse(cached));
        setLoading(false);
        if (lastTime) setLastRefresh(new Date(lastTime));
      }
      await fetchNews();
    })();

    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = news.filter(a =>
    selectedCategory === 'all' ? true : a.category === selectedCategory
  );

  return (
    <NewsContext.Provider value={{ news: filteredNews, allNews: news, loading, refreshing, selectedCategory, setSelectedCategory, refreshNews, lastRefresh }}>
      {children}
    </NewsContext.Provider>
  );
}

export const useNews = () => {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error('useNews must be used within NewsProvider');
  return ctx;
};
