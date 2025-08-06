# BCV Asset Tracking - Technical Specification
## Implementation Details for GPS Migration & DeepSeek Integration

### 📋 Overview

This document provides detailed technical specifications for implementing GPS-based asset tracking and DeepSeek AI integration in the BCV application.

### 🔧 Dependencies & Package Updates

#### Web Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.7.1",
    "@capacitor/geolocation": "^6.0.1",
    "@capacitor/background-mode": "^6.0.2",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "socket.io-client": "^4.7.5",
    "workbox-webpack-plugin": "^7.0.0",
    "@sentry/react": "^7.99.0",
    "redis": "^4.6.12",
    "axios": "^1.6.7"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "@capacitor/cli": "^6.0.0"
  }
}
```

#### Android Dependencies (build.gradle)
```gradle
dependencies {
    // Existing dependencies...
    
    // Jetpack Compose BOM
    implementation platform('androidx.compose:compose-bom:2024.02.00')
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.ui:ui-tooling-preview'
    implementation 'androidx.compose.material3:material3'
    implementation 'androidx.activity:activity-compose:1.8.2'
    
    // Location Services
    implementation 'com.google.android.gms:play-services-location:21.0.1'
    implementation 'com.google.android.gms:play-services-maps:18.2.0'
    
    // WorkManager for background tasks
    implementation 'androidx.work:work-runtime-ktx:2.9.0'
    
    // Networking
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'
    
    // WebSocket
    implementation 'org.java-websocket:Java-WebSocket:1.5.4'
}
```

### 🌍 Location Services Implementation

#### Web Geolocation Service
```typescript
// services/locationService.ts
export class LocationService {
  private watchId: number | null = null;
  private kalmanFilter: KalmanFilter;
  private websocket: WebSocket | null = null;

  constructor() {
    this.kalmanFilter = new KalmanFilter({
      R: 0.01, // Measurement noise
      Q: 0.01, // Process noise
    });
  }

