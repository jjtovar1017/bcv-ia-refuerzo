import axios, { AxiosInstance } from 'axios';
import * as Sentry from '@sentry/react';
import { EconomicNewsResult, GroundingSource, NewsSearchType } from '../types';
import { NewsSourceType } from '../types/news';

export interface NewsAPIArticle {
    source: {
        id: string | null;
        name: string;
    };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

export interface NewsAPIResponse {
    status: string;
    totalResults: number;
    articles: NewsAPIArticle[];
}

export interface ExchangeRateData {
    rates: {
        [currency: string]: number;
    };
    base: string;
    date: string;
}

export class NewsService {
    private newsApiClient: AxiosInstance;
    private exchangeApiClient: AxiosInstance;
    private readonly newsApiKey: string;
    private readonly cacheTimeout: number = 1800000; // 30 minutes
    private readonly cachePrefix: string = 'news_cache_';

    private apitubeApiKey: string;
    private apitubeClient: AxiosInstance;

    constructor() {
        this.newsApiKey = import.meta.env?.VITE_NEWS_API_KEY || '';
        this.apitubeApiKey = import.meta.env?.VITE_APITUBE_API_KEY || '';
        
        if (!this.newsApiKey || this.newsApiKey === 'demo_key_for_testing') {
            console.warn('NEWS_API_KEY not configured or using demo key. Service will use fallback mode.');
            this.newsApiKey = ''; // Reset demo key to empty to avoid API calls
        }
        if (!this.apitubeApiKey) {
            console.warn('APITube API key not configured. APITube fallback deshabilitado.');
        }

        // NewsAPI client
        this.newsApiClient = axios.create({
            baseURL: 'https://newsapi.org/v2',
            timeout: 30000,
            headers: {
                'X-API-Key': this.newsApiKey
            }
        });

        // APITube client
        this.apitubeClient = axios.create({
            baseURL: 'https://api.apitube.io/v1',
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${this.apitubeApiKey}`
            }
        });

        // Exchange rates API client (free service)
        this.exchangeApiClient = axios.create({
            baseURL: 'https://api.exchangerate-api.com/v4',
            timeout: 15000
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // NewsAPI interceptors
        this.newsApiClient.interceptors.request.use(
            (config) => {
                Sentry.addBreadcrumb({
                    category: 'news-api',
                    message: `News API request: ${config.method?.toUpperCase()} ${config.url}`,
                    level: 'info',
                    data: { url: config.url, method: config.method }
                });
                return config;
            },
            (error) => {
                Sentry.captureException(error);
                return Promise.reject(error);
            }
        );

        this.newsApiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                Sentry.addBreadcrumb({
                    category: 'news-api',
                    message: `News API error: ${error.message}`,
                    level: 'error',
                    data: { 
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        url: error.config?.url
                    }
                });
                return Promise.reject(error);
            }
        );

        // Exchange API interceptors
        this.exchangeApiClient.interceptors.request.use(
            (config) => {
                Sentry.addBreadcrumb({
                    category: 'exchange-api',
                    message: `Exchange API request: ${config.method?.toUpperCase()} ${config.url}`,
                    level: 'info'
                });
                return config;
            }
        );
    }

    /**
     * Cache response in localStorage
     */
    private async cacheResponse<T>(key: string, data: T): Promise<void> {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
                expires: Date.now() + this.cacheTimeout
            };
            localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Failed to cache news response:', error);
        }
    }

    /**
     * Get cached response from localStorage
     */
    private async getCachedResponse<T>(key: string): Promise<T | null> {
        try {
            const cached = localStorage.getItem(this.cachePrefix + key);
            if (!cached) return null;

            const cacheItem = JSON.parse(cached);
            if (Date.now() > cacheItem.expires) {
                localStorage.removeItem(this.cachePrefix + key);
                return null;
            }
            return cacheItem.data as T;
        } catch (error) {
            console.warn('Failed to get cached news response:', error);
            return null;
        }
    }

    /**
     * Get current news source type from localStorage
     */
    private getSelectedNewsSource(): NewsSourceType {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('news_source_type') as NewsSourceType) || 'newsapi';
        }
        return 'newsapi';
    }

    /**
     * Get economic news based on search type
     */
    public async getEconomicNews(searchType: NewsSearchType): Promise<EconomicNewsResult> {
        const newsSource = this.getSelectedNewsSource();
        const cacheKey = `economic_news_${searchType}`;
        const cached = await this.getCachedResponse<EconomicNewsResult>(cacheKey);
        if (cached) return cached;

        try {
            let articles: NewsAPIArticle[] = [];
            
            if (this.newsApiKey) {
                const params: any = {
                    q: `${keyword} Venezuela`,
                    language: 'es',
                    sortBy: 'publishedAt',
                    pageSize: 15,
                    from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Last 3 days
                };

                if (category) {
                    params.category = category;
                }

                const response = await this.newsApiClient.get('/everything', { params });

                if (response.data.status === 'ok') {
                    articles = response.data.articles;
                }
            }

            const result: EconomicNewsResult = {
                summary: `Resultados de búsqueda para "${keyword}" - ${articles.length} artículos encontrados`,
                sources: articles.map(article => ({
                    title: article.title,
                    uri: article.url,
                    snippet: article.description || ''
                })),
                searchType: 'custom' as NewsSearchType,
                totalResults: articles.length,
                lastUpdated: new Date().toISOString()
            };

            await this.cacheResponse(cacheKey, result);
            return result;

        } catch (error) {
            Sentry.captureException(error);
            throw new Error(`Failed to search news for "${keyword}"`);
        }
    }

    /**
     * Get search query based on type
     */
    private getSearchQuery(searchType: NewsSearchType): string {
        const queries = {
            economic_analysis: 'Venezuela economía análisis financiero BCV',
            market_trends: 'Venezuela mercado tendencias bolsa',
            threat_alert: 'Venezuela riesgo político económico crisis',
            policy_updates: 'Venezuela política económica regulación BCV',
            custom: 'Venezuela noticias'
        };

        return queries[searchType] || queries.custom;
    }

    /**
     * Get relevant news sources
     */
    private getRelevantSources(searchType: NewsSearchType): string {
        // Note: These would need to be actual source IDs from NewsAPI
        const sources = [
            'reuters',
            'bloomberg',
            'associated-press',
            'cnn',
            'bbc-news'
        ];

        return sources.join(',');
    }

    /**
     * Generate summary based on articles
     */
    private generateSummary(articles: NewsAPIArticle[], searchType: NewsSearchType): string {
        if (articles.length === 0) {
            return 'No se encontraron noticias recientes para esta búsqueda.';
        }

        const typeLabels = {
            economic_analysis: 'Análisis Económico',
            market_trends: 'Tendencias del Mercado',
            threat_alert: 'Alertas de Riesgo',
            policy_updates: 'Actualizaciones de Política',
            custom: 'Búsqueda Personalizada'
        };

        const label = typeLabels[searchType] || 'Noticias';
        return `${label}: Se encontraron ${articles.length} artículos relevantes de las últimas 24 horas. Los temas principales incluyen análisis económico, política monetaria y tendencias del mercado venezolano.`;
    }

    /**
     * Get fallback news when API is not available
     */
    private getFallbackNews(searchType: NewsSearchType): NewsAPIArticle[] {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

        const baseNews = [
            {
                source: { id: null, name: 'BCV Oficial' },
                author: 'Banco Central de Venezuela',
                title: 'BCV publica tipo de cambio de referencia',
                description: 'El Banco Central de Venezuela estableció el tipo de cambio de referencia para las operaciones del día.',
                url: 'https://bcv.org.ve',
                urlToImage: null,
                publishedAt: now.toISOString(),
                content: null
            },
            {
                source: { id: null, name: 'Finanzas Digital' },
                author: 'Redacción',
                title: 'Análisis del comportamiento del mercado cambiario',
                description: 'Expertos analizan las fluctuaciones recientes en el mercado cambiario venezolano.',
                url: 'https://finanzasdigital.com',
                urlToImage: null,
                publishedAt: yesterday.toISOString(),
                content: null
            },
            {
                source: { id: null, name: 'Reuters Venezuela' },
                author: 'Reuters',
                title: 'Actualización económica de Venezuela',
                description: 'Informe sobre la situación económica actual y perspectivas del mercado venezolano.',
                url: 'https://reuters.com',
                urlToImage: null,
                publishedAt: twoDaysAgo.toISOString(),
                content: null
            }
        ];

        // Add specific news based on search type
        const specificNews = this.getTypeSpecificFallbackNews(searchType, now, yesterday);
        
        return [...baseNews, ...specificNews];
    }

    /**
     * Get type-specific fallback news
     */
    private getTypeSpecificFallbackNews(searchType: NewsSearchType, now: Date, yesterday: Date): NewsAPIArticle[] {
        const typeSpecific: Record<NewsSearchType, NewsAPIArticle[]> = {
            economic_analysis: [
                {
                    source: { id: null, name: 'Análisis Económico' },
                    author: 'Equipo de Análisis',
                    title: 'Perspectivas económicas para Venezuela',
                    description: 'Análisis detallado de los indicadores económicos y proyecciones para el sector financiero.',
                    url: 'https://bcv.org.ve/analisis',
                    urlToImage: null,
                    publishedAt: now.toISOString(),
                    content: null
                }
            ],
            market_trends: [
                {
                    source: { id: null, name: 'Mercados Venezuela' },
                    author: 'Analista de Mercados',
                    title: 'Tendencias del mercado financiero venezolano',
                    description: 'Revisión de las principales tendencias y movimientos en los mercados locales.',
                    url: 'https://mercados.com.ve',
                    urlToImage: null,
                    publishedAt: yesterday.toISOString(),
                    content: null
                }
            ],
            threat_alert: [
                {
                    source: { id: null, name: 'Monitor de Riesgos' },
                    author: 'Centro de Análisis',
                    title: 'Evaluación de riesgos económicos',
                    description: 'Monitoreo de factores de riesgo que podrían afectar la estabilidad económica.',
                    url: 'https://riesgos.gov.ve',
                    urlToImage: null,
                    publishedAt: now.toISOString(),
                    content: null
                }
            ],
            policy_updates: [
                {
                    source: { id: null, name: 'Gaceta Oficial' },
                    author: 'Ministerio de Economía',
                    title: 'Nuevas regulaciones económicas',
                    description: 'Actualización sobre las últimas políticas y regulaciones económicas implementadas.',
                    url: 'https://gacetaoficial.gob.ve',
                    urlToImage: null,
                    publishedAt: yesterday.toISOString(),
                    content: null
                }
            ],
            custom: [
                {
                    source: { id: null, name: 'Noticias Venezuela' },
                    author: 'Redacción General',
                    title: 'Resumen de noticias económicas',
                    description: 'Compilación de las principales noticias económicas y financieras del día.',
                    url: 'https://noticias.ve',
                    urlToImage: null,
                    publishedAt: now.toISOString(),
                    content: null
                }
            ]
        };

        return typeSpecific[searchType] || typeSpecific.custom;
    }

    /**
     * Get fallback economic result
     */
    private getFallbackEconomicResult(searchType: NewsSearchType): EconomicNewsResult {
        return {
            summary: 'Servicio de noticias no disponible. Mostrando información de respaldo.',
            sources: [
                {
                    title: 'BCV - Información Oficial',
                    uri: 'https://bcv.org.ve',
                    snippet: 'Información oficial del Banco Central de Venezuela'
                }
            ],
            searchType,
            totalResults: 1,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Clear all cached data
     */
    public clearCache(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.cachePrefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear news cache:', error);
        }
    }
}

// Export singleton instance
export const newsService = new NewsService();
