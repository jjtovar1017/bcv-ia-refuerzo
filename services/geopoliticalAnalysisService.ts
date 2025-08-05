import axios, { AxiosInstance } from 'axios';
import * as Sentry from '@sentry/react';
import { EconomicNewsResult, GroundingSource } from '../types';
import { generateBcvContent } from './geminiService';
import { AIModel } from '../types';

export interface GeopoliticalImpact {
    level: 'direct' | 'indirect' | 'minimal';
    category: 'economic' | 'political' | 'commercial' | 'energy' | 'financial' | 'diplomatic';
    description: string;
    confidence: number; // 0-100
}

export interface InternationalNewsItem {
    title: string;
    summary: string;
    source: string;
    url: string;
    publishedAt: string;
    impact: GeopoliticalImpact;
    keywords: string[];
    relatedCountries: string[];
}

export interface GeopoliticalAnalysisResult {
    relevantNews: InternationalNewsItem[];
    summary: string;
    totalItems: number;
    highImpactCount: number;
    categories: string[];
}

export class GeopoliticalAnalysisService {
    private newsApiClient: AxiosInstance;
    private readonly newsApiKey: string;
    private readonly cacheTimeout: number = 1800000; // 30 minutes
    private readonly cachePrefix: string = 'geopolitical_cache_';

    // Países y entidades con relaciones significativas con Venezuela
    private readonly strategicPartners = [
        'Russia', 'China', 'Iran', 'Cuba', 'Nicaragua', 'Bolivia', 'Turkey',
        'India', 'Belarus', 'Syria', 'North Korea'
    ];

    private readonly commercialPartners = [
        'Colombia', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'Peru',
        'Ecuador', 'Uruguay', 'Paraguay', 'Guyana', 'Trinidad and Tobago'
    ];

    private readonly sanctioningEntities = [
        'United States', 'European Union', 'Canada', 'United Kingdom',
        'Australia', 'Japan', 'Switzerland'
    ];

    // Sectores clave para Venezuela
    private readonly keySectors = [
        'oil', 'petroleum', 'energy', 'gold', 'mining', 'cryptocurrency',
        'banking', 'finance', 'trade', 'sanctions', 'embargo', 'tariffs'
    ];

    // Organizaciones internacionales relevantes
    private readonly internationalOrgs = [
        'OPEC', 'UNASUR', 'CELAC', 'Mercosur', 'OAS', 'UN', 'World Bank',
        'IMF', 'WTO', 'BRICS', 'Shanghai Cooperation'
    ];

    constructor() {
        this.newsApiKey = import.meta.env?.VITE_NEWS_API_KEY || '';
        
        if (!this.newsApiKey) {
            console.warn('NEWS_API_KEY not configured for geopolitical analysis.');
        }

        this.newsApiClient = axios.create({
            baseURL: 'https://newsapi.org/v2',
            timeout: 30000,
            headers: {
                'X-API-Key': this.newsApiKey,
                'User-Agent': 'BCV-GeopoliticalMonitor/1.0'
            }
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.newsApiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                Sentry.captureException(error, {
                    tags: { component: 'geopolitical-analysis', operation: 'api-request' }
                });
                return Promise.reject(error);
            }
        );
    }

