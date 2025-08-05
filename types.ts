export interface Metric {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'increase' | 'decrease';
}

export enum AIModel {
    DeepSeek = 'deepseek',
    Mistral = 'mistral',
    Gemini = 'gemini',
}

export interface AIModelOption {
    id: AIModel;
    name: string;
    description: string;
}

export interface TelegramMessage {
    id: number;
    channel: string;
    text: string;
    timestamp: string;
    messageId?: number; // ID del mensaje específico en Telegram
    channelUsername?: string; // Username del canal para construir el enlace
    telegramUrl?: string; // URL directa al mensaje en Telegram
    url?: string; // URL de la fuente original (si aplica)
    link?: string; // Enlace directo al canal o mensaje
}

export interface NavigationItem {
    name: string;
    path: string;
    icon: (className: string) => React.ReactNode;
}

export interface GroundingSource {
    uri: string;
    title: string;
    snippet?: string;
}

export interface EconomicNewsResult {
    summary: string;
    sources: GroundingSource[];
    searchType?: NewsSearchType;
    totalResults?: number;
    lastUpdated?: string;
}

export type TranscriptionSource = { type: 'file'; payload: File } | { type: 'url'; payload: string };

export type NewsSearchType = 'economic' | 'mixed' | 'threat_alert';

export interface Notification {
    id: string;
    title: string;
    body: string;
    timestamp: number;
    read: boolean;
    priority: 'low' | 'medium' | 'high';
    actions?: {
        action: string;
        title: string;
    }[];
    data?: any;
}

// DeepSeek Integration Types
export interface RouteRequest {
    coordinates: [number, number]; // [lat, lng]
    destination: [number, number]; // [lat, lng]
    assetType: 'vehicle' | 'personnel' | 'equipment';
    preferences?: {
        avoidTolls?: boolean;
        avoidHighways?: boolean;
        optimizeFor?: 'time' | 'distance' | 'fuel';
    };
}

export interface RouteResponse {
    recommendedRoute: Array<[number, number]>; // waypoints
    estimatedTime: number; // minutes
    estimatedDistance: number; // kilometers
    riskAssessment: 'low' | 'medium' | 'high';
    alternativeRoutes: Array<{
        waypoints: Array<[number, number]>;
        estimatedTime: number;
        estimatedDistance: number;
        description: string;
    }>;
    warnings?: string[];
}

export interface GeoAnalysisRequest {
    location: [number, number]; // [lat, lng]
    radius: number; // meters
    analysisType: 'risk' | 'efficiency' | 'compliance';
}

export interface GeoAnalysisResponse {
    location: [number, number];
    riskScore: number; // 0-100
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    economicIndicators: {
        activityLevel: number; // 0-100
        infrastructureQuality: number; // 0-100
        accessibilityScore: number; // 0-100
    };
    recommendations: string[];
    nearbyFacilities: Array<{
        type: 'bcv_branch' | 'bank' | 'government' | 'security';
        name: string;
        distance: number; // meters
        coordinates: [number, number];
    }>;
    complianceFactors: {
        regulatoryZone: string;
        restrictions: string[];
        requiredPermissions: string[];
    };
}

// WebSocket Message Types
export interface WebSocketMessage {
    type: 'location_update' | 'notification' | 'asset_status' | 'route_update';
    payload: any;
    timestamp: Date;
}

// Kalman Filter Types
export interface KalmanFilterState {
    latitude: number;
    longitude: number;
    latitudeVelocity: number;
    longitudeVelocity: number;
    accuracy: number;
}

export interface KalmanFilterConfig {
    processNoise: number; // Q
    measurementNoise: number; // R
    estimationError: number; // P
}

export interface GeoCoordinate {
    latitude: number;
    longitude: number;
}

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: number;
}

export interface Asset {
    id: string;
    name: string;
    type: string;
    currentLocation?: LocationData;
    status?: 'active' | 'inactive' | 'maintenance';
}

export interface LocationUpdate {
    assetId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy?: number;
}

export interface GeofenceAlert {
    id: string;
    assetId: string;
    geofenceId: string;
    alertType: 'entry' | 'exit' | 'dwell';
    timestamp: number;
    location: GeoCoordinate;
}
