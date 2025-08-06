import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Asset, LocationUpdate, GeofenceAlert } from '../types';

/**
 * SentryService - Monitoreo y logging avanzado con integración DeepSeek
 * Proporciona tracking de errores, performance y eventos específicos de BCV
 */
export class SentryService {
    private static instance: SentryService;
    private isInitialized: boolean = false;
    private userId: string | null = null;
    private sessionId: string;

    constructor() {
        this.sessionId = this.generateSessionId();
    }

    static getInstance(): SentryService {
        if (!SentryService.instance) {
            SentryService.instance = new SentryService();
        }
        return SentryService.instance;
    }

    /**
     * Inicializar Sentry con configuración específica para BCV
     */
    initialize(): void {
        if (this.isInitialized) return;

        const dsn = process.env.REACT_APP_SENTRY_DSN;
        if (!dsn) {
            console.warn('Sentry DSN not configured. Error tracking disabled.');
            return;
        }

        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            release: `bcv-asset-tracking@${process.env.REACT_APP_VERSION || '1.0.0'}`,
            
            // Integrations
            integrations: [
                new BrowserTracing({
                    tracePropagationTargets: [
                        'localhost',
                        /^https:\/\/api\.bcv\./,
                        /^https:\/\/.*\.vercel\.app/,
                        /^https:\/\/api\.deepseek\.com/
                    ],
                }),
                new Sentry.Replay({
                    maskAllText: true,
                    blockAllMedia: true,
                }),
            ],

            // Performance monitoring
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            
            // Session replay
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,

            // Error filtering
            beforeSend: this.beforeSend.bind(this),
            beforeSendTransaction: this.beforeSendTransaction.bind(this),

            // Initial scope configuration
            initialScope: {
                tags: {
                    component: 'bcv-asset-tracking',
                    platform: 'web',
                    session: this.sessionId
                },
                contexts: {
                    app: {
                        name: 'BCV Asset Tracking',
                        version: process.env.REACT_APP_VERSION || '1.0.0'
                    }
                }
            }
        });

        // Set user context
        this.setUserContext();

        this.isInitialized = true;
        console.log('Sentry initialized successfully');
    }

    /**
     * Configurar contexto de usuario
     */
    setUserContext(userId?: string, userData?: Record<string, any>): void {
        this.userId = userId || this.userId;
        
        Sentry.setUser({
            id: this.userId || 'anonymous',
            ...userData
        });
    }

    /**
     * Tracking específico para DeepSeek API calls
     */
    trackDeepSeekCall(
        operation: 'route-processing' | 'geo-analysis' | 'content-generation',
        data: {
            endpoint: string;
            duration: number;
            success: boolean;
            cacheHit?: boolean;
            errorCode?: string;
            requestSize?: number;
            responseSize?: number;
        }
    ): void {
        const transaction = Sentry.startTransaction({
            name: `DeepSeek ${operation}`,
            op: 'deepseek.api'
        });

        // Add tags for filtering
        transaction.setTag('deepseek.operation', operation);
        transaction.setTag('deepseek.success', data.success);
        transaction.setTag('deepseek.cache_hit', data.cacheHit || false);

        // Add context data
        transaction.setContext('deepseek', {
            endpoint: data.endpoint,
            duration: data.duration,
            success: data.success,
            cacheHit: data.cacheHit,
            errorCode: data.errorCode,
            requestSize: data.requestSize,
            responseSize: data.responseSize
        });

        // Performance metrics
        transaction.setMeasurement('deepseek.duration', data.duration, 'millisecond');
        if (data.requestSize) {
            transaction.setMeasurement('deepseek.request_size', data.requestSize, 'byte');
        }
        if (data.responseSize) {
            transaction.setMeasurement('deepseek.response_size', data.responseSize, 'byte');
        }

        // Add breadcrumb
        Sentry.addBreadcrumb({
            category: 'deepseek-integration',
            message: `${operation} ${data.success ? 'completed' : 'failed'}`,
            level: data.success ? 'info' : 'error',
            data: {
                endpoint: data.endpoint,
                duration: data.duration,
                cacheHit: data.cacheHit,
                errorCode: data.errorCode
            }
        });

        transaction.finish();

        // Track errors separately
        if (!data.success && data.errorCode) {
            this.captureDeepSeekError(operation, data.errorCode, {
                endpoint: data.endpoint,
                duration: data.duration
            });
        }
    }

    /**
     * Capturar errores específicos de DeepSeek
     */
    captureDeepSeekError(
        operation: string,
        errorCode: string,
        context: Record<string, any>
    ): void {
        Sentry.withScope(scope => {
            scope.setTag('deepseek.operation', operation);
            scope.setTag('deepseek.error_code', errorCode);
            scope.setContext('deepseek_error', context);
            
            Sentry.captureException(new Error(`DeepSeek ${operation} failed: ${errorCode}`));
        });
    }

    /**
     * Tracking de precisión GPS
     */
    trackGPSAccuracy(assetId: string, accuracy: number, coordinate: { lat: number; lng: number }): void {
        // Solo trackear si la precisión es problemática
        if (accuracy > 10) {
            Sentry.addBreadcrumb({
                category: 'gps',
                message: `Low GPS accuracy: ${accuracy}m`,
                level: 'warning',
                data: {
                    assetId,
                    accuracy,
                    latitude: coordinate.lat,
                    longitude: coordinate.lng
                }
            });

            // Crear métrica personalizada
            Sentry.setMeasurement('gps.accuracy', accuracy, 'meter');
        }

        // Trackear métricas de precisión
        if (accuracy <= 5) {
            Sentry.addBreadcrumb({
                category: 'gps',
                message: `High GPS accuracy achieved: ${accuracy}m`,
                level: 'info',
                data: { assetId, accuracy }
            });
        }
    }

    /**
     * Tracking de alertas de geocercas
     */
    trackGeofenceAlert(alert: GeofenceAlert): void {
        const transaction = Sentry.startTransaction({
            name: 'Geofence Alert',
            op: 'geofence.alert'
        });

        transaction.setTag('geofence.type', alert.type);
        transaction.setTag('geofence.severity', alert.severity);
        transaction.setTag('asset.id', alert.assetId);

        transaction.setContext('geofence_alert', {
            alertId: alert.id,
            assetId: alert.assetId,
            geofenceId: alert.geofenceId,
            type: alert.type,
            severity: alert.severity,
            location: {
                latitude: alert.location.latitude,
                longitude: alert.location.longitude,
                accuracy: alert.location.accuracy
            },
            timestamp: alert.timestamp
        });

        Sentry.addBreadcrumb({
            category: 'geofence',
            message: `Geofence ${alert.type} alert - ${alert.severity}`,
            level: alert.severity === 'critical' ? 'error' : 'warning',
            data: {
                alertId: alert.id,
                assetId: alert.assetId,
                type: alert.type,
                severity: alert.severity
            }
        });

        transaction.finish();

        // Capturar alertas críticas como errores
        if (alert.severity === 'critical') {
            Sentry.withScope(scope => {
                scope.setTag('alert.type', 'geofence_critical');
                scope.setContext('critical_alert', {
                    alertId: alert.id,
                    assetId: alert.assetId,
                    geofenceId: alert.geofenceId
                });
                
                Sentry.captureMessage(
                    `Critical geofence alert: Asset ${alert.assetId} ${alert.type}`,
                    'error'
                );
            });
        }
    }

    /**
     * Tracking de actualizaciones de ubicación
     */
    trackLocationUpdate(update: LocationUpdate): void {
        // Solo trackear actualizaciones problemáticas o importantes
        if (update.coordinate.accuracy > 20) {
            Sentry.addBreadcrumb({
                category: 'location',
                message: `Poor location accuracy: ${update.coordinate.accuracy}m`,
                level: 'warning',
                data: {
                    assetId: update.assetId,
                    accuracy: update.coordinate.accuracy,
                    networkType: update.networkType,
                    batteryLevel: update.batteryLevel
                }
            });
        }

        // Trackear problemas de batería
        if (update.batteryLevel && update.batteryLevel < 15) {
            Sentry.addBreadcrumb({
                category: 'battery',
                message: `Low battery warning: ${update.batteryLevel}%`,
                level: 'warning',
                data: {
                    assetId: update.assetId,
                    batteryLevel: update.batteryLevel
                }
            });
        }
    }

    /**
     * Tracking de performance de componentes
     */
    trackComponentPerformance(
        componentName: string,
        operation: string,
        duration: number,
        metadata?: Record<string, any>
    ): void {
        const transaction = Sentry.startTransaction({
            name: `${componentName}.${operation}`,
            op: 'component.performance'
        });

        transaction.setTag('component.name', componentName);
        transaction.setTag('component.operation', operation);
        transaction.setMeasurement(`${componentName}.${operation}.duration`, duration, 'millisecond');

        if (metadata) {
            transaction.setContext('component_metadata', metadata);
        }

        // Alertar sobre componentes lentos
        if (duration > 1000) {
            Sentry.addBreadcrumb({
                category: 'performance',
                message: `Slow component operation: ${componentName}.${operation} (${duration}ms)`,
                level: 'warning',
                data: { componentName, operation, duration, ...metadata }
            });
        }

        transaction.finish();
    }

    /**
     * Tracking de errores de red
     */
    trackNetworkError(
        url: string,
        method: string,
        statusCode: number,
        errorMessage: string,
        duration?: number
    ): void {
        Sentry.withScope(scope => {
            scope.setTag('network.url', url);
            scope.setTag('network.method', method);
            scope.setTag('network.status_code', statusCode);
            
            scope.setContext('network_error', {
                url,
                method,
                statusCode,
                errorMessage,
                duration
            });

            Sentry.addBreadcrumb({
                category: 'network',
                message: `Network error: ${method} ${url} - ${statusCode}`,
                level: 'error',
                data: { url, method, statusCode, errorMessage, duration }
            });

            Sentry.captureException(new Error(`Network Error: ${errorMessage}`));
        });
    }

    /**
     * Tracking de eventos de usuario
     */
    trackUserAction(
        action: string,
        category: string,
        metadata?: Record<string, any>
    ): void {
        Sentry.addBreadcrumb({
            category: `user.${category}`,
            message: `User action: ${action}`,
            level: 'info',
            data: { action, category, ...metadata }
        });

        // Trackear acciones críticas
        const criticalActions = ['asset_tracking_started', 'geofence_created', 'emergency_alert'];
        if (criticalActions.includes(action)) {
            Sentry.withScope(scope => {
                scope.setTag('user.action', action);
                scope.setTag('user.category', category);
                scope.setContext('user_action', { action, category, ...metadata });
                
                Sentry.captureMessage(`Critical user action: ${action}`, 'info');
            });
        }
    }

    /**
     * Filtro de eventos antes de enviar
     */
    private beforeSend(event: Sentry.Event): Sentry.Event | null {
        // Filtrar información sensible
        if (event.extra) {
            // Remover coordenadas exactas de los logs
            if (event.extra.coordinates) {
                delete event.extra.coordinates;
            }
            
            // Remover API keys
            if (event.extra.apiKey) {
                event.extra.apiKey = '[REDACTED]';
            }
        }

        // Filtrar errores de red comunes en desarrollo
        if (process.env.NODE_ENV === 'development') {
            if (event.exception?.values?.[0]?.value?.includes('Network Error')) {
                return null;
            }
        }

        return event;
    }

    /**
     * Filtro de transacciones antes de enviar
     */
    private beforeSendTransaction(event: Sentry.Event): Sentry.Event | null {
        // Filtrar transacciones muy rápidas en desarrollo
        if (process.env.NODE_ENV === 'development') {
            const duration = event.timestamp && event.start_timestamp 
                ? (event.timestamp - event.start_timestamp) * 1000 
                : 0;
            
            if (duration < 10) {
                return null;
            }
        }

        return event;
    }

    /**
     * Generar ID de sesión único
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Capturar excepción con contexto enriquecido
     */
    captureException(
        error: Error,
        context?: {
            tags?: Record<string, string>;
            extra?: Record<string, any>;
            level?: Sentry.SeverityLevel;
        }
    ): void {
        Sentry.withScope(scope => {
            if (context?.tags) {
                Object.entries(context.tags).forEach(([key, value]) => {
                    scope.setTag(key, value);
                });
            }

            if (context?.extra) {
                scope.setContext('additional_context', context.extra);
            }

            if (context?.level) {
                scope.setLevel(context.level);
            }

            Sentry.captureException(error);
        });
    }

    /**
     * Obtener estadísticas de la sesión actual
     */
    getSessionStats(): {
        sessionId: string;
        userId: string | null;
        isInitialized: boolean;
    } {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            isInitialized: this.isInitialized
        };
    }
}

// Exportar instancia singleton
export const sentryService = SentryService.getInstance();

// Inicializar automáticamente
sentryService.initialize();
