import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Asset, LocationUpdate, WebSocketMessage, GeofenceAlert } from '../../types';
import { realTrackingService } from '../../services/realTrackingService';
import { locationService } from '../../services/locationService';
import { deepSeekService } from '../../services/deepSeekService';
import { LocationIcon, TruckIcon, UserGroupIcon, CubeIcon } from '../icons/Icons';
import * as Sentry from '@sentry/react';

// Custom Leaflet icons for different asset types
const createAssetIcon = (type: Asset['type'], status: Asset['status']) => {
  const getColor = () => {
    switch (status) {
      case 'active': return '#10B981'; // Green
      case 'inactive': return '#6B7280'; // Gray
      case 'maintenance': return '#F59E0B'; // Yellow
      case 'emergency': return '#EF4444'; // Red
      default: return '#6B7280';
    }
  };

  const getIconPath = () => {
    switch (type) {
      case 'vehicle': return 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m15.75 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125A1.125 1.125 0 0021 16.875v-4.125m0 0V9.75a2.25 2.25 0 00-2.25-2.25H15a2.25 2.25 0 00-2.25 2.25v.375m0 0v5.25m0-5.25h4.5m-4.5 0a2.25 2.25 0 01-2.25-2.25V6.375a1.125 1.125 0 011.125-1.125h2.25A1.125 1.125 0 0115 6.375v1.5';
      case 'personnel': return 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z';
      case 'equipment': return 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9';
      default: return 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z';
    }
  };

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${getColor()}" width="32" height="32">
        <path d="${getIconPath()}" />
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, isSelected, onClick }) => {
  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Asset['type']) => {
    switch (type) {
      case 'vehicle': return <TruckIcon className="w-5 h-5" />;
      case 'personnel': return <UserGroupIcon className="w-5 h-5" />;
      case 'equipment': return <CubeIcon className="w-5 h-5" />;
      default: return <LocationIcon className="w-5 h-5" />;
    }
  };

  const timeSinceUpdate = asset.lastUpdate ? 
    Math.floor((Date.now() - asset.lastUpdate.getTime()) / 1000) : 0;

  return (
    <div 
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-bcv-blue bg-bcv-blue/5' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getTypeIcon(asset.type)}
          <span className="font-medium text-sm">{asset.name}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
          {asset.status}
        </span>
      </div>
      
      <div className="text-xs text-gray-600 space-y-1">
        <div>Precisión: {asset.currentLocation.accuracy.toFixed(1)}m</div>
        <div>Actualizado: {timeSinceUpdate < 60 ? `${timeSinceUpdate}s` : `${Math.floor(timeSinceUpdate / 60)}m`}</div>
        {asset.batteryLevel && (
          <div>Batería: {asset.batteryLevel}%</div>
        )}
      </div>
    </div>
  );
};

interface AssetDetailsProps {
  asset: Asset;
}

