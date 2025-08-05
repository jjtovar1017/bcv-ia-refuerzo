/**
 * Servicio de Alertas Económicas BCV
 * Monitorea noticias nacionales e internacionales que puedan afectar la economía venezolana
 * y la imagen del Banco Central de Venezuela
 */

export interface EconomicAlert {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'international' | 'national' | 'bcv_image' | 'trade_relations';
  impactAnalysis: {
    venezuelaImpact: number; // 0-100
    bcvImageImpact: number; // 0-100
    urgencyLevel: number; // 0-100
    keyFactors: string[];
    affectedSectors: string[];
  };
  sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
  recommendations: {
    responseStrategy: string;
    keyMessages: string[];
    targetAudience: string[];
    timeline: string;
    priority: number;
  };
  relatedCountries: string[];
  economicIndicators: string[];
}

export interface AlertsFilter {
  severity?: string[];
  category?: string[];
  sentiment?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  countries?: string[];
  minImpact?: number;
}

class EconomicAlertsService {
  private readonly cache = new Map<string, any>();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutos

  // Países socios comerciales clave de Venezuela
  private readonly keyTradingPartners = [
    'China', 'Rusia', 'Turquía', 'India', 'Irán', 'Cuba', 'Brasil', 
    'Colombia', 'Estados Unidos', 'España', 'Italia', 'Países Bajos'
  ];

  // Sectores económicos críticos para Venezuela
  private readonly criticalSectors = [
    'petróleo', 'oro', 'minería', 'agricultura', 'manufactura',
    'servicios financieros', 'comercio exterior', 'inversión extranjera'
  ];

  // Términos que indican impacto en la imagen del BCV
  private readonly bcvImageTerms = [
    'banco central venezuela', 'bcv', 'política monetaria venezuela',
    'reservas internacionales venezuela', 'bolívar', 'inflación venezuela',
    'sistema financiero venezuela', 'regulación bancaria venezuela'
  ];

