import React, { useEffect, useState } from 'react';

interface NewsItem {
  title: string;
  link: string;
  summary?: string;
  source: string;
}

const RSS_ENDPOINTS = [
  {
    name: 'AVN',
    url: 'https://avn.info.ve/feed/',
    logo: 'https://avn.info.ve/favicon.ico',
  },
  {
    name: 'VTV',
    url: 'https://www.vtv.gob.ve/feed/',
    logo: 'https://www.vtv.gob.ve/wp-content/uploads/2018/10/cropped-cropped-favicon-32x32.png',
  },
  {
    name: 'El Nacional',
    url: 'https://www.elnacional.com/feed/',
    logo: 'https://www.elnacional.com/wp-content/uploads/2019/03/cropped-favicon-32x32.png',
  },
];

const HTML_SOURCES = [
  {
    name: 'Tal Cual',
    url: 'https://talcualdigital.com/',
    logo: 'https://talcualdigital.com/wp-content/uploads/2019/12/favicon.ico',
    selector: '.td-ss-main-news .td-module-title a',
  },
  {
    name: 'teleSUR',
    url: 'https://www.telesurtv.net/',
    logo: 'https://www.telesurtv.net/favicon.ico',
    selector: '.TSR_listadoNoticias .noticia a',
  },
];

const YOUTUBE_CHANNELS = [
  {
    name: 'teleSUR',
    embed: 'https://www.youtube.com/embed/live_stream?channel=UCw5l5rPqL1hB5GQHc5q6yzQ',
    logo: 'https://www.telesurtv.net/favicon.ico',
  },
  {
    name: 'VTV',
    embed: 'https://www.youtube.com/embed/live_stream?channel=UC6XUeJp0uY8g0u9T7pX8r6Q',
    logo: 'https://www.vtv.gob.ve/wp-content/uploads/2018/10/cropped-cropped-favicon-32x32.png',
  },
];

function parseRSS(xml: string, source: string): NewsItem[] {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = Array.from(doc.querySelectorAll('item'));
  return items.slice(0, 6).map(item => ({
    title: item.querySelector('title')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
    summary: item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '').slice(0, 180),
    source,
  })).filter(n => n.title && n.link);
}

export const NewsVenezuelaSection: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      setError('');
      let allNews: NewsItem[] = [];
      // RSS sources
      for (const src of RSS_ENDPOINTS) {
        try {
          const resp = await fetch(src.url);
          if (!resp.ok) throw new Error('No se pudo leer el feed RSS');
          const text = await resp.text();
          allNews = allNews.concat(parseRSS(text, src.name));
        } catch (e) {
          // fallback: skip
        }
      }
      // HTML scraping (Tal Cual, teleSUR)
      for (const src of HTML_SOURCES) {
        try {
          const resp = await fetch(src.url);
          if (!resp.ok) throw new Error('No se pudo leer el portal');
          const html = await resp.text();
          const doc = new window.DOMParser().parseFromString(html, 'text/html');
          const links = Array.from(doc.querySelectorAll(src.selector));
          links.slice(0, 5).forEach((a: any) => {
            allNews.push({
              title: a.textContent.trim(),
              link: a.href,
              source: src.name,
            });
          });
        } catch (e) {
          // fallback: skip
        }
      }
      if (!cancelled) {
        setNews(allNews);
        setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white border border-bcv-gray-200 rounded-lg p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Flag_of_Venezuela.svg/32px-Flag_of_Venezuela.svg.png" alt="Venezuela" className="w-6 h-6" />
        Noticias de Venezuela
      </h2>
      {loading ? (
        <div className="text-bcv-gray-400">Cargando noticias de medios venezolanos...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <ul className="space-y-4 mb-6">
          {news.map((item, i) => (
            <li key={i} className="border-b pb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-bcv-blue text-white rounded px-2 py-0.5">{item.source}</span>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">{item.title}</a>
              </div>
              {item.summary && <div className="text-xs text-bcv-gray-600 line-clamp-2">{item.summary}</div>}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">En vivo y videos recientes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {YOUTUBE_CHANNELS.map((yt, i) => (
            <div key={i} className="bg-bcv-gray-50 p-2 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <img src={yt.logo} alt={yt.name} className="w-5 h-5" />
                <span className="font-medium">{yt.name}</span>
              </div>
              <iframe
                src={yt.embed}
                title={yt.name}
                width="100%"
                height="220"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="rounded"
                style={{ border: 0 }}
              />
              <a href={`https://www.youtube.com/@${yt.name.toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="text-xs text-bcv-blue hover:underline mt-1 inline-block">Ver canal en YouTube</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsVenezuelaSection;
