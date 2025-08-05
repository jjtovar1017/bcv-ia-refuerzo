
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import { TelegramMessage, EconomicNewsResult, NewsSearchType } from '../../types';
import Button from '../ui/Button';
import { TrashIcon, NewspaperIcon, DocumentDuplicateIcon, ShieldExclamationIcon, ShieldCheckIcon } from '../icons/Icons';
import { telegramService } from '../../services/telegramService';
import { newsService } from '../../services/newsService';
import { geopoliticalAnalysisService, GeopoliticalAnalysisResult } from '../../services/geopoliticalAnalysisService';
import { institutionalAnalysisService, InstitutionalAnalysisResult } from '../../services/institutionalAnalysisService';
import Spinner from '../ui/Spinner';

const TelegramMonitor: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [messages, setMessages] = useState<TelegramMessage[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState('');
    
    const [channels, setChannels] = useState<string[]>(() => {
        try {
            const savedChannels = localStorage.getItem('bcv_telegram_channels');
            if (savedChannels) {
                return JSON.parse(savedChannels);
            }
        } catch (error) {
            console.error("Could not parse channels from localStorage", error);
        }
        return ['bcv_oficial', 'veneconomia', 'finanzasdigital', 'telesurve', 'efectococuyo', 'runrunes', 'bancaynegocios'];
    });

    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [newChannelUrl, setNewChannelUrl] = useState('');
    const [channelError, setChannelError] = useState('');

    const [isFetchingNews, setIsFetchingNews] = useState(false);
    const [newsResult, setNewsResult] = useState<EconomicNewsResult | null>(null);
    const [newsError, setNewsError] = useState('');
    const [copySuccess, setCopySuccess] = useState('');
    const [geopoliticalResult, setGeopoliticalResult] = useState<GeopoliticalAnalysisResult | null>(null);
    const [isGeopoliticalLoading, setIsGeopoliticalLoading] = useState(false);
    const [geopoliticalError, setGeopoliticalError] = useState('');
    const [institutionalResult, setInstitutionalResult] = useState<InstitutionalAnalysisResult | null>(null);
    const [isInstitutionalLoading, setIsInstitutionalLoading] = useState(false);
    const [institutionalError, setInstitutionalError] = useState('');
    const [currentSearchType, setCurrentSearchType] = useState<NewsSearchType | null>(null);

    const fetchFeed = useCallback(async () => {
        setIsFeedLoading(true);
        setFeedError('');
        try {
            const messages = await telegramService.getMultiChannelFeed(channels);
            setMessages(messages);
        } catch (e: any) {
            setFeedError(e.message || 'Ocurrió un error al obtener el feed.');
        } finally {
            setIsFeedLoading(false);
        }
    }, [channels]);
    
    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    useEffect(() => {
        localStorage.setItem('bcv_telegram_channels', JSON.stringify(channels));
    }, [channels]);
    
    const handleAddChannel = () => {
        setChannelError('');
        const trimmedUrl = newChannelUrl.trim();
        const match = trimmedUrl.match(/(?:t\.me\/|@)?([a-zA-Z0-9_]{5,})/);
        
        if (!match || !match[1]) {
            setChannelError('URL/Nombre inválido. Use t.me/canal o el nombre.');
            return;
        }
        const channelName = match[1];
        if (channels.includes(channelName)) {
            setChannelError('El canal ya existe en la lista.');
            return;
        }
        setChannels(prev => [...prev, channelName].sort());
        setNewChannelUrl('');
    };

    const handleRemoveChannel = (channelToRemove: string) => {
        setChannels(prev => prev.filter(c => c !== channelToRemove));
        setSelectedChannels(prev => prev.filter(c => c !== channelToRemove));
    };

    const handleChannelToggle = (channel: string) => {
        setSelectedChannels(prev =>
            prev.includes(channel)
                ? prev.filter(c => c !== channel)
                : [...prev, channel]
        );
    };
    
    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            const keywordMatch = keyword === '' || msg.text.toLowerCase().includes(keyword.toLowerCase());
            const channelMatch = selectedChannels.length === 0 || selectedChannels.includes(msg.channel);
            return keywordMatch && channelMatch;
        });
    }, [keyword, selectedChannels, messages]);
    
    const handleFetchNews = async (searchType: NewsSearchType) => {
        setIsFetchingNews(true);
        setNewsError('');
        setNewsResult(null);
        setCopySuccess('');
        setCurrentSearchType(searchType);
        try {
            const result = await newsService.getEconomicNews(searchType);
            setNewsResult(result);
        } catch (e: any) {
            setNewsError(e.message || 'Ocurrió un error desconocido.');
        } finally {
            setIsFetchingNews(false);
        }
    };

    const handleCopyNews = () => {
        if (!newsResult || !newsResult.summary) return;
        navigator.clipboard.writeText(newsResult.summary);
        setCopySuccess('¡Copiado!');
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const handleInstitutionalRiskAnalysis = async () => {
        setIsInstitutionalLoading(true);
        setInstitutionalError('');
        setInstitutionalResult(null);
        setCopySuccess('');

        try {
            // Obtener noticias recientes para análisis
            const recentMessages = messages.slice(0, 10).map(msg => 
                `${msg.channel}: ${msg.text}`
            );
            
            const result = await institutionalAnalysisService.generateReputationalRiskAnalysis(recentMessages);
            setInstitutionalResult(result);
        } catch (error) {
            console.error('Error in institutional analysis:', error);
            setInstitutionalError('Error al realizar el análisis institucional. Por favor, inténtelo de nuevo.');
        } finally {
            setIsInstitutionalLoading(false);
        }
    };
    
    const renderNewsView = () => {
        const newsTitle = 
            currentSearchType === 'economic_analysis' ? 'Noticias Económicas de Actualidad'
            : currentSearchType === 'custom' ? 'Noticias Relevantes de Actualidad'
            : currentSearchType === 'threat_alert' ? 'Análisis de Riesgos a la Reputación'
            : 'Resultados de Búsqueda';
        
        return (
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-bcv-dark flex items-center">
                        {newsTitle}
                        {newsResult && !isFetchingNews && (
                            <div className="flex items-center ml-4">
                                <span className="text-sm text-green-600 transition-opacity duration-300 mr-2">{copySuccess}</span>
                                <button onClick={handleCopyNews} title="Copiar resumen" className="p-1.5 text-bcv-gray-500 hover:text-bcv-blue hover:bg-bcv-gray-100 rounded-md">
                                    <DocumentDuplicateIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        )}
                    </h3>
                    <Button variant="secondary" onClick={() => { setNewsResult(null); setNewsError(''); setCurrentSearchType(null); }}>
                        &larr; Volver al Monitoreo
                    </Button>
                </div>

                {isFetchingNews && (
                    <div className="flex flex-col items-center justify-center h-64 text-bcv-gray-600">
                        <Spinner size={12} />
                        <p className="mt-4">Buscando noticias relevantes...</p>
                    </div>
                )}
                {newsError && <p className="text-red-600 bg-red-50 p-4 rounded-md">{newsError}</p>}
                {newsResult && !isFetchingNews && (
                    <div className="space-y-6">
                        <div className="prose prose-sm max-w-none text-bcv-gray-800 bg-bcv-gray-50 p-4 rounded-md">
                            <p className="whitespace-pre-wrap">{newsResult.summary || "No se pudo generar un resumen."}</p>
                        </div>
                        <div>
                            <h4 className="text-md font-semibold text-bcv-dark mb-2">Fuentes</h4>
                            <ul className="space-y-2 list-disc list-inside">
                                {newsResult.sources.map((source, index) => (
                                    <li key={index} className="text-sm">
                                        <a 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-bcv-blue hover:underline hover:text-bcv-dark transition-colors"
                                            title={source.uri}
                                        >
                                            {source.title || 'Fuente sin título'}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </Card>
        );
    }

    const renderMonitorView = () => (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-bcv-dark">
                    Feed de Monitoreo ({filteredMessages.length} de {messages.length} mensajes)
                </h3>
                <Button variant="secondary" onClick={fetchFeed} isLoading={isFeedLoading}>
                    Refrescar Feed
                </Button>
            </div>
            <div className="space-y-4">
                {isFeedLoading && (
                     <div className="flex flex-col items-center justify-center h-96 text-bcv-gray-600">
                        <Spinner size={12} />
                        <p className="mt-4">Cargando feed de Telegram...</p>
                    </div>
                )}
                {feedError && !isFeedLoading && (
                    <div className="text-center py-16 text-red-600 bg-red-50 rounded-lg">
                        <p className="font-semibold">Error al generar el feed</p>
                        <p className="text-sm mt-1">{feedError}</p>
                    </div>
                )}
                {!isFeedLoading && !feedError && filteredMessages.length > 0 && (
                    filteredMessages.map((msg: TelegramMessage) => (
                         <div
                            key={msg.id}
                            className="block p-4 border-l-4 border-bcv-blue bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="px-2 py-1 text-xs font-bold text-white bg-bcv-blue rounded-full">
                                    @{msg.channel}
                                </span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-bcv-gray-500">{msg.timestamp}</span>
                                    {msg.telegramUrl && (
                                        <button
                                            onClick={() => window.open(msg.telegramUrl, '_blank')}
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                            title="Ver mensaje en Telegram"
                                        >
                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16l-1.61 7.548c-.12.54-.44.67-.89.42l-2.46-1.81-1.19 1.14c-.13.13-.24.24-.49.24l.17-2.42 4.5-4.05c.2-.18-.04-.28-.3-.1l-5.59 3.51-2.4-.75c-.52-.16-.53-.52.11-.77l9.39-3.61c.43-.16.81.1.67.64z"/>
                                            </svg>
                                            Telegram
                                        </button>
                                    )}
                                    {msg.url && msg.url !== msg.telegramUrl && (
                                        <button
                                            onClick={() => window.open(msg.url, '_blank')}
                                            className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-green-50 transition-colors"
                                            title="Ver archivo o enlace original"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                            </svg>
                                            Archivo
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-bcv-gray-800 leading-relaxed">{msg.text}</p>
                            {(msg.telegramUrl || msg.url) && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Fuentes disponibles:</span>
                                        <div className="flex items-center space-x-1">
                                            {msg.telegramUrl && (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Telegram</span>
                                            )}
                                            {msg.url && msg.url !== msg.telegramUrl && (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">Archivo</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
                {!isFeedLoading && !feedError && filteredMessages.length === 0 && (
                     <div className="text-center py-16 text-bcv-gray-500">
                        <p>No se encontraron mensajes que coincidan con los filtros actuales.</p>
                        <p className="text-sm">Intente cambiar su palabra clave o la selección de canales.</p>
                    </div>
                )}
            </div>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card title="Acciones">
                    <div className="space-y-3">
                        <Button
                            onClick={() => handleFetchNews('economic_analysis')}
                            isLoading={isFetchingNews && currentSearchType === 'economic_analysis'}
                            disabled={isFetchingNews}
                            className="w-full justify-center"
                        >
                            <NewspaperIcon className="w-5 h-5 mr-2" />
                            Noticias Económicas
                        </Button>
                        <Button
                            onClick={() => handleFetchNews('custom')}
                            isLoading={isFetchingNews && currentSearchType === 'custom'}
                            disabled={isFetchingNews}
                            variant="secondary"
                            className="w-full justify-center"
                        >
                            <NewspaperIcon className="w-5 h-5 mr-2" />
                            Noticias Relevantes (Mixto)
                        </Button>
                        <Button
                            onClick={handleInstitutionalRiskAnalysis}
                            isLoading={isInstitutionalLoading}
                            disabled={isFetchingNews || isInstitutionalLoading}
                            variant="secondary"
                            className="w-full justify-center bg-bcv-blue-100 text-bcv-blue-800 hover:bg-bcv-blue-200 focus:ring-bcv-blue-500 border border-bcv-blue-200"
                        >
                            <ShieldCheckIcon className="w-5 h-5 mr-2" />
                            Análisis Institucional BCV
                        </Button>
                    </div>
                </Card>

                <Card title="Filtros de Monitoreo">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="keyword-search" className="block text-sm font-medium text-bcv-gray-700">
                                Palabra Clave
                            </label>
                            <input
                                type="text"
                                id="keyword-search"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Ej: inflación, dólar..."
                                className="mt-1 block w-full px-3 py-2 bg-white border border-bcv-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bcv-blue focus:border-bcv-blue sm:text-sm"
                            />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-bcv-gray-700">Canales a mostrar</h4>
                             <p className="text-xs text-bcv-gray-500 mb-2">Seleccione los canales para ver sus mensajes. Si no selecciona ninguno, se mostrarán todos.</p>
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2 border-t border-b border-bcv-gray-200 py-2">
                                {channels.map(channel => (
                                    <div key={channel} className="flex items-center">
                                        <input
                                            id={`channel-${channel}`}
                                            type="checkbox"
                                            checked={selectedChannels.includes(channel)}
                                            onChange={() => handleChannelToggle(channel)}
                                            className="h-4 w-4 rounded border-bcv-gray-300 text-bcv-blue focus:ring-bcv-blue"
                                        />
                                        <label htmlFor={`channel-${channel}`} className="ml-2 block text-sm text-bcv-gray-900 truncate">
                                            {channel}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Administrar Canales">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label htmlFor="new-channel-url" className="block text-sm font-medium text-bcv-gray-700">
                                Añadir canal por link o nombre
                            </label>
                            <input
                                type="text"
                                id="new-channel-url"
                                value={newChannelUrl}
                                onChange={(e) => setNewChannelUrl(e.target.value)}
                                placeholder="t.me/telesurve"
                                className="block w-full px-3 py-2 bg-white border border-bcv-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bcv-blue focus:border-bcv-blue sm:text-sm"
                            />
                            {channelError && <p className="text-xs text-red-500 mt-1">{channelError}</p>}
                            <Button onClick={handleAddChannel} variant="secondary" className="w-full text-sm">
                                Agregar Canal
                            </Button>
                        </div>
                        <div className="space-y-2 border-t border-bcv-gray-200 pt-3">
                            <h4 className="text-sm font-medium text-bcv-gray-700">Lista de canales</h4>
                             {channels.map(channel => (
                                <div key={channel} className="flex items-center justify-between bg-bcv-gray-100 p-2 rounded-md">
                                    <span className="text-sm text-bcv-gray-800 truncate">{channel}</span>
                                    <button onClick={() => handleRemoveChannel(channel)} className="text-bcv-gray-500 hover:text-red-600 p-1 rounded-full">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-3">
                {isInstitutionalLoading || institutionalResult || institutionalError ? (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-bcv-blue-50 to-bcv-gold-50 border border-bcv-blue-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-bcv-blue-800 flex items-center">
                                    <ShieldCheckIcon className="w-6 h-6 mr-2" />
                                    Análisis Institucional BCV
                                </h2>
                                <Button
                                    onClick={() => {
                                        setInstitutionalResult(null);
                                        setInstitutionalError('');
                                    }}
                                    variant="secondary"
                                >
                                    ← Volver al Monitoreo
                                </Button>
                            </div>

                            {isInstitutionalLoading && (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size={12} />
                                    <span className="ml-3 text-bcv-gray-600">Generando análisis institucional...</span>
                                </div>
                            )}

                            {institutionalError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <p className="text-red-800">{institutionalError}</p>
                                </div>
                            )}

                            {institutionalResult && !isInstitutionalLoading && (
                                <div className="space-y-6">
                                    <div className="bg-white border border-bcv-blue-200 rounded-lg p-6">
                                        <div className="flex items-center mb-4">
                                            <ShieldCheckIcon className="w-8 h-8 text-bcv-blue-600 mr-3" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-bcv-blue-800">Análisis Institucional BCV</h3>
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                                                    institutionalResult.overallRisk === 'critico' ? 'bg-red-100 text-red-800' :
                                                    institutionalResult.overallRisk === 'alto' ? 'bg-orange-100 text-orange-800' :
                                                    institutionalResult.overallRisk === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    Riesgo {institutionalResult.overallRisk.charAt(0).toUpperCase() + institutionalResult.overallRisk.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="prose prose-sm max-w-none text-bcv-gray-700">
                                            <div dangerouslySetInnerHTML={{ __html: institutionalResult.summary.replace(/\n/g, '<br/>') }} />
                                        </div>
                                    </div>

                                    {institutionalResult.alerts.length > 0 && (
                                        <div className="bg-white border border-bcv-gray-200 rounded-lg p-6">
                                            <h4 className="text-lg font-semibold text-bcv-blue-800 mb-4">Alertas Identificadas</h4>
                                            <div className="space-y-4">
                                                {institutionalResult.alerts.map((alert, index) => (
                                                    <div key={alert.id} className="border-l-4 border-bcv-blue-400 pl-4 py-2">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h5 className="font-medium text-bcv-gray-900">{alert.title}</h5>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                alert.severity === 'critica' ? 'bg-red-100 text-red-800' :
                                                                alert.severity === 'alta' ? 'bg-orange-100 text-orange-800' :
                                                                alert.severity === 'media' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-bcv-gray-600 mb-2">{alert.summary}</p>
                                                        <div className="text-sm text-bcv-gray-700">
                                                            <div dangerouslySetInnerHTML={{ __html: alert.analysis.replace(/\n/g, '<br/>') }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {institutionalResult.keyRecommendations.length > 0 && (
                                        <div className="bg-white border border-bcv-gray-200 rounded-lg p-6">
                                            <h4 className="text-lg font-semibold text-bcv-blue-800 mb-4">Recomendaciones Clave</h4>
                                            <ul className="list-disc list-inside space-y-2 text-bcv-gray-700">
                                                {institutionalResult.keyRecommendations.map((rec, index) => (
                                                    <li key={index} className="text-sm">{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3">
                                        <Button
                                            onClick={() => {
                                                const alertsText = institutionalResult.alerts.map(alert => 
                                                    `${alert.title}: ${alert.summary}\n${alert.analysis}`
                                                ).join('\n\n');
                                                const content = `${institutionalResult.summary}\n\n${alertsText}\n\nRecomendaciones:\n${institutionalResult.keyRecommendations.join('\n')}`;
                                                navigator.clipboard.writeText(content);
                                                setCopySuccess('¡Análisis copiado!');
                                                setTimeout(() => setCopySuccess(''), 2000);
                                            }}
                                            variant="secondary"
                                            className="flex items-center"
                                        >
                                            <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                            Copiar Análisis
                                        </Button>
                                        {copySuccess && (
                                            <span className="text-green-600 text-sm flex items-center">
                                                {copySuccess}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : isFetchingNews || newsResult || newsError ? renderNewsView() : renderMonitorView()}
            </div>
        </div>
    );
};

export default TelegramMonitor;