  async startTracking(assetId: string): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleLocationUpdate(assetId, position),
      (error) => this.handleLocationError(error),
      options
    );

    await this.initializeWebSocket(assetId);
  }

  private handleLocationUpdate(assetId: string, position: GeolocationPosition): void {
    const filteredCoordinate = this.kalmanFilter.filter({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    });

    const locationUpdate: LocationUpdate = {
      assetId,
      coordinate: {
        latitude: filteredCoordinate.latitude,
        longitude: filteredCoordinate.longitude,
        accuracy: filteredCoordinate.accuracy,
        timestamp: new Date(),
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed
      },
      networkType: this.getNetworkType()
    };

    this.sendLocationUpdate(locationUpdate);
  }

  private async initializeWebSocket(assetId: string): Promise<void> {
    const wsUrl = `${process.env.REACT_APP_WS_URL}/location/${assetId}`;
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('Location WebSocket connected');
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      Sentry.captureException(error, {
        tags: { component: 'location-websocket' }
      });
    };
  }
}
```

#### Android Location Service (Kotlin)
```kotlin
// android/app/src/main/java/com/bcv/app/LocationService.kt
@AndroidEntryPoint
class LocationService : Service() {
    
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var kalmanFilter: KalmanFilter
    
    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        kalmanFilter = KalmanFilter()
        setupLocationCallback()
    }
    
    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    val filteredLocation = kalmanFilter.filter(location)
                    sendLocationUpdate(filteredLocation)
                }
            }
        }
    }
    
    @SuppressLint("MissingPermission")
    fun startLocationUpdates() {
        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            5000L // 5 seconds
        ).apply {
            setMinUpdateIntervalMillis(1000L)
            setMaxUpdateDelayMillis(10000L)
        }.build()
        
        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }
    
    private fun sendLocationUpdate(location: Location) {
        val locationUpdate = LocationUpdate(
            assetId = getAssetId(),
            coordinate = GeoCoordinate(
                latitude = location.latitude,
                longitude = location.longitude,
                accuracy = location.accuracy,
                timestamp = Date(location.time),
                altitude = if (location.hasAltitude()) location.altitude else null,
                heading = if (location.hasBearing()) location.bearing else null,
                speed = if (location.hasSpeed()) location.speed else null
            ),
            batteryLevel = getBatteryLevel(),
            networkType = getNetworkType()
        )
        
        // Send via WebSocket or queue for later
        WebSocketManager.sendLocationUpdate(locationUpdate)
    }
}
```

### 🤖 DeepSeek Integration

#### DeepSeek API Client
```typescript
// services/deepSeekService.ts
export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';
  private redisClient: Redis;

  constructor() {
    this.apiKey = process.env.REACT_APP_DEEPSEEK_API_KEY || '';
    this.redisClient = new Redis(process.env.REACT_APP_REDIS_URL);
  }

  async processRoute(request: RouteRequest): Promise<RouteResponse> {
    const cacheKey = `route:${JSON.stringify(request)}`;
    
    try {
      // Try DeepSeek API first
      const response = await this.callDeepSeekAPI('/chat', {
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: this.buildRoutePrompt(request)
        }]
      });

      const result = this.parseRouteResponse(response);
      
      // Cache successful response
      await this.redisClient.setex(cacheKey, 86400, JSON.stringify(result));
      
      return result;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { 
          component: 'deepseek-integration',
          operation: 'route-processing'
        }
      });

      // Fallback to Redis cache
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw new Error('DeepSeek API unavailable and no cached response');
    }
  }

  async analyzeGeoContext(request: GeoAnalysisRequest): Promise<GeoAnalysisResponse> {
    const cacheKey = `geo:${request.location.join(',')}_${request.radius}`;
    
    try {
      const response = await this.callDeepSeekAPI('/chat', {
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: this.buildGeoAnalysisPrompt(request)
        }]
      });

      const result = this.parseGeoAnalysisResponse(response);
      
      // Cache for 24 hours
      await this.redisClient.setex(cacheKey, 86400, JSON.stringify(result));
      
      return result;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { 
          component: 'deepseek-integration',
          operation: 'geo-analysis'
        }
      });

      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      throw new Error('DeepSeek geo-analysis unavailable');
    }
  }

  private buildRoutePrompt(request: RouteRequest): string {
    return `
      Analyze the optimal route for a ${request.assetType} from coordinates 
      [${request.coordinates.join(', ')}] to destination [${request.destination.join(', ')}].
      
      Consider:
      - Traffic patterns in Caracas/Venezuela
      - Security zones and restricted areas
      - Fuel efficiency for vehicles
      - Time optimization
      - BCV facility proximity
      
      Provide response in JSON format with:
      - recommendedRoute: array of waypoints
      - estimatedTime: minutes
      - riskAssessment: low/medium/high
      - alternativeRoutes: array of alternatives
    `;
  }

  private buildGeoAnalysisPrompt(request: GeoAnalysisRequest): string {
    return `
      Perform geo-contextual analysis for location [${request.location.join(', ')}] 
      within ${request.radius}m radius in Venezuela.
      
      Analysis type: ${request.analysisType}
      
      Provide insights on:
      - Security risk level
      - Economic activity indicators
      - Infrastructure quality
      - BCV operational relevance
      - Regulatory compliance factors
      
      Return JSON with risk scores and recommendations.
    `;
  }
}
```

### 📊 Asset Tracking Dashboard

#### Real-time Dashboard Component
```typescript
// components/tracking/AssetTrackingDashboard.tsx
export const AssetTrackingDashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.4806, -66.9036]); // Caracas
  const websocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    initializeWebSocket();
    loadAssets();
    
    return () => {
      websocketRef.current?.close();
    };
  }, []);

  const initializeWebSocket = () => {
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/assets`);
    
    ws.onmessage = (event) => {
      const locationUpdate: LocationUpdate = JSON.parse(event.data);
      updateAssetLocation(locationUpdate);
    };
    
    ws.onerror = (error) => {
      Sentry.captureException(error, {
        tags: { component: 'asset-tracking-websocket' }
      });
    };
    
    websocketRef.current = ws;
  };

  const updateAssetLocation = (update: LocationUpdate) => {
    setAssets(prev => prev.map(asset => 
      asset.id === update.assetId 
        ? { ...asset, currentLocation: update.coordinate, lastUpdate: new Date() }
        : asset
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
      {/* Asset List */}
      <Card title="Assets en Tiempo Real" className="lg:col-span-1">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {assets.map(asset => (
            <AssetCard 
              key={asset.id}
              asset={asset}
              isSelected={selectedAsset?.id === asset.id}
              onClick={() => setSelectedAsset(asset)}
            />
          ))}
        </div>
      </Card>

      {/* Map View */}
      <Card title="Mapa de Ubicaciones" className="lg:col-span-2">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          className="h-96 w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {assets.map(asset => (
            <AssetMarker 
              key={asset.id}
              asset={asset}
              isSelected={selectedAsset?.id === asset.id}
              onClick={() => setSelectedAsset(asset)}
            />
          ))}
          {selectedAsset && (
            <GeofenceOverlay geofences={selectedAsset.geofences} />
          )}
        </MapContainer>
      </Card>

      {/* Asset Details */}
      <Card title="Detalles del Asset" className="lg:col-span-1">
        {selectedAsset ? (
          <AssetDetails asset={selectedAsset} />
        ) : (
          <div className="text-center text-gray-500 py-8">
            Seleccione un asset para ver detalles
          </div>
        )}
      </Card>
    </div>
  );
};
```

### 🔋 Battery Optimization (Android)

#### WorkManager Implementation
```kotlin
// android/app/src/main/java/com/bcv/app/LocationWorker.kt
@HiltWorker
class LocationWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val locationRepository: LocationRepository
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val batteryLevel = getBatteryLevel()
            val isCharging = isDeviceCharging()
            
            // Adaptive frequency based on battery and movement
            val updateInterval = calculateOptimalInterval(batteryLevel, isCharging)
            
            locationRepository.getCurrentLocation()?.let { location ->
                locationRepository.sendLocationUpdate(location)
            }
            
            // Schedule next update
            scheduleNextUpdate(updateInterval)
            
            Result.success()
        } catch (exception: Exception) {
            Sentry.captureException(exception)
            Result.retry()
        }
    }
    
    private fun calculateOptimalInterval(batteryLevel: Int, isCharging: Boolean): Long {
        return when {
            isCharging -> 5_000L // 5 seconds when charging
            batteryLevel > 50 -> 10_000L // 10 seconds with good battery
            batteryLevel > 20 -> 30_000L // 30 seconds with medium battery
            else -> 60_000L // 1 minute with low battery
        }
    }
}
```

### 🌐 PWA Configuration

#### Service Worker for Offline Support
```typescript
// public/sw.js
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache location data for offline access
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/locations'),
  new NetworkFirst({
    cacheName: 'location-cache',
    networkTimeoutSeconds: 3,
    plugins: [{
      cacheKeyWillBeUsed: async ({ request }) => {
        return `${request.url}?timestamp=${Math.floor(Date.now() / 60000)}`;
      }
    }]
  })
);

// Cache map tiles
registerRoute(
  ({ url }) => url.hostname.includes('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [{
      cacheExpiration: {
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      }
    }]
  })
);

// Handle offline location updates
self.addEventListener('sync', event => {
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationUpdates());
  }
});

async function syncLocationUpdates() {
  const updates = await getQueuedLocationUpdates();
  for (const update of updates) {
    try {
      await fetch('/api/locations', {
        method: 'POST',
        body: JSON.stringify(update),
        headers: { 'Content-Type': 'application/json' }
      });
      await removeFromQueue(update.id);
    } catch (error) {
      console.error('Failed to sync location update:', error);
    }
  }
}
```

### 🔒 Security & Permissions

#### Android Permissions (AndroidManifest.xml)
```xml
<!-- Location permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Background processing -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Battery optimization -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />

<application>
    <!-- Location Service -->
    <service
        android:name=".LocationService"
        android:foregroundServiceType="location"
        android:exported="false" />
        
    <!-- WorkManager -->
    <provider
        android:name="androidx.startup.InitializationProvider"
        android:authorities="${applicationId}.androidx-startup"
        android:exported="false"
        tools:node="merge">
        <meta-data
            android:name="androidx.work.WorkManagerInitializer"
            android:value="androidx.startup" />
    </provider>
</application>
```

### 📈 Performance Monitoring

#### Sentry Configuration
```typescript
// services/monitoring.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/api\.bcv\./, /^https:\/\/deepseek\./],
    }),
  ],
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive location data
    if (event.extra?.coordinates) {
      delete event.extra.coordinates;
    }
    return event;
  }
});

export const trackLocationAccuracy = (accuracy: number) => {
  Sentry.addBreadcrumb({
    category: 'location',
    message: `GPS accuracy: ${accuracy}m`,
    level: accuracy > 10 ? 'warning' : 'info',
    data: { accuracy }
  });
};

export const trackDeepSeekCall = (endpoint: string, duration: number, success: boolean) => {
  Sentry.addBreadcrumb({
    category: 'deepseek-integration',
    message: `API call to ${endpoint}`,
    level: success ? 'info' : 'error',
    data: { endpoint, duration, success }
  });
};
```

### 🧪 Testing Strategy

#### Unit Tests for Location Services
```typescript
// __tests__/locationService.test.ts
describe('LocationService', () => {
  let locationService: LocationService;
  let mockGeolocation: jest.Mocked<Geolocation>;

  beforeEach(() => {
    mockGeolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    });
    
    locationService = new LocationService();
  });

  it('should start location tracking with high accuracy', async () => {
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: 10.4806,
        longitude: -66.9036,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };

    mockGeolocation.watchPosition.mockImplementation((success) => {
      success(mockPosition);
      return 1;
    });

    await locationService.startTracking('asset-123');

    expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    );
  });
});
```

### 📋 Implementation Checklist

#### Phase 1: Foundation
- [ ] Update package.json with location and mapping dependencies
- [ ] Configure Capacitor plugins for geolocation
- [ ] Set up DeepSeek API client with error handling
- [ ] Implement basic location service for web
- [ ] Create asset tracking data models

#### Phase 2: Core Features  
- [ ] Implement Kalman filtering for GPS accuracy
- [ ] Set up WebSocket for real-time location streaming
- [ ] Create asset tracking dashboard with map integration
- [ ] Integrate DeepSeek for route processing
- [ ] Add Redis caching layer

#### Phase 3: Android Migration
- [ ] Convert MainActivity to Kotlin with Compose
- [ ] Implement FusedLocationProvider service
- [ ] Add WorkManager for background location updates
- [ ] Configure Android permissions and security

#### Phase 4: Advanced Features
- [ ] Implement geofencing with alerts
- [ ] Add PWA support with service worker
- [ ] Integrate Sentry monitoring
- [ ] Optimize battery consumption algorithms

#### Phase 5: Testing & Deployment
- [ ] Write comprehensive unit and integration tests
- [ ] Performance testing and optimization
- [ ] Security audit and penetration testing
- [ ] Production deployment with monitoring

---

**Document Version**: 1.0  
**Implementation Timeline**: 5 weeks  
**Next Review**: Weekly during development
