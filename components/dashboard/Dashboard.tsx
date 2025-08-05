import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import LiveFeed from './LiveFeed';
import YouTubeSection from './YouTubeSection';
import { telegramService } from '../../services/telegramService';
import { newsService } from '../../services/newsService';
import { TelegramMessage } from '../../types';
import Button from '../ui/Button';
import { DocumentTextIcon, MicrophoneIcon, ChartBarIcon, ExclamationTriangleIcon } from '../icons/Icons';

const Dashboard: React.FC = () => {
    const [feedMessages, setFeedMessages] = useState<TelegramMessage[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true);

    const fetchFeed = async () => {
        setIsFeedLoading(true);
        try {
            // Canales oficiales y medios económicos venezolanos
            const channels = [
                'BCVZLA',           // Canal oficial del BCV
                'veneconomia',      // VenEconomía
                'finanzasdigital',  // Finanzas Digital
                'telesurve',        // TeleSUR Venezuela
                'efectococuyo',     // Efecto Cocuyo
                'eluniversalweb',   // El Universal
                'elimpulso',        // El Impulso
                'bancaynegocios'    // Banca y Negocios
            ];
            
            // Intentar obtener noticias reales de Telegram
            let messages = await telegramService.getRealTimeNews(channels, 8);
            
            // Si no hay mensajes reales, intentar con el feed normal
            if (messages.length === 0) {
                console.log("No se encontraron noticias reales, intentando con feed normal...");
                messages = await telegramService.getMultiChannelFeed(channels, 8);
            }
            
            // Si aún no hay mensajes, mostrar un mensaje informativo
            if (messages.length === 0) {
                messages = [
                    {
                        id: 1,
                        channel: 'sistema',
                        text: 'No se encontraron mensajes en los canales monitoreados. Verifique la conexión con Telegram.',
                        link: 'https://t.me/BCVZLA',
                        timestamp: new Date().toLocaleDateString('es-VE')
                    }
                ];
            }
            setFeedMessages(messages);
        } catch (error) {
            console.error("Failed to fetch dashboard feed:", error);
            // En caso de error total, mostrar mensaje informativo
            setFeedMessages([{
                id: 1,
                channel: 'sistema',
                text: 'Servicio de monitoreo temporalmente no disponible. Configurando servicios...',
                timestamp: new Date().toLocaleDateString('es-VE')
            }]);
        } finally {
            setIsFeedLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(() => {
            fetchFeed();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card title="Acciones Rápidas" className="lg:col-span-1">
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/generador">
                            <Button variant="secondary" className="flex flex-col items-center space-y-1 w-full p-3">
                                <DocumentTextIcon className="w-6 h-6 text-bcv-blue"/>
                                <span className="text-xs font-medium">Nuevo Comunicado</span>
                            </Button>
                        </Link>
                        <Link to="/transcriptor">
                            <Button variant="secondary" className="flex flex-col items-center space-y-1 w-full p-3">
                                <MicrophoneIcon className="w-6 h-6 text-bcv-blue"/>
                                <span className="text-xs font-medium">Transcribir Audio</span>
                            </Button>
                        </Link>
                        <Link to="/alertas">
                            <Button variant="secondary" className="flex flex-col items-center space-y-1 w-full p-3">
                                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600"/>
                                <span className="text-xs font-medium">Alertas Económicas</span>
                            </Button>
                        </Link>
                        <Link to="/analisis">
                            <Button variant="secondary" className="flex flex-col items-center space-y-1 w-full p-3">
                                <ChartBarIcon className="w-6 h-6 text-bcv-blue"/>
                                <span className="text-xs font-medium">Análisis Institucional</span>
                            </Button>
                        </Link>
                    </div>
                </Card>

                <div className="lg:col-span-2">
                    <LiveFeed messages={feedMessages.slice(0, 5)} isLoading={isFeedLoading} />
                </div>
            </div>
            
            {/* Sección de YouTube sin videos */}
            <div className="mt-8">
                <YouTubeSection showVideos={false} />
            </div>
        </div>
    );
};

export default Dashboard;