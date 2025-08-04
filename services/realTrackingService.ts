import axios, { AxiosInstance } from 'axios';
import * as Sentry from '@sentry/react';
import { Asset, GeofenceAlert, LocationData } from '../types';
import { KalmanFilter } from './kalmanFilter';

export interface GPSDevice {
    id: string;
    imei: string;
    name: string;
    type: 'vehicle' | 'personnel' | 'equipment';
    status: 'active' | 'inactive' | 'maintenance';
    lastSeen: Date;
    batteryLevel?: number;
    assignedTo?: string;
}

export interface GPSPosition {
    deviceId: string;
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    accuracy: number;
    timestamp: Date;
    satellites?: number;
    hdop?: number;
}

export interface TrackingProvider {
    name: string;
    apiUrl: string;
    apiKey: string;
    enabled: boolean;
}

export class RealTrackingService {
    private apiClients: Map<string, AxiosInstance> = new Map();
    private kalmanFilters: Map<string, KalmanFilter> = new Map();
    private readonly cacheTimeout: number = 60000; // 1 minute for real-time data
    private readonly cachePrefix: string = 'tracking_cache_';
    private providers: TrackingProvider[] = [];

    constructor() {
        this.initializeProviders();
        this.setupProviders();
    }

    /**
     * Initialize tracking providers from environment variables
     */
    private initializeProviders(): void {
        // GPS Tracker providers
        const providers = [
            {
                name: 'traccar',
                apiUrl: import.meta.env?.VITE_TRACCAR_API_URL || 'http://localhost:8082/api',
                apiKey: import.meta.env?.VITE_TRACCAR_API_KEY || '',
                enabled: !!import.meta.env?.VITE_TRACCAR_API_KEY
            },
            {
                name: 'gps_gate',
                apiUrl: import.meta.env?.VITE_GPSGATE_API_URL || '',
                apiKey: import.meta.env?.VITE_GPSGATE_API_KEY || '',
                enabled: !!import.meta.env?.VITE_GPSGATE_API_KEY
            },
            {
                name: 'fleet_complete',
                apiUrl: import.meta.env?.VITE_FLEETCOMPLETE_API_URL || '',
                apiKey: import.meta.env?.VITE_FLEETCOMPLETE_API_KEY || '',
                enabled: !!import.meta.env?.VITE_FLEETCOMPLETE_API_KEY
            }
        ];

        this.providers = providers.filter(p => p.enabled);

        if (this.providers.length === 0) {
            console.warn('No GPS tracking providers configured. Service will use simulated data.');
        }
    }

