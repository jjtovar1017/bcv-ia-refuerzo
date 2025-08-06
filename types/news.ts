export type NewsSourceType = 'newsapi' | 'apitube';

export const NEWS_SOURCE_LABELS: Record<NewsSourceType, string> = {
  newsapi: 'NewsAPI.org',
  apitube: 'APITube News',
};