    private async cacheResponse<T>(key: string, data: T): Promise<void> {
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                expires: Date.now() + this.cacheTimeout
            };
            localStorage.setItem(`${this.cachePrefix}${key}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache geopolitical data:', error);
        }
    }

    private async getCachedResponse<T>(key: string): Promise<T | null> {
        try {
            const cached = localStorage.getItem(`${this.cachePrefix}${key}`);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            if (Date.now() > cacheData.expires) {
                localStorage.removeItem(`${this.cachePrefix}${key}`);
                return null;
            }

            return cacheData.data;
        } catch (error) {
            console.warn('Failed to retrieve cached geopolitical data:', error);
            return null;
        }
    }

    /**
     * Analiza el impacto geopolítico de una noticia en Venezuela
     */
    private async analyzeGeopoliticalImpact(newsItem: any): Promise<GeopoliticalImpact> {
        const title = newsItem.title?.toLowerCase() || '';
        const description = newsItem.description?.toLowerCase() || '';
        const content = `${title} ${description}`;

        // Análisis directo - menciona Venezuela explícitamente
        if (content.includes('venezuela') || content.includes('venezuelan')) {
            return {
                level: 'direct',
                category: this.categorizeNews(content),
                description: 'Noticia menciona directamente a Venezuela',
                confidence: 95
            };
        }

        // Análisis indirecto - socios estratégicos
        const mentionedPartners = this.strategicPartners.filter(partner => 
            content.includes(partner.toLowerCase())
        );
        
        if (mentionedPartners.length > 0) {
            const hasEconomicKeywords = this.keySectors.some(sector => 
                content.includes(sector)
            );
            
            if (hasEconomicKeywords) {
                return {
                    level: 'indirect',
                    category: this.categorizeNews(content),
                    description: `Impacto indirecto vía socios estratégicos: ${mentionedPartners.join(', ')}`,
                    confidence: 80
                };
            }
        }

        // Análisis de sanciones y medidas comerciales
        const sanctionKeywords = ['sanction', 'embargo', 'tariff', 'trade war', 'economic measure'];
        const hasSanctionContent = sanctionKeywords.some(keyword => content.includes(keyword));
        
        if (hasSanctionContent) {
            const affectedCountries = [...this.strategicPartners, ...this.commercialPartners]
                .filter(country => content.includes(country.toLowerCase()));
            
            if (affectedCountries.length > 0) {
                return {
                    level: 'indirect',
                    category: 'economic',
                    description: `Medidas económicas que pueden afectar relaciones comerciales`,
                    confidence: 70
                };
            }
        }

        // Análisis de organizaciones internacionales
        const mentionedOrgs = this.internationalOrgs.filter(org => 
            content.includes(org.toLowerCase())
        );
        
        if (mentionedOrgs.length > 0 && this.keySectors.some(sector => content.includes(sector))) {
            return {
                level: 'indirect',
                category: 'diplomatic',
                description: `Decisiones de organizaciones internacionales relevantes: ${mentionedOrgs.join(', ')}`,
                confidence: 60
            };
        }

        // Análisis de sectores clave (petróleo, oro, etc.)
        const mentionedSectors = this.keySectors.filter(sector => content.includes(sector));
        if (mentionedSectors.length >= 2) {
            return {
                level: 'indirect',
                category: 'economic',
                description: `Noticias del sector ${mentionedSectors.join(', ')} con posible impacto económico`,
                confidence: 50
            };
        }

        return {
            level: 'minimal',
            category: 'economic',
            description: 'Impacto mínimo o no determinado',
            confidence: 20
        };
    }

    private categorizeNews(content: string): GeopoliticalImpact['category'] {
        if (content.includes('oil') || content.includes('energy') || content.includes('petroleum')) {
            return 'energy';
        }
        if (content.includes('trade') || content.includes('tariff') || content.includes('commercial')) {
            return 'commercial';
        }
        if (content.includes('sanction') || content.includes('embargo') || content.includes('diplomatic')) {
            return 'diplomatic';
        }
        if (content.includes('bank') || content.includes('finance') || content.includes('currency')) {
            return 'financial';
        }
        if (content.includes('government') || content.includes('political') || content.includes('election')) {
            return 'political';
        }
        return 'economic';
    }

    /**
     * Busca noticias internacionales relevantes para Venezuela
     */
    public async searchRelevantInternationalNews(): Promise<GeopoliticalAnalysisResult> {
        const cacheKey = 'international_news_analysis';
        const cached = await this.getCachedResponse<GeopoliticalAnalysisResult>(cacheKey);
        if (cached) return cached;

        try {
            const relevantNews: InternationalNewsItem[] = [];
            
            // Búsquedas específicas por categorías
            const searchQueries = [
                // Socios estratégicos + sectores clave
                `Russia oil sanctions`,
                `China trade Venezuela`,
                `Iran sanctions oil`,
                `OPEC production decisions`,
                // Sanciones y medidas económicas
                `US sanctions Russia China`,
                `European Union embargo`,
                `Trade war tariffs`,
                // Sectores específicos
                `oil prices global market`,
                `gold mining international`,
                `cryptocurrency regulations`,
                // Organizaciones internacionales
                `UN Security Council sanctions`,
                `World Bank economic measures`,
                `IMF lending decisions`
            ];

            for (const query of searchQueries.slice(0, 5)) { // Limitar para evitar rate limits
                try {
                    const response = await this.newsApiClient.get('/everything', {
                        params: {
                            q: query,
                            language: 'en',
                            sortBy: 'publishedAt',
                            pageSize: 10,
                            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Última semana
                        }
                    });

                    if (response.data.status === 'ok' && response.data.articles) {
                        for (const article of response.data.articles) {
                            const impact = await this.analyzeGeopoliticalImpact(article);
                            
                            // Solo incluir noticias con impacto directo o indirecto significativo
                            if (impact.level !== 'minimal' && impact.confidence >= 50) {
                                const newsItem: InternationalNewsItem = {
                                    title: article.title,
                                    summary: article.description || '',
                                    source: article.source.name,
                                    url: article.url,
                                    publishedAt: article.publishedAt,
                                    impact,
                                    keywords: this.extractKeywords(article.title + ' ' + article.description),
                                    relatedCountries: this.extractCountries(article.title + ' ' + article.description)
                                };
                                
                                relevantNews.push(newsItem);
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to fetch news for query: ${query}`, error);
                    continue;
                }
            }

            // Eliminar duplicados y ordenar por relevancia
            const uniqueNews = this.removeDuplicates(relevantNews);
            const sortedNews = uniqueNews.sort((a, b) => b.impact.confidence - a.impact.confidence);

            const result: GeopoliticalAnalysisResult = {
                relevantNews: sortedNews.slice(0, 20), // Top 20 noticias más relevantes
                summary: await this.generateAnalysisSummary(sortedNews),
                totalItems: sortedNews.length,
                highImpactCount: sortedNews.filter(news => news.impact.confidence >= 70).length,
                categories: [...new Set(sortedNews.map(news => news.impact.category))]
            };

            await this.cacheResponse(cacheKey, result);
            return result;

        } catch (error) {
            Sentry.captureException(error, {
                tags: { component: 'geopolitical-analysis', operation: 'search-news' }
            });
            
            // Retornar resultado vacío en caso de error
            return {
                relevantNews: [],
                summary: 'Error al obtener noticias internacionales relevantes.',
                totalItems: 0,
                highImpactCount: 0,
                categories: []
            };
        }
    }

    private extractKeywords(text: string): string[] {
        const allKeywords = [...this.keySectors, ...this.strategicPartners, ...this.internationalOrgs];
        return allKeywords.filter(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    private extractCountries(text: string): string[] {
        const allCountries = [...this.strategicPartners, ...this.commercialPartners, ...this.sanctioningEntities];
        return allCountries.filter(country => 
            text.toLowerCase().includes(country.toLowerCase())
        );
    }

    private removeDuplicates(news: InternationalNewsItem[]): InternationalNewsItem[] {
        const seen = new Set<string>();
        return news.filter(item => {
            const key = item.title.toLowerCase().substring(0, 50);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private async generateAnalysisSummary(news: InternationalNewsItem[]): Promise<string> {
        if (news.length === 0) {
            return 'No se encontraron noticias internacionales relevantes para Venezuela en este momento.';
        }

        const highImpactNews = news.filter(item => item.impact.confidence >= 70);
        const categories = [...new Set(news.map(item => item.impact.category))];
        const countries = [...new Set(news.flatMap(item => item.relatedCountries))];

        try {
            const prompt = `
            Analiza las siguientes noticias internacionales y genera un resumen ejecutivo sobre su impacto potencial en Venezuela:

            Noticias de alto impacto (${highImpactNews.length}):
            ${highImpactNews.slice(0, 5).map(item => `- ${item.title}: ${item.impact.description}`).join('\n')}

            Categorías principales: ${categories.join(', ')}
            Países involucrados: ${countries.slice(0, 10).join(', ')}

            Genera un resumen de 2-3 párrafos explicando:
            1. Las principales tendencias geopolíticas que podrían afectar a Venezuela
            2. Recomendaciones para el monitoreo del BCV
            3. Sectores que requieren mayor atención
            `;

            const summary = await generateBcvContent(
                'Análisis Geopolítico Internacional',
                'Informe Ejecutivo',
                AIModel.Gemini,
                prompt
            );

            return summary;
        } catch (error) {
            console.warn('Failed to generate AI summary:', error);
            return `Se identificaron ${news.length} noticias relevantes en las categorías: ${categories.join(', ')}. ${highImpactNews.length} noticias tienen alto impacto potencial en Venezuela.`;
        }
    }

    /**
     * Limpia la caché de análisis geopolítico
     */
    public clearCache(): void {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.cachePrefix)) {
                localStorage.removeItem(key);
            }
        });
    }
}

// Export singleton instance
export const geopoliticalAnalysisService = new GeopoliticalAnalysisService();