  /**
   * Obtiene alertas económicas actualizadas
   */
  async getEconomicAlerts(limit: number = 20, filter?: AlertsFilter): Promise<EconomicAlert[]> {
    const cacheKey = `economic_alerts_${limit}_${JSON.stringify(filter)}`;
    const cached = this.getCachedResponse<EconomicAlert[]>(cacheKey);
    if (cached) return cached;

    try {
      // Buscar noticias de múltiples fuentes
      const [internationalNews, nationalNews, bcvNews] = await Promise.all([
        this.searchInternationalEconomicNews(),
        this.searchNationalEconomicNews(),
        this.searchBCVImageNews()
      ]);

      // Combinar y analizar todas las noticias
      const allNews = [...internationalNews, ...nationalNews, ...bcvNews];
      const alerts = await this.processNewsIntoAlerts(allNews);

      // Filtrar y ordenar por relevancia
      const filteredAlerts = this.applyFilters(alerts, filter);
      const sortedAlerts = this.sortByRelevance(filteredAlerts);

      const result = sortedAlerts.slice(0, limit);
      this.setCachedResponse(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error obteniendo alertas económicas:', error);
      return this.getFallbackAlerts();
    }
  }

  /**
   * Busca noticias económicas internacionales que puedan afectar a Venezuela
   */
  private async searchInternationalEconomicNews(): Promise<any[]> {
    const queries = [
      // Socios comerciales clave
      'China trade policy oil Venezuela',
      'Russia sanctions tariffs Venezuela',
      'Turkey economic relations Venezuela',
      'India oil imports Venezuela',
      'Iran economic cooperation Venezuela',
      
      // Sectores críticos
      'global oil prices OPEC Venezuela',
      'gold prices international mining Venezuela',
      'international sanctions economic impact',
      'commodity prices Latin America',
      
      // Políticas económicas globales
      'US economic sanctions Venezuela',
      'European Union trade policy Venezuela',
      'international monetary policy emerging markets'
    ];

    const allResults = [];
    
    for (const query of queries) {
      try {
        const results = await this.searchNewsAPI(query, 'international');
        allResults.push(...results);
      } catch (error) {
        console.warn(`Error buscando: ${query}`, error);
      }
    }

    return allResults;
  }

  /**
   * Busca noticias económicas nacionales
   */
  private async searchNationalEconomicNews(): Promise<any[]> {
    const queries = [
      'Venezuela economía nacional',
      'Venezuela inflación precios',
      'Venezuela comercio exterior',
      'Venezuela inversión extranjera',
      'Venezuela sector petrolero',
      'Venezuela minería oro',
      'Venezuela agricultura producción',
      'Venezuela manufactura industria'
    ];

    const allResults = [];
    
    for (const query of queries) {
      try {
        const results = await this.searchNewsAPI(query, 'national');
        allResults.push(...results);
      } catch (error) {
        console.warn(`Error buscando noticias nacionales: ${query}`, error);
      }
    }

    return allResults;
  }

  /**
   * Busca noticias específicas sobre la imagen del BCV
   */
  private async searchBCVImageNews(): Promise<any[]> {
    const queries = [
      'Banco Central Venezuela BCV política monetaria',
      'BCV reservas internacionales Venezuela',
      'Venezuela sistema financiero regulación',
      'BCV inflación control monetario',
      'Banco Central Venezuela imagen internacional',
      'BCV decisiones económicas Venezuela'
    ];

    const allResults = [];
    
    for (const query of queries) {
      try {
        const results = await this.searchNewsAPI(query, 'bcv_image');
        allResults.push(...results);
      } catch (error) {
        console.warn(`Error buscando noticias BCV: ${query}`, error);
      }
    }

    return allResults;
  }

  /**
   * Busca noticias usando múltiples APIs
   */
  private async searchNewsAPI(query: string, category: string): Promise<any[]> {
    const results = [];

    // NewsAPI
    if (import.meta.env.VITE_NEWS_API_KEY) {
      try {
        const newsApiResults = await this.searchWithNewsAPI(query);
        results.push(...newsApiResults.map(article => ({ ...article, category, source_api: 'newsapi' })));
      } catch (error) {
        console.warn('NewsAPI error:', error);
      }
    }

    // SerpAPI (Google News)
    if (import.meta.env.VITE_SERP_API_KEY) {
      try {
        const serpResults = await this.searchWithSerpAPI(query);
        results.push(...serpResults.map(article => ({ ...article, category, source_api: 'serp' })));
      } catch (error) {
        console.warn('SerpAPI error:', error);
      }
    }

    // DuckDuckGo como fallback
    if (results.length === 0) {
      try {
        const duckResults = await this.searchWithDuckDuckGo(query);
        results.push(...duckResults.map(article => ({ ...article, category, source_api: 'duckduckgo' })));
      } catch (error) {
        console.warn('DuckDuckGo error:', error);
      }
    }

    return results;
  }

  /**
   * Procesa noticias en alertas económicas con análisis de impacto
   */
  private async processNewsIntoAlerts(newsItems: any[]): Promise<EconomicAlert[]> {
    const alerts: EconomicAlert[] = [];

    for (const news of newsItems) {
      try {
        const alert = await this.analyzeNewsImpact(news);
        if (alert && alert.impactAnalysis.venezuelaImpact >= 30) { // Solo alertas relevantes
          alerts.push(alert);
        }
      } catch (error) {
        console.warn('Error analizando noticia:', error);
      }
    }

    return alerts;
  }

  /**
   * Analiza el impacto de una noticia y genera recomendaciones
   */
  private async analyzeNewsImpact(news: any): Promise<EconomicAlert | null> {
    const title = news.title || '';
    const content = news.description || news.snippet || '';
    const fullText = `${title} ${content}`.toLowerCase();

    // Análisis de impacto en Venezuela
    const venezuelaImpact = this.calculateVenezuelaImpact(fullText);
    const bcvImageImpact = this.calculateBCVImageImpact(fullText);
    const urgencyLevel = this.calculateUrgencyLevel(fullText, news.publishedAt);

    // Análisis de sentimiento
    const sentiment = this.analyzeSentiment(fullText);

    // Determinar severidad
    const severity = this.determineSeverity(venezuelaImpact, bcvImageImpact, urgencyLevel);

    // Generar recomendaciones
    const recommendations = await this.generateRecommendations(news, venezuelaImpact, bcvImageImpact, sentiment);

    const alert: EconomicAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: news.title || 'Sin título',
      summary: this.generateSummary(news),
      source: news.source?.name || news.source || 'Fuente desconocida',
      url: news.url || '#',
      publishedAt: news.publishedAt || new Date().toISOString(),
      severity,
      category: news.category || 'international',
      impactAnalysis: {
        venezuelaImpact,
        bcvImageImpact,
        urgencyLevel,
        keyFactors: this.extractKeyFactors(fullText),
        affectedSectors: this.identifyAffectedSectors(fullText)
      },
      sentiment,
      recommendations,
      relatedCountries: this.extractRelatedCountries(fullText),
      economicIndicators: this.extractEconomicIndicators(fullText)
    };

    return alert;
  }