    /**
     * Setup API clients for each provider
     */
    private setupProviders(): void {
        this.providers.forEach(provider => {
            const client = axios.create({
                baseURL: provider.apiUrl,
                timeout: 15000,
                headers: {
                    'Authorization': `Bearer ${provider.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'BCV-AssetTracker/1.0'
                }
            });

            // Setup interceptors
            client.interceptors.request.use(
                (config) => {
                    Sentry.addBreadcrumb({
                        category: 'gps-tracking',
                        message: `GPS API request: ${provider.name} ${config.method?.toUpperCase()} ${config.url}`,
                        level: 'info',
                        data: { provider: provider.name, url: config.url }
                    });
                    return config;
                },
                (error) => {
                    Sentry.captureException(error);
                    return Promise.reject(error);
                }
            );

            client.interceptors.response.use(
                (response) => response,
                (error) => {
                    Sentry.addBreadcrumb({
                        category: 'gps-tracking',
                        message: `GPS API error: ${provider.name} ${error.message}`,
                        level: 'error',
                        data: { 
                            provider: provider.name,
                            status: error.response?.status,
                            statusText: error.response?.statusText
                        }
                    });
                    return Promise.reject(error);
                }
            );

            this.apiClients.set(provider.name, client);
        });
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
            console.warn('Failed to cache tracking response:', error);
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
            console.warn('Failed to get cached tracking response:', error);
            return null;
        }
    }

    /**
     * Get all tracked devices
     */
    public async getDevices(): Promise<GPSDevice[]> {
        const cacheKey = 'all_devices';
        const cached = await this.getCachedResponse<GPSDevice[]>(cacheKey);
        if (cached) return cached;

        try {
            const allDevices: GPSDevice[] = [];

            // Try each provider
            for (const provider of this.providers) {
                try {
                    const devices = await this.getDevicesFromProvider(provider.name);
                    allDevices.push(...devices);
                } catch (error) {
                    console.warn(`Failed to get devices from ${provider.name}:`, error);
                }
            }

            // If no real devices, return an empty array
            if (allDevices.length === 0) {
                return [];
            }

            await this.cacheResponse(cacheKey, allDevices);
            return allDevices;
        } catch (error) {
            Sentry.captureException(error);
            console.error('Failed to get devices:', error);
            return this.getMockDevices();
        }
    }

    /**
     * Get devices from specific provider
     */
    private async getDevicesFromProvider(providerName: string): Promise<GPSDevice[]> {
        const client = this.apiClients.get(providerName);
        if (!client) return [];

        try {
            let response;
            
            switch (providerName) {
                case 'traccar':
                    response = await client.get('/devices');
                    return this.parseTraccarDevices(response.data);
                
                case 'gps_gate':
                    response = await client.get('/applications/assets');
                    return this.parseGPSGateDevices(response.data);
                
                case 'fleet_complete':
                    response = await client.get('/vehicles');
                    return this.parseFleetCompleteDevices(response.data);
                
                default:
                    return [];
            }
        } catch (error) {
            console.error(`Error getting devices from ${providerName}:`, error);
            return [];
        }
    }

    /**
     * Get current position for a device
     */
    public async getDevicePosition(deviceId: string): Promise<GPSPosition | null> {
        const cacheKey = `position_${deviceId}`;
        const cached = await this.getCachedResponse<GPSPosition>(cacheKey);
        if (cached) return cached;

        try {
            // Try each provider to find the device
            for (const provider of this.providers) {
                try {
                    const position = await this.getPositionFromProvider(provider.name, deviceId);
                    if (position) {
                        // Apply Kalman filtering for better accuracy
                        const filteredPosition = this.applyKalmanFilter(deviceId, position);
                        await this.cacheResponse(cacheKey, filteredPosition);
                        return filteredPosition;
                    }
                } catch (error) {
                    console.warn(`Failed to get position from ${provider.name}:`, error);
                }
            }

            // Return null if no real data
            return null;
        } catch (error) {
            Sentry.captureException(error);
            console.error(`Failed to get position for device ${deviceId}:`, error);
            return null;
        }
    }

    /**
     * Get position from specific provider
     */
    private async getPositionFromProvider(providerName: string, deviceId: string): Promise<GPSPosition | null> {
        const client = this.apiClients.get(providerName);
        if (!client) return null;

        try {
            let response;
            
            switch (providerName) {
                case 'traccar':
                    response = await client.get(`/positions?deviceId=${deviceId}&from=${new Date(Date.now() - 3600000).toISOString()}`);
                    return this.parseTraccarPosition(response.data[0], deviceId);
                
                case 'gps_gate':
                    response = await client.get(`/applications/assets/${deviceId}/positions/latest`);
                    return this.parseGPSGatePosition(response.data, deviceId);
                
                case 'fleet_complete':
                    response = await client.get(`/vehicles/${deviceId}/location`);
                    return this.parseFleetCompletePosition(response.data, deviceId);
                
                default:
                    return null;
            }
        } catch (error) {
            console.error(`Error getting position from ${providerName}:`, error);
            return null;
        }
    }

    /**
     * Apply Kalman filtering to improve position accuracy
     */
    private applyKalmanFilter(deviceId: string, position: GPSPosition): GPSPosition {
        if (!this.kalmanFilters.has(deviceId)) {
            this.kalmanFilters.set(deviceId, new KalmanFilter());
        }

        const filter = this.kalmanFilters.get(deviceId)!;
        const filteredState = filter.predict([position.latitude, position.longitude], position.accuracy);

        return {
            ...position,
            latitude: filteredState.latitude,
            longitude: filteredState.longitude,
            accuracy: filteredState.accuracy
        };
    }

    /**
     * Get historical positions for a device
     */
    public async getDeviceHistory(deviceId: string, hours: number = 24): Promise<GPSPosition[]> {
        const cacheKey = `history_${deviceId}_${hours}`;
        const cached = await this.getCachedResponse<GPSPosition[]>(cacheKey);
        if (cached) return cached;

        try {
            const allPositions: GPSPosition[] = [];
            const fromTime = new Date(Date.now() - hours * 60 * 60 * 1000);

            // Try each provider
            for (const provider of this.providers) {
                try {
                    const positions = await this.getHistoryFromProvider(provider.name, deviceId, fromTime);
                    allPositions.push(...positions);
                } catch (error) {
                    console.warn(`Failed to get history from ${provider.name}:`, error);
                }
            }

            // Sort by timestamp
            const sortedPositions = allPositions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            
            await this.cacheResponse(cacheKey, sortedPositions);
            return sortedPositions;
        } catch (error) {
            Sentry.captureException(error);
            console.error(`Failed to get history for device ${deviceId}:`, error);
            return [];
        }
    }

    /**
     * Get history from specific provider
     */
    private async getHistoryFromProvider(providerName: string, deviceId: string, fromTime: Date): Promise<GPSPosition[]> {
        const client = this.apiClients.get(providerName);
        if (!client) return [];

        try {
            let response;
            
            switch (providerName) {
                case 'traccar':
                    response = await client.get(`/positions?deviceId=${deviceId}&from=${fromTime.toISOString()}&to=${new Date().toISOString()}`);
                    return response.data.map((pos: any) => this.parseTraccarPosition(pos, deviceId)).filter(Boolean);
                
                case 'gps_gate':
                    response = await client.get(`/applications/assets/${deviceId}/positions?from=${fromTime.toISOString()}`);
                    return response.data.map((pos: any) => this.parseGPSGatePosition(pos, deviceId)).filter(Boolean);
                
                case 'fleet_complete':
                    response = await client.get(`/vehicles/${deviceId}/history?from=${fromTime.toISOString()}`);
                    return response.data.map((pos: any) => this.parseFleetCompletePosition(pos, deviceId)).filter(Boolean);
                
                default:
                    return [];
            }
        } catch (error) {
            console.error(`Error getting history from ${providerName}:`, error);
            return [];
        }
    }

    /**
     * Convert devices to Asset format
     */
    public async getAssets(): Promise<Asset[]> {
        const devices = await this.getDevices();
        const assets: Asset[] = [];

        for (const device of devices) {
            try {
                const position = await this.getDevicePosition(device.id);
                
                const asset: Asset = {
                    id: device.id,
                    type: device.type,
                    name: device.name,
                    description: `${device.type} - IMEI: ${device.imei}`,
                    currentLocation: position ? {
                        latitude: position.latitude,
                        longitude: position.longitude,
                        accuracy: position.accuracy,
                        timestamp: position.timestamp,
                        speed: position.speed
                    } : undefined,
                    lastUpdate: device.lastSeen,
                    status: device.status,
                    geofences: [], // Would be loaded separately
                    batteryLevel: device.batteryLevel,
                    assignedTo: device.assignedTo
                };

                assets.push(asset);
            } catch (error) {
                console.warn(`Failed to create asset for device ${device.id}:`, error);
            }
        }

        return assets;
    }

    // Parser methods for different providers
    private parseTraccarDevices(data: any[]): GPSDevice[] {
        return data.map(device => ({
            id: device.id.toString(),
            imei: device.uniqueId,
            name: device.name,
            type: this.mapDeviceType(device.category),
            status: device.status === 'online' ? 'active' : 'inactive',
            lastSeen: new Date(device.lastUpdate),
            batteryLevel: device.attributes?.battery,
            assignedTo: device.attributes?.driver
        }));
    }

    private parseGPSGateDevices(data: any[]): GPSDevice[] {
        return data.map(device => ({
            id: device.id.toString(),
            imei: device.imei,
            name: device.name,
            type: this.mapDeviceType(device.type),
            status: device.online ? 'active' : 'inactive',
            lastSeen: new Date(device.lastPositionTime),
            batteryLevel: device.battery,
            assignedTo: device.driver
        }));
    }

    private parseFleetCompleteDevices(data: any[]): GPSDevice[] {
        return data.map(device => ({
            id: device.vehicleId.toString(),
            imei: device.deviceId,
            name: device.vehicleName,
            type: 'vehicle',
            status: device.status.toLowerCase(),
            lastSeen: new Date(device.lastReportTime),
            batteryLevel: device.batteryLevel,
            assignedTo: device.driverName
        }));
    }

    private parseTraccarPosition(data: any, deviceId: string): GPSPosition | null {
        if (!data) return null;
        
        return {
            deviceId,
            latitude: data.latitude,
            longitude: data.longitude,
            altitude: data.altitude,
            speed: data.speed,
            heading: data.course,
            accuracy: data.accuracy || 10,
            timestamp: new Date(data.deviceTime),
            satellites: data.attributes?.sat,
            hdop: data.attributes?.hdop
        };
    }

    private parseGPSGatePosition(data: any, deviceId: string): GPSPosition | null {
        if (!data) return null;
        
        return {
            deviceId,
            latitude: data.latitude,
            longitude: data.longitude,
            altitude: data.altitude,
            speed: data.speed,
            heading: data.heading,
            accuracy: data.accuracy || 10,
            timestamp: new Date(data.timestamp),
            satellites: data.satellites,
            hdop: data.hdop
        };
    }

    private parseFleetCompletePosition(data: any, deviceId: string): GPSPosition | null {
        if (!data) return null;
        
        return {
            deviceId,
            latitude: data.lat,
            longitude: data.lng,
            speed: data.speed,
            heading: data.heading,
            accuracy: data.accuracy || 10,
            timestamp: new Date(data.timestamp)
        };
    }

    private mapDeviceType(category: string): 'vehicle' | 'personnel' | 'equipment' {
        const lowerCategory = category?.toLowerCase() || '';
        
        if (lowerCategory.includes('vehicle') || lowerCategory.includes('car') || lowerCategory.includes('truck')) {
            return 'vehicle';
        } else if (lowerCategory.includes('person') || lowerCategory.includes('personnel')) {
            return 'personnel';
        } else {
            return 'equipment';
        }
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
            console.warn('Failed to clear tracking cache:', error);
        }
    }
}

// Export singleton instance
export const realTrackingService = new RealTrackingService();
