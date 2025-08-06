import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
    RouteRequest, 
    RouteResponse, 
    GeoAnalysisRequest, 
    GeoAnalysisResponse 
} from '../types';
import * as Sentry from '@sentry/react';

/**
 * DeepSeek API Integration Service
 * Handles route processing and geo-analysis with localStorage caching fallback
 */
export class DeepSeekService {
    private apiClient: AxiosInstance;
    private readonly baseUrl: string = 'https://api.deepseek.com';
    private readonly apiKey: string;
    private readonly cacheTimeout: number = 86400000; // 24 hours in milliseconds
    private readonly cachePrefix: string = 'deepseek_cache_';

    constructor() {
        // Get API key from environment or use empty string
        this.apiKey = import.meta.env?.VITE_DEEPSEEK_API_KEY || '';
        
        if (!this.apiKey) {
            console.warn('DEEPSEEK_API_KEY not configured. Service will use cache-only mode.');
        }

        // Initialize HTTP client
        this.apiClient = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000, // 30 second timeout
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'BCV-AssetTracking/1.0'
            }
        });

        // Add request/response interceptors
        this.setupInterceptors();
    }

    /**
     * Cache response using localStorage
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
            console.warn('Failed to cache response:', error);
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
            console.warn('Failed to get cached response:', error);
            return null;
        }
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.apiClient.interceptors.request.use(
            (config) => {
                Sentry.addBreadcrumb({
                    category: 'deepseek-integration',
                    message: `API request to ${config.url}`,
                    level: 'info',
                    data: { method: config.method, url: config.url }
                });
                return config;
            },
            (error) => {
                Sentry.captureException(error, {
                    tags: { component: 'deepseek-integration', operation: 'request' }
                });
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.apiClient.interceptors.response.use(
            (response) => {
                Sentry.addBreadcrumb({
                    category: 'deepseek-integration',
                    message: `API response ${response.status}`,
                    level: 'info',
                    data: { status: response.status, url: response.config.url }
                });
                return response;
            },
            (error) => {
                const status = error.response?.status || 'unknown';
                Sentry.captureException(error, {
                    tags: { 
                        component: 'deepseek-integration', 
                        operation: 'response',
                        status: status.toString()
                    }
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Process route optimization using DeepSeek AI
     * @param request Route processing request
     * @returns Optimized route with alternatives and risk assessment
     */
    async processRoute(request: RouteRequest): Promise<RouteResponse> {
        const cacheKey = `route:${this.hashRequest(request)}`;
        const startTime = Date.now();

        try {
            // Try DeepSeek API first
            const response = await this.callDeepSeekAPI('/chat', {
                model: 'deepseek-chat',
                messages: [{
                    role: 'user',
                    content: this.buildRoutePrompt(request)
                }],
                temperature: 0.1, // Low temperature for consistent routing
                max_tokens: 2000
            });

            const result = this.parseRouteResponse(response.data);
            const duration = Date.now() - startTime;

            // Cache successful response
            await this.cacheResponse(cacheKey, result);

            // Track successful API call
            Sentry.addBreadcrumb({
                category: 'deepseek-integration',
                message: 'Route processing successful',
                level: 'info',
                data: { 
                    duration, 
                    assetType: request.assetType,
                    cacheKey 
                }
            });

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;
            
            Sentry.captureException(error, {
                tags: { 
                    component: 'deepseek-integration',
                    operation: 'route-processing'
                },
                extra: { request, duration }
            });

            // Fallback to Redis cache
            const cached = await this.getCachedResponse<RouteResponse>(cacheKey);
            if (cached) {
                console.log('Using cached route response due to API failure');
                return cached;
            }

            throw new Error(`DeepSeek route processing failed and no cached response available: ${error}`);
        }
    }

    /**
     * Perform geo-contextual analysis using DeepSeek AI
     * @param request Geo-analysis request
     * @returns Comprehensive location analysis with risk assessment
     */
    async analyzeGeoContext(request: GeoAnalysisRequest): Promise<GeoAnalysisResponse> {
        const cacheKey = `geo:${request.location.join(',')}_${request.radius}_${request.analysisType}`;
        const startTime = Date.now();

        try {
            const response = await this.callDeepSeekAPI('/chat', {
                model: 'deepseek-chat',
                messages: [{
                    role: 'user',
                    content: this.buildGeoAnalysisPrompt(request)
                }],
                temperature: 0.2, // Slightly higher for varied analysis
                max_tokens: 1500
            });

            const result = this.parseGeoAnalysisResponse(response.data);
            const duration = Date.now() - startTime;

            // Cache for 24 hours
            await this.cacheResponse(cacheKey, result);

            Sentry.addBreadcrumb({
                category: 'deepseek-integration',
                message: 'Geo-analysis successful',
                level: 'info',
                data: { 
                    duration, 
                    analysisType: request.analysisType,
                    location: request.location 
                }
            });

            return result;

        } catch (error) {
            const duration = Date.now() - startTime;
            
            Sentry.captureException(error, {
                tags: { 
                    component: 'deepseek-integration',
                    operation: 'geo-analysis'
                },
                extra: { request, duration }
            });

            const cached = await this.getCachedResponse<GeoAnalysisResponse>(cacheKey);
            if (cached) {
                console.log('Using cached geo-analysis due to API failure');
                return cached;
            }

            throw new Error(`DeepSeek geo-analysis failed and no cached response available: ${error}`);
        }
    }

    private async callDeepSeekAPI(endpoint: string, payload: any): Promise<AxiosResponse> {
        if (!this.apiKey) {
            throw new Error('DeepSeek API key not configured');
        }

        return await this.apiClient.post(endpoint, payload);
    }

    private buildRoutePrompt(request: RouteRequest): string {
        const { coordinates, destination, assetType, preferences = {} } = request;
        
        return `
**ROLE**: You are an expert route optimization AI for the Banco Central de Venezuela (BCV) asset tracking system.

**TASK**: Analyze and optimize the route for a ${assetType} traveling from coordinates [${coordinates.join(', ')}] to destination [${destination.join(', ')}] in Venezuela.

**CONTEXT**: 
- Current location: ${coordinates[0]}, ${coordinates[1]} (Latitude, Longitude)
- Destination: ${destination[0]}, ${destination[1]} (Latitude, Longitude)
- Asset type: ${assetType}
- Preferences: ${JSON.stringify(preferences)}

**ANALYSIS REQUIREMENTS**:
1. **Route Optimization**: Consider traffic patterns, road conditions, and security in Venezuelan urban areas (especially Caracas)
2. **Security Assessment**: Evaluate route safety based on current security conditions
3. **BCV Operations**: Factor in proximity to BCV facilities and restricted zones
4. **Efficiency**: Balance time, distance, and fuel consumption
5. **Risk Mitigation**: Identify potential hazards and alternative routes

**RESPONSE FORMAT** (JSON only):
{
  "recommendedRoute": [[lat1, lng1], [lat2, lng2], ...], // Array of waypoint coordinates
  "estimatedTime": 45, // Minutes
  "estimatedDistance": 12.5, // Kilometers
  "riskAssessment": "low|medium|high",
  "alternativeRoutes": [
    {
      "waypoints": [[lat1, lng1], [lat2, lng2], ...],
      "estimatedTime": 50,
      "estimatedDistance": 14.2,
      "description": "Safer route avoiding high-risk areas"
    }
  ],
  "warnings": ["Traffic congestion expected", "Construction zone ahead"],
  "securityNotes": "Route passes through secure commercial district",
  "fuelEfficiency": "optimal|good|moderate|poor",
  "bcvFacilities": [
    {
      "name": "BCV Sucursal Centro",
      "distance": 2.1,
      "coordinates": [10.5061, -66.9146]
    }
  ]
}

**IMPORTANT**: Respond ONLY with valid JSON. No additional text or explanations.
        `.trim();
    }

    private buildGeoAnalysisPrompt(request: GeoAnalysisRequest): string {
        const { location, radius, analysisType } = request;
        
        return `
**ROLE**: You are a geo-intelligence analyst for the Banco Central de Venezuela (BCV) providing comprehensive location analysis.

**TASK**: Perform ${analysisType} analysis for location [${location.join(', ')}] within a ${radius}m radius in Venezuela.

**ANALYSIS TYPE**: ${analysisType}
- **risk**: Security and safety assessment
- **efficiency**: Operational efficiency and logistics
- **compliance**: Regulatory and legal compliance factors

**CONTEXT**:
- Location: ${location[0]}, ${location[1]} (Latitude, Longitude)
- Analysis radius: ${radius} meters
- Focus: Venezuelan regulatory environment and BCV operations

**ANALYSIS REQUIREMENTS**:
1. **Security Assessment**: Crime rates, political stability, emergency services access
2. **Infrastructure**: Road quality, telecommunications, utilities
3. **Economic Indicators**: Commercial activity, financial services presence
4. **Regulatory Environment**: Banking regulations, restricted zones, permits required
5. **BCV Relevance**: Proximity to BCV facilities, strategic importance

**RESPONSE FORMAT** (JSON only):
{
  "location": [${location[0]}, ${location[1]}],
  "riskScore": 25, // 0-100 (0=lowest risk, 100=highest risk)
  "securityLevel": "low|medium|high|critical",
  "economicIndicators": {
    "activityLevel": 75, // 0-100
    "infrastructureQuality": 60, // 0-100
    "accessibilityScore": 80 // 0-100
  },
  "recommendations": [
    "Increase security protocols during evening hours",
    "Coordinate with local authorities for asset movements"
  ],
  "nearbyFacilities": [
    {
      "type": "bcv_branch|bank|government|security",
      "name": "Facility Name",
      "distance": 150, // meters
      "coordinates": [lat, lng]
    }
  ],
  "complianceFactors": {
    "regulatoryZone": "Commercial Banking District",
    "restrictions": ["No overnight parking", "Security clearance required"],
    "requiredPermissions": ["Transit permit", "Security escort"]
  },
  "threatAssessment": {
    "level": "low|medium|high|critical",
    "factors": ["Political demonstrations possible", "High crime area"],
    "mitigations": ["Avoid peak hours", "Use security escort"]
  },
  "operationalNotes": "Area suitable for BCV operations with standard security measures"
}

**IMPORTANT**: Respond ONLY with valid JSON. No additional text or explanations.
        `.trim();
    }

    private parseRouteResponse(apiResponse: any): RouteResponse {
        try {
            // Extract content from DeepSeek response
            const content = apiResponse.choices?.[0]?.message?.content || apiResponse.content || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                throw new Error('No JSON found in API response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate required fields
            if (!parsed.recommendedRoute || !parsed.estimatedTime || !parsed.riskAssessment) {
                throw new Error('Invalid route response format');
            }

            return {
                recommendedRoute: parsed.recommendedRoute,
                estimatedTime: parsed.estimatedTime,
                estimatedDistance: parsed.estimatedDistance || 0,
                riskAssessment: parsed.riskAssessment,
                alternativeRoutes: parsed.alternativeRoutes || [],
                warnings: parsed.warnings || []
            };

        } catch (error) {
            console.error('Failed to parse route response:', error);
            throw new Error(`Invalid API response format: ${error}`);
        }
    }

    private parseGeoAnalysisResponse(apiResponse: any): GeoAnalysisResponse {
        try {
            const content = apiResponse.choices?.[0]?.message?.content || apiResponse.content || '';
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                throw new Error('No JSON found in API response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // Validate required fields
            if (!parsed.location || typeof parsed.riskScore !== 'number' || !parsed.securityLevel) {
                throw new Error('Invalid geo-analysis response format');
            }

            return {
                location: parsed.location,
                riskScore: Math.max(0, Math.min(100, parsed.riskScore)),
                securityLevel: parsed.securityLevel,
                economicIndicators: parsed.economicIndicators || {
                    activityLevel: 50,
                    infrastructureQuality: 50,
                    accessibilityScore: 50
                },
                recommendations: parsed.recommendations || [],
                nearbyFacilities: parsed.nearbyFacilities || [],
                complianceFactors: parsed.complianceFactors || {
                    regulatoryZone: 'Unknown',
                    restrictions: [],
                    requiredPermissions: []
                }
            };

        } catch (error) {
            console.error('Failed to parse geo-analysis response:', error);
            throw new Error(`Invalid API response format: ${error}`);
        }
    }

    private hashRequest(request: any): string {
        // Simple hash function for cache keys
        return Buffer.from(JSON.stringify(request)).toString('base64').slice(0, 32);
    }

    /**
     * Test DeepSeek API connectivity
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.callDeepSeekAPI('/chat', {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Test connection. Respond with "OK".' }],
                max_tokens: 10
            });
            
            return response.status === 200;
        } catch (error) {
            console.error('DeepSeek connection test failed:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<{ connected: boolean; keyCount?: number }> {
        // Using localStorage instead of Redis
        try {
            let keyCount = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.cachePrefix)) {
                    keyCount++;
                }
            }
            return { connected: true, keyCount };
        } catch (error) {
            return { connected: false };
        }
    }
}

// Export singleton instance
export const deepSeekService = new DeepSeekService();