  /**
   * Calcula el impacto potencial en Venezuela (0-100)
   */
  private calculateVenezuelaImpact(text: string): number {
    let impact = 0;

    // Menciones directas de Venezuela
    if (text.includes('venezuela')) impact += 40;
    if (text.includes('caracas')) impact += 20;

    // Socios comerciales clave
    for (const partner of this.keyTradingPartners) {
      if (text.includes(partner.toLowerCase())) {
        impact += 15;
        break;
      }
    }

    // Sectores críticos
    for (const sector of this.criticalSectors) {
      if (text.includes(sector)) {
        impact += 10;
      }
    }

    // Términos económicos de alto impacto
    const highImpactTerms = ['sanctions', 'embargo', 'tariff', 'trade war', 'oil price', 'commodity'];
    for (const term of highImpactTerms) {
      if (text.includes(term)) impact += 15;
    }

    return Math.min(impact, 100);
  }

  /**
   * Calcula el impacto en la imagen del BCV (0-100)
   */
  private calculateBCVImageImpact(text: string): number {
    let impact = 0;

    // Menciones directas del BCV
    for (const term of this.bcvImageTerms) {
      if (text.includes(term.toLowerCase())) {
        impact += 30;
        break;
      }
    }

    // Términos relacionados con política monetaria
    const monetaryTerms = ['central bank', 'monetary policy', 'inflation', 'currency', 'reserves'];
    for (const term of monetaryTerms) {
      if (text.includes(term)) impact += 10;
    }

    // Términos negativos que afectan imagen institucional
    const negativeTerms = ['crisis', 'collapse', 'failure', 'corruption', 'mismanagement'];
    for (const term of negativeTerms) {
      if (text.includes(term)) impact += 20;
    }

    return Math.min(impact, 100);
  }

  /**
   * Calcula el nivel de urgencia (0-100)
   */
  private calculateUrgencyLevel(text: string, publishedAt?: string): number {
    let urgency = 0;

    // Recencia de la noticia
    if (publishedAt) {
      const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 6) urgency += 30;
      else if (hoursAgo < 24) urgency += 20;
      else if (hoursAgo < 72) urgency += 10;
    }

    // Términos de urgencia
    const urgentTerms = ['breaking', 'urgent', 'immediate', 'emergency', 'crisis', 'alert'];
    for (const term of urgentTerms) {
      if (text.includes(term)) urgency += 20;
    }

    // Términos de impacto inmediato
    const immediateTerms = ['announced', 'implemented', 'effective immediately', 'takes effect'];
    for (const term of immediateTerms) {
      if (text.includes(term)) urgency += 15;
    }

