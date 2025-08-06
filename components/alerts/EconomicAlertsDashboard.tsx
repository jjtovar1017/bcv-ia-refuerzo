import React, { useState, useEffect } from 'react';
import { economicAlertsService, EconomicAlert, AlertsFilter } from '../../services/economicAlertsService';
import { getEconomicNewsFallback, EconomicNewsFallback } from '../../services/economicNewsFallbackService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  GlobeAltIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ExternalLinkIcon,
  BellIcon,
  ShieldCheckIcon
} from '../icons/Icons';

interface EconomicAlertsDashboardProps {
  className?: string;
}

const EconomicAlertsDashboard: React.FC<EconomicAlertsDashboardProps> = ({ className }) => {
  const [alerts, setAlerts] = useState<EconomicAlert[]>([]);
  const [fallbackNews, setFallbackNews] = useState<EconomicNewsFallback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<EconomicAlert | null>(null);
  const [filter, setFilter] = useState<AlertsFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  // Si no hay alertas del backend, buscar noticias económicas
  useEffect(() => {
    if (!alerts.length && !isLoading) {
      getEconomicNewsFallback().then(setFallbackNews);
    } else {
      setFallbackNews([]);
    }
  }, [alerts, isLoading]);

  const loadAlerts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const alertsData = await economicAlertsService.getEconomicAlerts(50, filter);
      setAlerts(alertsData);
    } catch (err) {
      setError('Error al cargar las alertas económicas');
      console.error('Error loading economic alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'high': return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      case 'medium': return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'low': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      default: return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'international': return <GlobeAltIcon className="w-4 h-4" />;
      case 'national': return <ShieldCheckIcon className="w-4 h-4" />;
      case 'bcv_image': return <ChartBarIcon className="w-4 h-4" />;
      case 'trade_relations': return <ExternalLinkIcon className="w-4 h-4" />;
      default: return <BellIcon className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'international': return 'Internacional';
      case 'national': return 'Nacional';
      case 'bcv_image': return 'Imagen BCV';
      case 'trade_relations': return 'Comercio';
      default: return 'General';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'very_negative': return 'text-red-700 bg-red-100';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      case 'positive': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const AlertCard: React.FC<{ alert: EconomicAlert }> = ({ alert }) => (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${getSeverityColor(alert.severity)}`}
      onClick={() => setSelectedAlert(alert)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getSeverityIcon(alert.severity)}
          <span className="text-xs font-medium uppercase tracking-wide">
            {alert.severity}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            {getCategoryIcon(alert.category)}
            <span>{getCategoryLabel(alert.category)}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(alert.sentiment)}`}>
            {alert.sentiment}
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {alert.title}
      </h3>

      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {alert.summary}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{alert.source}</span>
        <span>{formatTimeAgo(alert.publishedAt)}</span>
      </div>

      {/* Métricas de impacto */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500">Impacto VE</div>
          <div className="font-semibold text-sm">{alert.impactAnalysis.venezuelaImpact}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Imagen BCV</div>
          <div className="font-semibold text-sm">{alert.impactAnalysis.bcvImageImpact}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Urgencia</div>
          <div className="font-semibold text-sm">{alert.impactAnalysis.urgencyLevel}%</div>
        </div>
      </div>

      {/* Sectores afectados */}
      {alert.impactAnalysis.affectedSectors.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {alert.impactAnalysis.affectedSectors.slice(0, 3).map((sector, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {sector}
            </span>
          ))}
          {alert.impactAnalysis.affectedSectors.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{alert.impactAnalysis.affectedSectors.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Prioridad: {alert.recommendations.priority}/5
        </div>
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            window.open(alert.url, '_blank');
          }}
        >
          <ExternalLinkIcon className="w-3 h-3 mr-1" />
          Ver fuente
        </Button>
      </div>
    </div>
  );

  const AlertDetail: React.FC<{ alert: EconomicAlert }> = ({ alert }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getSeverityIcon(alert.severity)}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{alert.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>{alert.source}</span>
                  <span>{formatTimeAgo(alert.publishedAt)}</span>
                  <span className={`px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setSelectedAlert(null)}
            >
              ✕
            </Button>
          </div>

          {/* Resumen */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Resumen</h3>
            <p className="text-gray-700">{alert.summary}</p>
          </div>

          {/* Análisis de Impacto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card title="Impacto en Venezuela" className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {alert.impactAnalysis.venezuelaImpact}%
              </div>
              <div className="text-sm text-gray-600">
                Nivel de impacto en la economía nacional
              </div>
            </Card>
            <Card title="Impacto Imagen BCV" className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {alert.impactAnalysis.bcvImageImpact}%
              </div>
              <div className="text-sm text-gray-600">
                Afectación a la imagen institucional
              </div>
            </Card>
            <Card title="Nivel de Urgencia" className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {alert.impactAnalysis.urgencyLevel}%
              </div>
              <div className="text-sm text-gray-600">
                Requiere respuesta inmediata
              </div>
            </Card>
          </div>

          {/* Factores Clave y Sectores Afectados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Factores Clave</h3>
              <div className="space-y-2">
                {alert.impactAnalysis.keyFactors.map((factor, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Sectores Afectados</h3>
              <div className="flex flex-wrap gap-2">
                {alert.impactAnalysis.affectedSectors.map((sector, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recomendaciones Estratégicas */}
          <Card title="Recomendaciones Estratégicas" className="mb-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Estrategia de Respuesta</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded">{alert.recommendations.responseStrategy}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Mensajes Clave</h4>
                <ul className="space-y-1">
                  {alert.recommendations.keyMessages.map((message, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{message}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Audiencia Objetivo</h4>
                  <div className="flex flex-wrap gap-1">
                    {alert.recommendations.targetAudience.map((audience, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cronograma</h4>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    {alert.recommendations.timeline}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Países Relacionados e Indicadores */}
          {(alert.relatedCountries.length > 0 || alert.economicIndicators.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {alert.relatedCountries.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Países Relacionados</h3>
                  <div className="flex flex-wrap gap-2">
                    {alert.relatedCountries.map((country, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {alert.economicIndicators.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Indicadores Económicos</h3>
                  <div className="flex flex-wrap gap-2">
                    {alert.economicIndicators.map((indicator, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => window.open(alert.url, '_blank')}
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Ver Fuente Original
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Aquí se podría integrar con el generador de contenido
                console.log('Generar respuesta para:', alert.title);
              }}
            >
              Generar Respuesta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const FilterPanel: React.FC = () => (
    <Card title="Filtros de Alertas" className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Severidad</label>
          <select 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            onChange={(e) => setFilter(prev => ({ 
              ...prev, 
              severity: e.target.value ? [e.target.value] : undefined 
            }))}
          >
            <option value="">Todas</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
          <select 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            onChange={(e) => setFilter(prev => ({ 
              ...prev, 
              category: e.target.value ? [e.target.value] : undefined 
            }))}
          >
            <option value="">Todas</option>
            <option value="international">Internacional</option>
            <option value="national">Nacional</option>
            <option value="bcv_image">Imagen BCV</option>
            <option value="trade_relations">Comercio</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sentimiento</label>
          <select 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            onChange={(e) => setFilter(prev => ({ 
              ...prev, 
              sentiment: e.target.value ? [e.target.value] : undefined 
            }))}
          >
            <option value="">Todos</option>
            <option value="very_negative">Muy Negativo</option>
            <option value="negative">Negativo</option>
            <option value="neutral">Neutral</option>
            <option value="positive">Positivo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Impacto Mínimo</label>
          <select 
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            onChange={(e) => setFilter(prev => ({ 
              ...prev, 
              minImpact: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
          >
            <option value="">Cualquiera</option>
            <option value="50">50% o más</option>
            <option value="70">70% o más</option>
            <option value="90">90% o más</option>
          </select>
        </div>
      </div>
    </Card>
  );

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas Económicas</h1>
            <p className="text-gray-600">Monitoreo de noticias que afectan la economía venezolana y la imagen del BCV</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="primary"
            onClick={loadAlerts}
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && <FilterPanel />}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card title="Total Alertas" className="text-center">
          <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
        </Card>
        <Card title="Críticas" className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {alerts.filter(a => a.severity === 'critical').length}
          </div>
        </Card>
        <Card title="Alta Prioridad" className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {alerts.filter(a => a.recommendations.priority >= 4).length}
          </div>
        </Card>
        <Card title="Imagen BCV" className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {alerts.filter(a => a.impactAnalysis.bcvImageImpact >= 50).length}
          </div>
        </Card>
      </div>

      {/* Lista de alertas */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bcv-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando alertas económicas...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAlerts}>Reintentar</Button>
        </div>
      ) : alerts.length === 0 ? (
        fallbackNews.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fallbackNews.map((news, i) => (
              <div key={i} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <GlobeAltIcon className="w-5 h-5 text-yellow-600" />
                  <span className="text-xs font-semibold bg-yellow-200 text-yellow-800 rounded px-2 py-0.5">Fuente externa</span>
                  <span className="text-xs text-bcv-blue">{news.source}</span>
                </div>
                <a href={news.link} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline block mb-1">{news.title}</a>
                {news.summary && <div className="text-xs text-bcv-gray-700 line-clamp-2 mb-1">{news.summary}</div>}
                {news.date && <div className="text-xs text-bcv-gray-400">{news.date.slice(0, 16)}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay alertas económicas disponibles</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {selectedAlert && <AlertDetail alert={selectedAlert} />}
    </div>
  );
};

export default EconomicAlertsDashboard;
