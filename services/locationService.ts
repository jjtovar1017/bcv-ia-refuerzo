import { Geolocation } from '@capacitor/geolocation';
import { KalmanFilter } from './kalmanFilter';
import { GeoCoordinate, LocationUpdate, Asset, WebSocketMessage } from '../types';
import * as Sentry from '@sentry/react';
import { io, Socket } from 'socket.io-client';

/**
 * LocationService handles real-time GPS tracking with high accuracy
 * Features: Kalman filtering, WebSocket streaming, battery optimization
 */
export class LocationService {
    private watchId: string | null = null;
    private kalmanFilter: KalmanFilter;
    private websocket: Socket | null = null;
    private isTracking: boolean = false;
    private currentAssetId: string | null = null;
    private lastLocationUpdate: Date | null = null;
    private locationQueue: LocationUpdate[] = [];
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    constructor() {
        this.kalmanFilter = new KalmanFilter({
            processNoise: 0.01,
            measurementNoise: 0.1,
            estimationError: 1.0
        });
    }

    /**
     * Start real-time location tracking for an asset
     * @param assetId Unique identifier for the asset being tracked
     * @param options Tracking configuration options
     */
    async startTracking(
        assetId: string, 
        options: {
            enableHighAccuracy?: boolean;
            timeout?: number;
            maximumAge?: number;
            updateInterval?: number;
        } = {}
    ): Promise<void> {
        if (this.isTracking) {
            await this.stopTracking();
        }

        this.currentAssetId = assetId;
        this.isTracking = true;
        this.kalmanFilter.reset();

        // Check permissions first
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
            const requestResult = await Geolocation.requestPermissions();
            if (requestResult.location !== 'granted') {
                throw new Error('Location permission denied');
            }
        }

        // Configure tracking options
        const trackingOptions = {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout ?? 10000,
            maximumAge: options.maximumAge ?? 0,
            ...options
        };

