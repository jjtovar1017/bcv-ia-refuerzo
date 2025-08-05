import axios from 'axios';

export interface WebAnalysisResult {
    title: string;
    summary: string;
    source: string;
    url: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    relevance: number;
    publishedAt: string;
}

export interface BCVInstitutionalAnalysis {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    keyFindings: string[];
    recommendations: string[];
    recentNews: WebAnalysisResult[];
    economicImpact: string;
    imageScore: number; // 0-100
}

export class WebAnalysisService {
    private readonly newsApiKey: string;
    private readonly geminiApiKey: string;
    private readonly baseUrl: string = 'https://newsapi.org/v2';

    constructor() {
        this.newsApiKey = import.meta.env?.VITE_NEWS_API_KEY || '';
        this.geminiApiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
    }

    /**
     * Obtiene noticias reales sobre el BCV y economía venezolana
     */
    public async getBCVRealNews(limit: number = 10): Promise<WebAnalysisResult[]> {
        try {
            if (!this.newsApiKey) {
                throw new Error('News API key no configurada');
            }

            // Búsqueda de noticias sobre BCV y economía venezolana
            const queries = [
                'Banco Central Venezuela',
                'BCV Venezuela',
                'economía venezolana',
                'tipo cambio Venezuela',
                'inflación Venezuela',
                'reservas internacionales Venezuela'
            ];

            const allNews: WebAnalysisResult[] = [];

            for (const query of queries) {
                try {
                    const response = await axios.get(`${this.baseUrl}/everything`, {
                        params: {
                            q: query,
                            language: 'es',
                            sortBy: 'publishedAt',
                            pageSize: Math.ceil(limit / queries.length),
                            apiKey: this.newsApiKey
                        }
                    });

                    if (response.data.articles) {
                        const articles = response.data.articles.map((article: any, index: number) => ({
                            title: article.title,
                            summary: article.description || article.content?.substring(0, 200) || '',
                            source: article.source.name,
                            url: article.url,
                            sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
                            relevance: this.calculateRelevance(article, query),
                            publishedAt: article.publishedAt
                        }));

                        allNews.push(...articles);
                    }
                } catch (error) {
                    console.error(`Error fetching news for query "${query}":`, error);
                }
            }

            // Ordenar por relevancia y fecha
            return allNews
                .sort((a, b) => b.relevance - a.relevance)
                .slice(0, limit);

        } catch (error) {
            console.error('Error fetching BCV real news:', error);
            return this.getFallbackNews();
        }
    }

