import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  imageurl: string;
  url: string;
  source: string;
  published_on: number;
  tags: string[];
}

export const NewsPage: React.FC = () => {
  const { authFetch } = useApi();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await authFetch('/api/news');
        if (res.ok) {
           const data = await res.json();
           setNews(data);
        }
      } catch (error) {
        console.error("Erro ao carregar notícias", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' 
    });
  };

  return (
    <div className="p-8 min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Market News
        </h1>
        <p className="text-gray-400">Latest insights from the crypto world</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-64 bg-white/5 rounded-2xl border border-white/5"></div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <a 
              key={item.id} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="glass rounded-2xl overflow-hidden shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 border border-white/10 flex flex-col group"
            >
              <div className="h-48 overflow-hidden relative bg-gray-900">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10" />
                <img 
                  src={item.imageurl} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=No+Image' }} 
                />
                <span className="absolute bottom-4 left-4 z-20 text-[10px] font-bold uppercase tracking-wider bg-blue-600/90 px-2 py-1 rounded text-white shadow-lg">
                  {item.source}
                </span>
              </div>
              
              <div className="p-6 flex flex-col flex-1 bg-white/[0.02]">
                <h3 className="text-lg font-bold mb-3 leading-snug text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">
                  {item.body}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {formatDate(item.published_on)}
                  </span>
                  <div className="flex gap-2">
                     {item.tags.slice(0, 1).map(tag => (
                        <span key={tag} className="bg-white/10 px-2 py-0.5 rounded text-gray-300 font-medium">#{tag}</span>
                     ))}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};