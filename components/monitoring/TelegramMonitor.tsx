
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Card from '../ui/Card';
import { TelegramMessage, EconomicNewsResult, NewsSearchType } from '../../types';
import Button from '../ui/Button';
import { TrashIcon, NewspaperIcon, DocumentDuplicateIcon, ShieldExclamationIcon } from '../icons/Icons';
import { fetchEconomicNews, generateSimulatedTelegramFeed } from '../../services/geminiService';
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
    const [currentSearchType, setCurrentSearchType] = useState<NewsSearchType | null>(null);

    const fetchFeed = useCallback(async () => {
        setIsFeedLoading(true);
        setFeedError('');
        try {
            const generatedMessages = await generateSimulatedTelegramFeed(channels);
            setMessages(generatedMessages);
        } catch (e: any) {
            setFeedError(e.message || 'Ocurrió un error al generar el feed.');
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
            const result = await fetchEconomicNews(searchType);
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
    
    const renderNewsView = () => {
        const newsTitle = 
            currentSearchType === 'economic' ? 'Noticias Económicas de Actualidad'
            : currentSearchType === 'mixed' ? 'Noticias Relevantes de Actualidad'
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
                    Feed Simulado ({filteredMessages.length} de {messages.length} mensajes)
                </h3>
                <Button variant="secondary" onClick={fetchFeed} isLoading={isFeedLoading}>
                    Refrescar Feed
                </Button>
            </div>
            <div className="space-y-4">
                {isFeedLoading && (
                     <div className="flex flex-col items-center justify-center h-96 text-bcv-gray-600">
                        <Spinner size={12} />
                        <p className="mt-4">Generando simulación de feed de Telegram...</p>
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
                            className="block p-4 border-l-4 border-bcv-blue bg-bcv-gray-100 rounded-r-lg"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="px-2 py-1 text-xs font-bold text-white bg-bcv-blue rounded-full">
                                    {msg.channel}
                                </span>
                                <span className="text-xs text-bcv-gray-500">{msg.timestamp}</span>
                            </div>
                            <p className="text-bcv-gray-800">{msg.text}</p>
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
                            onClick={() => handleFetchNews('economic')}
                            isLoading={isFetchingNews && currentSearchType === 'economic'}
                            disabled={isFetchingNews}
                            className="w-full justify-center"
                        >
                            <NewspaperIcon className="w-5 h-5 mr-2" />
                            Noticias Económicas
                        </Button>
                        <Button
                            onClick={() => handleFetchNews('mixed')}
                            isLoading={isFetchingNews && currentSearchType === 'mixed'}
                            disabled={isFetchingNews}
                            variant="secondary"
                            className="w-full justify-center"
                        >
                            <NewspaperIcon className="w-5 h-5 mr-2" />
                            Noticias Relevantes (Mixto)
                        </Button>
                        <Button
                            onClick={() => handleFetchNews('threat_alert')}
                            isLoading={isFetchingNews && currentSearchType === 'threat_alert'}
                            disabled={isFetchingNews}
                            variant="secondary"
                            className="w-full justify-center bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500 border border-red-200"
                        >
                            <ShieldExclamationIcon className="w-5 h-5 mr-2" />
                            Análisis de Riesgos
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
                {isFetchingNews || newsResult || newsError ? renderNewsView() : renderMonitorView()}
            </div>
        </div>
    );
};

export default TelegramMonitor;
