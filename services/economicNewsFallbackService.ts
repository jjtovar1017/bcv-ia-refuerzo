// Servicio para obtener titulares económicos de medios venezolanos y globales como fallback para alertas económicas

export interface EconomicNewsFallback {
  title: string;
  link: string;
  summary?: string;
  source: string;
  date?: string;
}

const FEEDS = [
  {
    name: 'AVN',
    url: 'https://avn.info.ve/feed/',
    keywords: ['econom', 'dólar', 'inflación', 'PIB', 'reservas', 'precio', 'finanzas', 'mercado', 'petro', 'BCV', 'banco central', 'deuda', 'bonos', 'divisas', 'sanciones']
  },
  {
    name: 'VTV',
    url: 'https://www.vtv.gob.ve/feed/',
    keywords: ['econom', 'dólar', 'inflación', 'PIB', 'reservas', 'precio', 'finanzas', 'mercado', 'petro', 'BCV', 'banco central', 'deuda', 'bonos', 'divisas', 'sanciones']
  },
  {
    name: 'El Nacional',
    url: 'https://www.elnacional.com/feed/',
    keywords: ['econom', 'dólar', 'inflación', 'PIB', 'reservas', 'precio', 'finanzas', 'mercado', 'petro', 'BCV', 'banco central', 'deuda', 'bonos', 'divisas', 'sanciones']
  }
];

function parseRSS(xml: string, source: string, keywords: string[]): EconomicNewsFallback[] {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = Array.from(doc.querySelectorAll('item'));
  return items.map(item => {
    const title = item.querySelector('title')?.textContent || '';
    const link = item.querySelector('link')?.textContent || '';
    const summary = item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '').slice(0, 180);
    const date = item.querySelector('pubDate')?.textContent || '';
    return { title, link, summary, source, date };
  }).filter(n => n.title && n.link && keywords.some(k => n.title.toLowerCase().includes(k) || (n.summary||'').toLowerCase().includes(k)));
}

export async function getEconomicNewsFallback(): Promise<EconomicNewsFallback[]> {
  let all: EconomicNewsFallback[] = [];
  for (const feed of FEEDS) {
    try {
      const resp = await fetch(feed.url);
      if (!resp.ok) continue;
      const text = await resp.text();
      all = all.concat(parseRSS(text, feed.name, feed.keywords));
    } catch (e) {
      // skip
    }
  }
  return all;
}