const AssetDetails: React.FC<AssetDetailsProps> = ({ asset }) => {
  const [routeAnalysis, setRouteAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeLocation = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await deepSeekService.analyzeGeoContext({
        location: [asset.currentLocation.latitude, asset.currentLocation.longitude],
        radius: 1000,
        analysisType: 'risk'
      });
      setRouteAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze location:', error);
      Sentry.captureException(error, {
        tags: { component: 'asset-tracking', operation: 'location-analysis' }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-bcv-dark mb-2">{asset.name}</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Tipo: {asset.type}</div>
          <div>Estado: {asset.status}</div>
          {asset.assignedTo && <div>Asignado a: {asset.assignedTo}</div>}
        </div>
      </div>

      <div>
        <h5 className="font-medium text-bcv-dark mb-2">Ubicación Actual</h5>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Lat: {asset.currentLocation.latitude.toFixed(6)}</div>
          <div>Lng: {asset.currentLocation.longitude.toFixed(6)}</div>
          <div>Precisión: {asset.currentLocation.accuracy.toFixed(1)}m</div>
          {asset.currentLocation.speed && (
            <div>Velocidad: {(asset.currentLocation.speed * 3.6).toFixed(1)} km/h</div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h5 className="font-medium text-bcv-dark">Análisis de Ubicación</h5>
          <Button 
            size="sm" 
            onClick={analyzeLocation} 
            isLoading={isAnalyzing}
            disabled={isAnalyzing}
          >
            Analizar
          </Button>
        </div>
        
        {routeAnalysis && (
          <div className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>Nivel de Riesgo:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                routeAnalysis.securityLevel === 'low' ? 'bg-green-100 text-green-800' :
                routeAnalysis.securityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                routeAnalysis.securityLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {routeAnalysis.securityLevel}
              </span>
            </div>
            <div>Puntuación: {routeAnalysis.riskScore}/100</div>
            {routeAnalysis.recommendations.length > 0 && (
              <div>
                <div className="font-medium">Recomendaciones:</div>
                <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                  {routeAnalysis.recommendations.slice(0, 2).map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h5 className="font-medium text-bcv-dark mb-2">Geocercas Activas</h5>
        <div className="space-y-1">
          {asset.geofences.filter(g => g.isActive).map(geofence => (
            <div key={geofence.id} className="text-sm p-2 bg-gray-50 rounded">
              <div className="font-medium">{geofence.name}</div>
              <div className="text-xs text-gray-600">
                Radio: {geofence.radius}m | Tipo: {geofence.type}
              </div>
            </div>
          ))}
          {asset.geofences.filter(g => g.isActive).length === 0 && (
            <div className="text-sm text-gray-500">No hay geocercas activas</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AssetTrackingDashboard: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.4806, -66.9036]); // Caracas
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const websocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    initializeWebSocket();
    loadRealAssets(); // Load real asset data
    
    return () => {
      websocketRef.current?.disconnect();
    };
  }, []);

  const initializeWebSocket = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    const ws = io(wsUrl, {
      transports: ['websocket'],
      timeout: 5000
    });
    
    ws.on('connect', () => {
      console.log('Asset tracking WebSocket connected');
      ws.emit('join_asset_tracking', { room: 'bcv_assets' });
    });

    ws.on('location_update', (message: WebSocketMessage) => {
      if (message.type === 'location_update') {
        updateAssetLocation(message.payload as LocationUpdate);
      }
    });

    ws.on('geofence_alert', (message: WebSocketMessage) => {
      if (message.type === 'geofence_alert') {
        handleGeofenceAlert(message.payload as GeofenceAlert);
      }
    });

    ws.on('disconnect', (reason) => {
      console.warn('Asset tracking WebSocket disconnected:', reason);
      Sentry.addBreadcrumb({
        category: 'websocket',
        message: `Asset tracking WebSocket disconnected: ${reason}`,
        level: 'warning'
      });
    });

    ws.on('connect_error', (error) => {
      console.error('Asset tracking WebSocket error:', error);
      Sentry.captureException(error, {
        tags: { component: 'asset-tracking-websocket' }
      });
    });
    
    websocketRef.current = ws;
  };

  const loadRealAssets = async () => {
    try {
      // Load real asset data from tracking service
      const realAssets = await realTrackingService.getAssets();
      
      if (realAssets.length > 0) {
        setAssets(realAssets);
        setSelectedAsset(realAssets[0]);
        
        // Set map center to first asset location if available
        if (realAssets[0].currentLocation) {
          setMapCenter([
            realAssets[0].currentLocation.latitude,
            realAssets[0].currentLocation.longitude
          ]);
        }
      } else {
        // Fallback to demo data if no real assets available
        console.warn('No real assets found, using demo data');
        loadDemoAssets();
      }
    } catch (error) {
      console.error('Failed to load real assets:', error);
      // Fallback to demo data on error
      loadDemoAssets();
    }
  };

  const loadDemoAssets = () => {
    // Demo data as fallback
    const demoAssets: Asset[] = [
      {
        id: 'demo-vehicle-001',
        type: 'vehicle',
        name: 'Vehículo BCV-001 (Demo)',
        description: 'Camioneta de valores - Datos de demostración',
        currentLocation: {
          latitude: 10.4806,
          longitude: -66.9036,
          accuracy: 3.2,
          timestamp: new Date(),
          speed: 0
        },
        lastUpdate: new Date(),
        status: 'active',
        geofences: [],
        batteryLevel: 85,
        assignedTo: 'Juan Pérez'
      },
      {
        id: 'demo-personnel-001',
        type: 'personnel',
        name: 'Personal BCV-001 (Demo)',
        description: 'Supervisor de seguridad - Datos de demostración',
        currentLocation: {
          latitude: 10.4756,
          longitude: -66.9086,
          accuracy: 2.8,
          timestamp: new Date(),
          speed: 0
        },
        lastUpdate: new Date(),
        status: 'active',
        geofences: [],
        batteryLevel: 72,
        assignedTo: 'María González'
      },
      {
        id: 'demo-equipment-001',
        type: 'equipment',
        name: 'ATM Móvil BCV-15 (Demo)',
        description: 'Cajero automático portátil - Datos de demostración',
        currentLocation: {
          latitude: 10.4756,
          longitude: -66.9086,
          accuracy: 2.8,
          timestamp: new Date()
        },
        lastUpdate: new Date(),
        status: 'maintenance',
        geofences: [],
        assignedTo: 'Técnico de Mantenimiento'
      }
    ];
    
    setAssets(demoAssets);
    setSelectedAsset(demoAssets[0]);
  };

  const updateAssetLocation = (locationUpdate: LocationUpdate) => {
    setAssets(prev => prev.map(asset => 
      asset.id === locationUpdate.assetId 
        ? { 
            ...asset, 
            currentLocation: locationUpdate.coordinate, 
            lastUpdate: new Date(),
            batteryLevel: locationUpdate.batteryLevel || asset.batteryLevel
          }
        : asset
    ));

    // Update selected asset if it matches
    if (selectedAsset?.id === locationUpdate.assetId) {
      setSelectedAsset(prev => prev ? {
        ...prev,
        currentLocation: locationUpdate.coordinate,
        lastUpdate: new Date(),
        batteryLevel: locationUpdate.batteryLevel || prev.batteryLevel
      } : null);
    }
  };

  const handleGeofenceAlert = (alert: GeofenceAlert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    
    // Show notification or handle alert
    console.log('Geofence alert:', alert);
    
    Sentry.addBreadcrumb({
      category: 'geofence',
      message: `Geofence ${alert.type} alert for asset ${alert.assetId}`,
      level: alert.severity === 'critical' ? 'error' : 'warning',
      data: alert
    });
  };

  const startTracking = async () => {
    if (!selectedAsset) return;
    
    try {
      await locationService.startTracking(selectedAsset.id, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      setIsTracking(true);
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Sentry.captureException(error, {
        tags: { component: 'asset-tracking', operation: 'start-tracking' }
      });
    }
  };

  const stopTracking = async () => {
    try {
      await locationService.stopTracking();
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
      {/* Asset List */}
      <Card title="Assets en Tiempo Real" className="lg:col-span-1">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={startTracking} 
              disabled={isTracking || !selectedAsset}
              className="flex-1"
            >
              {isTracking ? 'Rastreando...' : 'Iniciar Rastreo'}
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={stopTracking} 
              disabled={!isTracking}
              className="flex-1"
            >
              Detener
            </Button>
          </div>
          
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

          {alerts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-bcv-dark mb-2">Alertas Recientes</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">
                      {alert.type === 'entry' ? 'Entrada' : 'Salida'} de geocerca
                    </div>
                    <div className="text-red-600">Asset: {alert.assetId}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Map View */}
      <Card title="Mapa de Ubicaciones" className="lg:col-span-2">
        <div className="h-96 w-full">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            className="h-full w-full rounded-lg"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {assets.map(asset => (
              <Marker 
                key={asset.id}
                position={[asset.currentLocation.latitude, asset.currentLocation.longitude]}
                icon={createAssetIcon(asset.type, asset.status)}
                eventHandlers={{
                  click: () => setSelectedAsset(asset)
                }}
              >
                <Popup>
                  <div className="p-2">
                    <div className="font-semibold">{asset.name}</div>
                    <div className="text-sm text-gray-600">
                      <div>Tipo: {asset.type}</div>
                      <div>Estado: {asset.status}</div>
                      <div>Precisión: {asset.currentLocation.accuracy.toFixed(1)}m</div>
                      {asset.assignedTo && <div>Asignado: {asset.assignedTo}</div>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render geofences for selected asset */}
            {selectedAsset?.geofences.filter(g => g.isActive).map(geofence => (
              <Circle
                key={geofence.id}
                center={geofence.center}
                radius={geofence.radius}
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  weight: 2
                }}
              />
            ))}
          </MapContainer>
        </div>
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

export default AssetTrackingDashboard;