        try {
            // Initialize WebSocket connection
            await this.initializeWebSocket(assetId);

            // Start location watching
            this.watchId = await Geolocation.watchPosition(
                trackingOptions,
                (position, err) => {
                    if (err) {
                        this.handleLocationError(err);
                        return;
                    }
                    if (position) {
                        this.handleLocationUpdate(position);
                    }
                }
            );

            Sentry.addBreadcrumb({
                category: 'location',
                message: `Started tracking asset ${assetId}`,
                level: 'info',
                data: { assetId, options: trackingOptions }
            });

        } catch (error) {
            this.isTracking = false;
            this.currentAssetId = null;
            Sentry.captureException(error, {
                tags: { component: 'location-service', operation: 'start-tracking' }
            });
            throw error;
        }
    }

    /**
     * Stop location tracking
     */
    async stopTracking(): Promise<void> {
        if (this.watchId) {
            await Geolocation.clearWatch({ id: this.watchId });
            this.watchId = null;
        }

        if (this.websocket) {
            this.websocket.disconnect();
            this.websocket = null;
        }

        this.isTracking = false;
        this.currentAssetId = null;
        this.lastLocationUpdate = null;
        this.reconnectAttempts = 0;

        // Send any queued updates before stopping
        await this.flushLocationQueue();

        Sentry.addBreadcrumb({
            category: 'location',
            message: 'Stopped location tracking',
            level: 'info'
        });
    }

    /**
     * Get current location once (no tracking)
     */
    async getCurrentLocation(): Promise<GeoCoordinate> {
        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });

            const coordinate: GeoCoordinate = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp),
                altitude: position.coords.altitude || undefined,
                heading: position.coords.heading || undefined,
                speed: position.coords.speed || undefined
            };

            // Apply Kalman filtering even for single readings
            return this.kalmanFilter.filter(coordinate);

        } catch (error) {
            Sentry.captureException(error, {
                tags: { component: 'location-service', operation: 'get-current-location' }
            });
            throw new Error(`Failed to get current location: ${error}`);
        }
    }

    private async initializeWebSocket(assetId: string): Promise<void> {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
        
        this.websocket = io(wsUrl, {
            transports: ['websocket'],
            timeout: 5000,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000
        });

        return new Promise((resolve, reject) => {
            if (!this.websocket) {
                reject(new Error('Failed to create WebSocket connection'));
                return;
            }

            this.websocket.on('connect', () => {
                console.log('Location WebSocket connected');
                this.reconnectAttempts = 0;
                
                // Join asset tracking room
                this.websocket?.emit('join_asset_tracking', { assetId });
                
                // Flush any queued location updates
                this.flushLocationQueue();
                
                resolve();
            });

            this.websocket.on('disconnect', (reason) => {
                console.warn('Location WebSocket disconnected:', reason);
                Sentry.addBreadcrumb({
                    category: 'websocket',
                    message: `WebSocket disconnected: ${reason}`,
                    level: 'warning'
                });
            });

            this.websocket.on('reconnect', (attemptNumber) => {
                console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
                this.websocket?.emit('join_asset_tracking', { assetId });
                this.flushLocationQueue();
            });

            this.websocket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.reconnectAttempts++;
                
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    Sentry.captureException(error, {
                        tags: { component: 'location-websocket', operation: 'connection' }
                    });
                    reject(error);
                }
            });

            // Set connection timeout
            setTimeout(() => {
                if (!this.websocket?.connected) {
                    reject(new Error('WebSocket connection timeout'));
                }
            }, 10000);
        });
    }

    private handleLocationUpdate(position: GeolocationPosition): void {
        if (!this.currentAssetId) return;

        try {
            // Create raw coordinate
            const rawCoordinate: GeoCoordinate = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp),
                altitude: position.coords.altitude || undefined,
                heading: position.coords.heading || undefined,
                speed: position.coords.speed || undefined
            };

            // Apply Kalman filtering for improved accuracy
            const filteredCoordinate = this.kalmanFilter.filter(rawCoordinate);

            // Track accuracy improvement
            Sentry.addBreadcrumb({
                category: 'location',
                message: `GPS accuracy improved: ${position.coords.accuracy}m → ${filteredCoordinate.accuracy}m`,
                level: filteredCoordinate.accuracy <= 5 ? 'info' : 'warning',
                data: { 
                    rawAccuracy: position.coords.accuracy,
                    filteredAccuracy: filteredCoordinate.accuracy,
                    assetId: this.currentAssetId
                }
            });

            // Create location update
            const locationUpdate: LocationUpdate = {
                assetId: this.currentAssetId,
                coordinate: filteredCoordinate,
                batteryLevel: this.getBatteryLevel(),
                networkType: this.getNetworkType()
            };

            // Send location update
            this.sendLocationUpdate(locationUpdate);
            this.lastLocationUpdate = new Date();

        } catch (error) {
            Sentry.captureException(error, {
                tags: { component: 'location-service', operation: 'handle-update' }
            });
        }
    }

    private handleLocationError(error: any): void {
        console.error('Location error:', error);
        
        let errorMessage = 'Unknown location error';
        switch (error.code) {
            case 1: // PERMISSION_DENIED
                errorMessage = 'Location permission denied';
                break;
            case 2: // POSITION_UNAVAILABLE
                errorMessage = 'Location position unavailable';
                break;
            case 3: // TIMEOUT
                errorMessage = 'Location request timeout';
                break;
        }

        Sentry.captureException(new Error(errorMessage), {
            tags: { component: 'location-service', operation: 'location-error' },
            extra: { originalError: error }
        });
    }

    private sendLocationUpdate(locationUpdate: LocationUpdate): void {
        if (this.websocket?.connected) {
            const message: WebSocketMessage = {
                type: 'location_update',
                payload: locationUpdate,
                timestamp: new Date()
            };

            this.websocket.emit('location_update', message);
        } else {
            // Queue update for later if WebSocket is not connected
            this.locationQueue.push(locationUpdate);
            
            // Limit queue size to prevent memory issues
            if (this.locationQueue.length > 100) {
                this.locationQueue = this.locationQueue.slice(-50); // Keep last 50
            }
        }
    }

    private async flushLocationQueue(): Promise<void> {
        if (!this.websocket?.connected || this.locationQueue.length === 0) {
            return;
        }

        const updates = [...this.locationQueue];
        this.locationQueue = [];

        for (const update of updates) {
            const message: WebSocketMessage = {
                type: 'location_update',
                payload: update,
                timestamp: new Date()
            };
            this.websocket.emit('location_update', message);
        }

        console.log(`Flushed ${updates.length} queued location updates`);
    }

    private getBatteryLevel(): number | undefined {
        // Try to get battery level if available
        if ('getBattery' in navigator) {
            // This is a Promise-based API, but we'll return undefined for now
            // In a real implementation, you'd cache the battery level
            return undefined;
        }
        return undefined;
    }

    private getNetworkType(): 'wifi' | 'cellular' | 'gps' {
        // Detect network type
        if ('connection' in navigator) {
            const connection = (navigator as any).connection;
            if (connection.type === 'wifi') return 'wifi';
            if (connection.type === 'cellular') return 'cellular';
        }
        return 'gps'; // Default fallback
    }

    /**
     * Check if location tracking is currently active
     */
    public isLocationTracking(): boolean {
        return this.isTracking;
    }

    /**
     * Get the currently tracked asset ID
     */
    public getCurrentAssetId(): string | null {
        return this.currentAssetId;
    }

    /**
     * Get the last location update timestamp
     */
    public getLastUpdateTime(): Date | null {
        return this.lastLocationUpdate;
    }

    /**
     * Get current Kalman filter state for debugging
     */
    public getFilterState() {
        return this.kalmanFilter.getState();
    }
}

// Export singleton instance
export const locationService = new LocationService();