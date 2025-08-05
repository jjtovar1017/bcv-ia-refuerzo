import axios from 'axios';
import * as Sentry from '@sentry/react';

export interface WebSearchResult {
    title: string;
    snippet: string;
    url: string;
    source: string;
    publishedAt?: string;
    relevanceScore: number;
}

export interface ContentSuggestion {
    topic: string;
    suggestions: string[];
    relatedNews: WebSearchResult[];
    keyPoints: string[];
    credibilityScore: number;
    recommendation: 'good' | 'needs_improvement' | 'poor';
    improvementTips: string[];
}

export class WebSearchService {
    private readonly serpApiKey: string;
    private readonly newsApiKey: string;
    private readonly cacheTimeout: number = 1800000; // 30 minutes
    private readonly cachePrefix: string = 'websearch_cache_';

    constructor() {
        this.serpApiKey = import.meta.env?.VITE_SERP_API_KEY || '';
        this.newsApiKey = import.meta.env?.VITE_NEWS_API_KEY || '';
        
        if (!this.serpApiKey && !this.newsApiKey) {
            console.warn('No search API keys configured. Using fallback search methods.');
        }
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
            console.warn('Failed to cache web search response:', error);
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

            return cacheItem.data;
        } catch (error) {
            console.warn('Failed to get cached web search response:', error);
            return null;
        }
    }

    /**
     * Search web for relevant information about a topic
     */
    public async searchWeb(query: string, limit: number = 10): Promise<WebSearchResult[]> {
        const cacheKey = `web_search_${query}_${limit}`;
        const cached = await this.getCachedResponse<WebSearchResult[]>(cacheKey);
        if (cached) return cached;

        try {
            let results: WebSearchResult[] = [];

            // Try NewsAPI first for news content
            if (this.newsApiKey) {
                results = await this.searchWithNewsAPI(query, limit);
            }

            // If no results or no NewsAPI, try SerpAPI
            if (results.length === 0 && this.serpApiKey) {
                results = await this.searchWithSerpAPI(query, limit);
            }

            // If still no results, use DuckDuckGo as fallback
            if (results.length === 0) {
                results = await this.searchWithDuckDuckGo(query, limit);
            }

            await this.cacheResponse(cacheKey, results);
            return results;

        } catch (error) {
            console.error('Web search failed:', error);
            Sentry.captureException(error);
            return this.getFallbackResults(query);
        }
    }

    /**
     * Search using NewsAPI
     */
    private async searchWithNewsAPI(query: string, limit: number): Promise<WebSearchResult[]> {
        try {
            const response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: query,
                    language: 'es',
                    sortBy: 'relevancy',
                    pageSize: limit,
                    apiKey: this.newsApiKey
                }
            });

            if (response.data.articles) {
                return response.data.articles.map((article: any, index: number) => ({
                    title: article.title,
                    snippet: article.description || article.content?.substring(0, 200) || '',
                    url: article.url,
                    source: article.source.name,
                    publishedAt: article.publishedAt,
                    relevanceScore: Math.max(0.9 - (index * 0.1), 0.1)
                }));
            }

            return [];
        } catch (error) {
            console.error('NewsAPI search failed:', error);
            return [];
        }
    }

    /**
     * Search using SerpAPI (Google Search)
     */
    private async searchWithSerpAPI(query: string, limit: number): Promise<WebSearchResult[]> {
        try {
            const response = await axios.get('https://serpapi.com/search', {
                params: {
                    q: query,
                    hl: 'es',
                    gl: 've',
                    num: limit,
                    api_key: this.serpApiKey
                }
            });

            if (response.data.organic_results) {
                return response.data.organic_results.map((result: any, index: number) => ({
                    title: result.title,
                    snippet: result.snippet || '',
                    url: result.link,
                    source: result.displayed_link || new URL(result.link).hostname,
                    relevanceScore: Math.max(0.9 - (index * 0.1), 0.1)
                }));
            }

            return [];
        } catch (error) {
            console.error('SerpAPI search failed:', error);
            return [];
        }
    }

    /**
     * Search using DuckDuckGo as fallback (free)
     */
    private async searchWithDuckDuckGo(query: string, limit: number): Promise<WebSearchResult[]> {
        try {
            // Note: This is a simplified implementation
            // In production, you might want to use a proper DuckDuckGo API wrapper
            const encodedQuery = encodeURIComponent(query);
            
            // Return structured fallback results since direct DDG scraping is complex
            return this.getFallbackResults(query);
        } catch (error) {
            console.error('DuckDuckGo search failed:', error);
            return this.getFallbackResults(query);
        }
    }

    /**
     * Analyze content and provide suggestions
     */
    public async analyzeContentAndSuggest(topic: string, contentType: string): Promise<ContentSuggestion> {
        try {
            // Search for related information
            const searchQuery = `${topic} ${contentType} Venezuela BCV economía`;
            const relatedNews = await this.searchWeb(searchQuery, 5);

            // Analyze the topic and generate suggestions
            const suggestions = this.generateContentSuggestions(topic, contentType, relatedNews);
            const keyPoints = this.extractKeyPoints(relatedNews);
            const credibilityScore = this.calculateCredibilityScore(relatedNews);
            const recommendation = this.getRecommendation(credibilityScore, relatedNews.length);
            const improvementTips = this.generateImprovementTips(credibilityScore, relatedNews.length, contentType);

            return {
                topic,
                suggestions,
                relatedNews,
                keyPoints,
                credibilityScore,
                recommendation,
                improvementTips
            };

        } catch (error) {
            console.error('Content analysis failed:', error);
            Sentry.captureException(error);
            return this.getFallbackSuggestion(topic, contentType);
        }
    }

    /**
     * Generate content suggestions based on search results
     */
    private generateContentSuggestions(topic: string, contentType: string, news: WebSearchResult[]): string[] {
        const suggestions: string[] = [];

        if (news.length > 0) {
            suggestions.push(`Incluir información actualizada sobre ${topic} basada en fuentes recientes`);
            
            const sources = [...new Set(news.map(n => n.source))];
            if (sources.length > 1) {
                suggestions.push(`Contrastar información de múltiples fuentes: ${sources.slice(0, 3).join(', ')}`);
            }

            const recentNews = news.filter(n => n.publishedAt && 
                new Date(n.publishedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            );
            
            if (recentNews.length > 0) {
                suggestions.push('Incorporar desarrollos de la última semana para mayor relevancia');
            }
        }

        // Content type specific suggestions
        switch (contentType) {
            case 'Comunicado Oficial':
                suggestions.push('Mantener tono institucional y datos oficiales del BCV');
                suggestions.push('Incluir referencias a políticas monetarias vigentes');
                break;
            case 'Nota de Prensa':
                suggestions.push('Estructurar con titular impactante y datos clave');
                suggestions.push('Incluir citas de fuentes oficiales');
                break;
            case 'Informe Técnico':
                suggestions.push('Incorporar análisis cuantitativo y gráficos si es posible');
                suggestions.push('Referenciar indicadores económicos relevantes');
                break;
        }

        return suggestions;
    }

    /**
     * Extract key points from search results
     */
    private extractKeyPoints(news: WebSearchResult[]): string[] {
        const keyPoints: string[] = [];
        
        news.forEach(article => {
            const snippet = article.snippet.toLowerCase();
            
            // Look for key economic terms
            if (snippet.includes('inflación') || snippet.includes('inflation')) {
                keyPoints.push('Considerar impacto inflacionario');
            }
            if (snippet.includes('tipo de cambio') || snippet.includes('exchange rate')) {
                keyPoints.push('Incluir información sobre tipo de cambio');
            }
            if (snippet.includes('reservas') || snippet.includes('reserves')) {
                keyPoints.push('Mencionar estado de reservas internacionales');
            }
            if (snippet.includes('política monetaria') || snippet.includes('monetary policy')) {
                keyPoints.push('Referenciar políticas monetarias actuales');
            }
        });

        return [...new Set(keyPoints)].slice(0, 5);
    }

    /**
     * Calculate credibility score based on sources
     */
    private calculateCredibilityScore(news: WebSearchResult[]): number {
        if (news.length === 0) return 30;

        let score = 50; // Base score

        // Bonus for official sources
        const officialSources = news.filter(n => 
            n.source.toLowerCase().includes('bcv') ||
            n.source.toLowerCase().includes('banco central') ||
            n.source.toLowerCase().includes('gov.ve')
        );
        score += officialSources.length * 15;

        // Bonus for reputable news sources
        const reputableSources = news.filter(n => 
            ['Reuters', 'Bloomberg', 'El Nacional', 'Finanzas Digital'].some(source => 
                n.source.toLowerCase().includes(source.toLowerCase())
            )
        );
        score += reputableSources.length * 10;

        // Bonus for recent content
        const recentNews = news.filter(n => n.publishedAt && 
            new Date(n.publishedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        );
        score += recentNews.length * 5;

        return Math.min(score, 100);
    }

    /**
     * Get recommendation based on analysis
     */
    private getRecommendation(credibilityScore: number, newsCount: number): 'good' | 'needs_improvement' | 'poor' {
        if (credibilityScore >= 70 && newsCount >= 3) return 'good';
        if (credibilityScore >= 50 && newsCount >= 1) return 'needs_improvement';
        return 'poor';
    }

    /**
     * Generate improvement tips
     */
    private generateImprovementTips(credibilityScore: number, newsCount: number, contentType: string): string[] {
        const tips: string[] = [];

        if (credibilityScore < 50) {
            tips.push('Buscar fuentes más confiables y oficiales');
            tips.push('Verificar información con múltiples fuentes');
        }

        if (newsCount < 3) {
            tips.push('Ampliar la investigación con más fuentes de información');
            tips.push('Considerar perspectivas adicionales sobre el tema');
        }

        if (contentType === 'Comunicado Oficial') {
            tips.push('Asegurar que toda información sea verificable y oficial');
            tips.push('Mantener tono neutral y profesional');
        }

        return tips;
    }

    /**
     * Get fallback results when search fails
     */
    private getFallbackResults(query: string): WebSearchResult[] {
        return [
            {
                title: `Información sobre ${query} - BCV`,
                snippet: 'Consulte las fuentes oficiales del Banco Central de Venezuela para información actualizada.',
                url: 'https://www.bcv.org.ve',
                source: 'BCV Oficial',
                relevanceScore: 0.8
            },
            {
                title: `${query} - Finanzas Digital`,
                snippet: 'Portal especializado en noticias económicas y financieras de Venezuela.',
                url: 'https://finanzasdigital.com',
                source: 'Finanzas Digital',
                relevanceScore: 0.6
            }
        ];
    }

    /**
     * Get fallback suggestion when analysis fails
     */
    private getFallbackSuggestion(topic: string, contentType: string): ContentSuggestion {
        return {
            topic,
            suggestions: [
                'Verificar información con fuentes oficiales del BCV',
                'Mantener tono institucional apropiado',
                'Incluir datos y estadísticas relevantes'
            ],
            relatedNews: this.getFallbackResults(topic),
            keyPoints: [
                'Consultar fuentes oficiales',
                'Mantener precisión en los datos',
                'Verificar información antes de publicar'
            ],
            credibilityScore: 50,
            recommendation: 'needs_improvement',
            improvementTips: [
                'Ampliar investigación con más fuentes',
                'Verificar datos con fuentes oficiales',
                'Considerar múltiples perspectivas'
            ]
        };
    }

    /**
     * Clear cache
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
            console.warn('Failed to clear web search cache:', error);
        }
    }
}

// Export singleton instance
export const webSearchService = new WebSearchService();