    return Math.min(urgency, 100);
  }

  /**
   * Analiza el sentimiento de la noticia
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'very_negative' {
    const positiveWords = ['growth', 'increase', 'improvement', 'success', 'positive', 'boost', 'recovery'];
    const negativeWords = ['crisis', 'decline', 'collapse', 'failure', 'negative', 'drop', 'fall', 'sanctions'];
    const veryNegativeWords = ['disaster', 'catastrophe', 'corruption', 'fraud', 'scandal', 'embargo'];

    let positiveScore = 0;
    let negativeScore = 0;
    let veryNegativeScore = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) positiveScore++;
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeScore++;
    }

    for (const word of veryNegativeWords) {
      if (text.includes(word)) veryNegativeScore += 2;
    }

    if (veryNegativeScore > 0) return 'very_negative';
    if (negativeScore > positiveScore) return 'negative';
    if (positiveScore > negativeScore) return 'positive';
    return 'neutral';
  }

  /**
   * Determina la severidad de la alerta
   */
  private determineSeverity(venezuelaImpact: number, bcvImageImpact: number, urgencyLevel: number): 'low' | 'medium' | 'high' | 'critical' {
    const totalScore = (venezuelaImpact + bcvImageImpact + urgencyLevel) / 3;

    if (totalScore >= 80) return 'critical';
    if (totalScore >= 60) return 'high';
    if (totalScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Genera recomendaciones estratégicas para abordar la noticia
   */
  private async generateRecommendations(news: any, venezuelaImpact: number, bcvImageImpact: number, sentiment: string): Promise<any> {
    const isHighImpact = venezuelaImpact >= 60 || bcvImageImpact >= 60;
    const isNegative = sentiment === 'negative' || sentiment === 'very_negative';

    let responseStrategy = '';
    let keyMessages: string[] = [];
    let targetAudience: string[] = [];
    let timeline = '';
    let priority = 1;

    if (isHighImpact && isNegative) {
      responseStrategy = 'Respuesta Inmediata y Proactiva';
      keyMessages = [
        'Reafirmar el compromiso del BCV con la estabilidad económica',
        'Destacar las medidas preventivas y políticas implementadas',
        'Proporcionar datos técnicos que contrarresten narrativas negativas',
        'Enfatizar la solidez institucional del sistema financiero venezolano'
      ];
      targetAudience = ['Medios nacionales', 'Medios internacionales', 'Sector financiero', 'Organismos multilaterales'];
      timeline = 'Inmediato (0-6 horas)';
      priority = 5;
    } else if (isHighImpact) {
      responseStrategy = 'Monitoreo Activo y Comunicación Preventiva';
      keyMessages = [
        'Monitorear desarrollos y evaluar impactos potenciales',
        'Preparar comunicaciones técnicas si es necesario',
        'Coordinar con otras instituciones del Estado'
      ];
      targetAudience = ['Medios especializados', 'Sector académico'];
      timeline = 'Corto plazo (6-24 horas)';
      priority = 3;
    } else {
      responseStrategy = 'Seguimiento Rutinario';
      keyMessages = [
        'Mantener seguimiento de la situación',
        'Evaluar desarrollos futuros'
      ];
      targetAudience = ['Equipo interno'];
      timeline = 'Mediano plazo (1-3 días)';
      priority = 1;
    }

    return {
      responseStrategy,
      keyMessages,
      targetAudience,
      timeline,
      priority
    };
  }

  // Métodos auxiliares para análisis de contenido
  private generateSummary(news: any): string {
    const content = news.description || news.snippet || news.title || '';
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  }

  private extractKeyFactors(text: string): string[] {
    const factors = [];
    
    if (text.includes('tariff') || text.includes('arancel')) factors.push('Políticas arancelarias');
    if (text.includes('sanction') || text.includes('sanción')) factors.push('Sanciones económicas');
    if (text.includes('oil') || text.includes('petróleo')) factors.push('Sector petrolero');
    if (text.includes('trade') || text.includes('comercio')) factors.push('Relaciones comerciales');
    if (text.includes('investment') || text.includes('inversión')) factors.push('Inversión extranjera');
    if (text.includes('inflation') || text.includes('inflación')) factors.push('Política monetaria');
    
    return factors;
  }

  private identifyAffectedSectors(text: string): string[] {
    const sectors = [];
    
    for (const sector of this.criticalSectors) {
      if (text.includes(sector)) {
        sectors.push(sector.charAt(0).toUpperCase() + sector.slice(1));
      }
    }
    
    return sectors;
  }

  private extractRelatedCountries(text: string): string[] {
    const countries = [];
    
    for (const country of this.keyTradingPartners) {
      if (text.includes(country.toLowerCase())) {
        countries.push(country);
      }
    }
    
    return countries;
  }

  private extractEconomicIndicators(text: string): string[] {
    const indicators = [];
    const indicatorTerms = ['gdp', 'inflation', 'unemployment', 'trade balance', 'reserves', 'exchange rate'];
    
    for (const indicator of indicatorTerms) {
      if (text.includes(indicator)) {
        indicators.push(indicator.replace(/\b\w/g, l => l.toUpperCase()));
      }
    }
    
    return indicators;
  }

  // Métodos de búsqueda en APIs (reutilizando del webSearchService)
  private async searchWithNewsAPI(query: string): Promise<any[]> {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    if (!apiKey) return [];

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`
    );

    if (!response.ok) throw new Error('NewsAPI request failed');

    const data = await response.json();
    return data.articles || [];
  }

  private async searchWithSerpAPI(query: string): Promise<any[]> {
    const apiKey = import.meta.env.VITE_SERP_API_KEY;
    if (!apiKey) return [];

    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_news&q=${encodeURIComponent(query)}&api_key=${apiKey}`
    );

    if (!response.ok) throw new Error('SerpAPI request failed');

    const data = await response.json();
    return data.news_results || [];
  }

  private async searchWithDuckDuckGo(query: string): Promise<any[]> {
    // Implementación simplificada para DuckDuckGo
    return [];
  }

  // Métodos de utilidad
  private applyFilters(alerts: EconomicAlert[], filter?: AlertsFilter): EconomicAlert[] {
    if (!filter) return alerts;

    return alerts.filter(alert => {
      if (filter.severity && !filter.severity.includes(alert.severity)) return false;
      if (filter.category && !filter.category.includes(alert.category)) return false;
      if (filter.sentiment && !filter.sentiment.includes(alert.sentiment)) return false;
      if (filter.minImpact && alert.impactAnalysis.venezuelaImpact < filter.minImpact) return false;
      
      return true;
    });
  }

  private sortByRelevance(alerts: EconomicAlert[]): EconomicAlert[] {
    return alerts.sort((a, b) => {
      const scoreA = (a.impactAnalysis.venezuelaImpact + a.impactAnalysis.bcvImageImpact + a.impactAnalysis.urgencyLevel) / 3;
      const scoreB = (b.impactAnalysis.venezuelaImpact + b.impactAnalysis.bcvImageImpact + b.impactAnalysis.urgencyLevel) / 3;
      return scoreB - scoreA;
    });
  }

  private getFallbackAlerts(): EconomicAlert[] {
    return [{
      id: 'fallback_001',
      title: 'Sistema de Alertas Económicas Iniciado',
      summary: 'El sistema de monitoreo de alertas económicas está funcionando. Configure las API keys para obtener noticias en tiempo real.',
      source: 'Sistema BCV',
      url: '#',
      publishedAt: new Date().toISOString(),
      severity: 'low',
      category: 'national',
      impactAnalysis: {
        venezuelaImpact: 0,
        bcvImageImpact: 0,
        urgencyLevel: 0,
        keyFactors: ['Sistema iniciado'],
        affectedSectors: []
      },
      sentiment: 'neutral',
      recommendations: {
        responseStrategy: 'Configuración del Sistema',
        keyMessages: ['Configure las API keys para obtener alertas reales'],
        targetAudience: ['Equipo técnico'],
        timeline: 'Inmediato',
        priority: 1
      },
      relatedCountries: [],
      economicIndicators: []
    }];
  }

  private getCachedResponse<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedResponse<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export const economicAlertsService = new EconomicAlertsService();