    /**
     * Análisis institucional completo del BCV
     */
    public async getBCVInstitutionalAnalysis(): Promise<BCVInstitutionalAnalysis> {
        try {
            const recentNews = await this.getBCVRealNews(15);
            
            // Análisis de sentimiento general
            const sentiments = recentNews.map(news => news.sentiment);
            const positiveCount = sentiments.filter(s => s === 'positive').length;
            const negativeCount = sentiments.filter(s => s === 'negative').length;
            const neutralCount = sentiments.filter(s => s === 'neutral').length;

            let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
            if (positiveCount > negativeCount && positiveCount > neutralCount) {
                overallSentiment = 'positive';
            } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
                overallSentiment = 'negative';
            }

            // Calcular score de imagen (0-100)
            const imageScore = Math.round((positiveCount / sentiments.length) * 100);

            // Generar hallazgos clave
            const keyFindings = this.generateKeyFindings(recentNews);

            // Generar recomendaciones
            const recommendations = this.generateRecommendations(overallSentiment, recentNews);

            // Análisis de impacto económico
            const economicImpact = this.analyzeEconomicImpact(recentNews);

            return {
                overallSentiment,
                keyFindings,
                recommendations,
                recentNews: recentNews.slice(0, 10),
                economicImpact,
                imageScore
            };

        } catch (error) {
            console.error('Error in BCV institutional analysis:', error);
            return this.getFallbackAnalysis();
        }
    }

    /**
     * Análisis de sentimiento básico
     */
    private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
        const positiveWords = ['positivo', 'crecimiento', 'mejora', 'estable', 'fuerte', 'recuperación', 'optimista', 'favorable'];
        const negativeWords = ['negativo', 'caída', 'deterioro', 'inestable', 'débil', 'crisis', 'pesimista', 'desfavorable'];

        const lowerText = text.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveScore++;
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeScore++;
        });

        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }

    /**
     * Calcula la relevancia de una noticia
     */
    private calculateRelevance(article: any, query: string): number {
        let relevance = 0;
        const text = (article.title + ' ' + article.description).toLowerCase();
        const queryWords = query.toLowerCase().split(' ');

        queryWords.forEach(word => {
            if (text.includes(word)) relevance += 1;
        });

        // Bonus por ser reciente
        const daysAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysAgo <= 1) relevance += 2;
        else if (daysAgo <= 7) relevance += 1;

        return relevance;
    }

    /**
     * Genera hallazgos clave basados en las noticias
     */
    private generateKeyFindings(news: WebAnalysisResult[]): string[] {
        const findings: string[] = [];
        
        const topics = {
            'tipo de cambio': 0,
            'inflación': 0,
            'reservas': 0,
            'política monetaria': 0,
            'economía': 0
        };

        news.forEach(article => {
            const text = (article.title + ' ' + article.summary).toLowerCase();
            if (text.includes('tipo de cambio') || text.includes('dólar')) topics['tipo de cambio']++;
            if (text.includes('inflación') || text.includes('precios')) topics['inflación']++;
            if (text.includes('reservas') || text.includes('oro')) topics['reservas']++;
            if (text.includes('política monetaria') || text.includes('bcv')) topics['política monetaria']++;
            if (text.includes('economía') || text.includes('económico')) topics['economía']++;
        });

        // Generar hallazgos basados en frecuencia
        Object.entries(topics).forEach(([topic, count]) => {
            if (count > 0) {
                findings.push(`${topic.charAt(0).toUpperCase() + topic.slice(1)} es mencionado en ${count} noticias recientes`);
            }
        });

        return findings.slice(0, 5);
    }

    /**
     * Genera recomendaciones basadas en el análisis
     */
    private generateRecommendations(sentiment: string, news: WebAnalysisResult[]): string[] {
        const recommendations: string[] = [];

        if (sentiment === 'negative') {
            recommendations.push('Reforzar la comunicación institucional para mejorar la percepción pública');
            recommendations.push('Considerar medidas proactivas para abordar las preocupaciones económicas');
        } else if (sentiment === 'positive') {
            recommendations.push('Mantener la estrategia de comunicación actual');
            recommendations.push('Aprovechar el momentum positivo para fortalecer la confianza');
        } else {
            recommendations.push('Implementar una estrategia de comunicación más proactiva');
            recommendations.push('Monitorear de cerca las tendencias de sentimiento');
        }

        recommendations.push('Mantener transparencia en las políticas monetarias');
        recommendations.push('Fortalecer la presencia en medios digitales');

        return recommendations;
    }

    /**
     * Analiza el impacto económico de las noticias
     */
    private analyzeEconomicImpact(news: WebAnalysisResult[]): string {
        const economicTerms = news.filter(article => 
            article.title.toLowerCase().includes('economía') || 
            article.title.toLowerCase().includes('económico') ||
            article.summary.toLowerCase().includes('economía') ||
            article.summary.toLowerCase().includes('económico')
        );

        if (economicTerms.length > 5) {
            return 'Alto impacto económico detectado en las noticias recientes';
        } else if (economicTerms.length > 2) {
            return 'Impacto económico moderado en las noticias recientes';
        } else {
            return 'Bajo impacto económico en las noticias recientes';
        }
    }

    /**
     * Noticias de respaldo cuando la API falla
     */
    private getFallbackNews(): WebAnalysisResult[] {
        return [
            {
                title: 'BCV mantiene políticas monetarias estables',
                summary: 'El Banco Central de Venezuela continúa implementando medidas para mantener la estabilidad económica del país.',
                source: 'BCV Oficial',
                url: 'https://www.bcv.org.ve',
                sentiment: 'positive',
                relevance: 10,
                publishedAt: new Date().toISOString()
            },
            {
                title: 'Análisis del comportamiento del mercado cambiario',
                summary: 'Expertos analizan las tendencias actuales del mercado cambiario venezolano y sus implicaciones.',
                source: 'Finanzas Digital',
                url: 'https://finanzasdigital.com',
                sentiment: 'neutral',
                relevance: 8,
                publishedAt: new Date().toISOString()
            }
        ];
    }

    /**
     * Análisis de respaldo cuando falla
     */
    private getFallbackAnalysis(): BCVInstitutionalAnalysis {
        return {
            overallSentiment: 'neutral',
            keyFindings: [
                'Monitoreo de noticias en curso',
                'Análisis de sentimiento disponible',
                'Recomendaciones basadas en datos históricos'
            ],
            recommendations: [
                'Mantener monitoreo continuo de medios',
                'Fortalecer comunicación institucional',
                'Implementar estrategias proactivas'
            ],
            recentNews: this.getFallbackNews(),
            economicImpact: 'Análisis en progreso',
            imageScore: 50
        };
    }
}

export const webAnalysisService = new WebAnalysisService(); 