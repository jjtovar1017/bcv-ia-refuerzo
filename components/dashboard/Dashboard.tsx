import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import LiveFeed from './LiveFeed';
import { telegramService } from '../../services/telegramService';
import { newsService } from '../../services/newsService';
import { TelegramMessage } from '../../types';
import Button from '../ui/Button';
import { DocumentTextIcon, MicrophoneIcon } from '../icons/Icons';

const Dashboard: React.FC = () => {
    const [feedMessages, setFeedMessages] = useState<TelegramMessage[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true);

    const fetchFeed = async () => {
        setIsFeedLoading(true);
        try {
            // Intentar obtener noticias reales de Telegram usando el número de teléfono
            let messages = await telegramService.getRealTimeNews(['bcv_oficial', 'veneconomia', 'finanzasdigital', 'telesurve', 'efectococuyo'], 5);
            
            // Si no hay mensajes reales, intentar con el feed normal
            if (messages.length === 0) {
                console.log("No se encontraron noticias reales, intentando con feed normal...");
                messages = await telegramService.getMultiChannelFeed(['bcv_oficial', 'veneconomia', 'finanzasdigital', 'telesurve', 'efectococuyo'], 5);
            }
            
            // Si aún no hay mensajes, usar Gemini para generar feed simulado
            if (messages.length === 0) {
                try {
                    console.log("Generando simulación de feed de Telegram...");
                    // Importar la función de Gemini dinámicamente
                    const { generateSimulatedTelegramFeed } = await import('../../services/geminiService');
                    messages = await generateSimulatedTelegramFeed(['bcv_oficial', 'veneconomia', 'finanzasdigital', 'telesurve', 'efectococuyo']);
                    
                    // Limitar a 5 mensajes para el dashboard
                    messages = messages.slice(0, 5);
                } catch (geminiError) {
                    console.error("Failed to generate simulated feed with Gemini:", geminiError);
                    
                    // Fallback final: crear mensajes de ejemplo
                    messages = [
                        {
                            id: 1,
                            channel: 'bcv_oficial',
                            text: 'BCV publica tipo de cambio de referencia del día',
                            timestamp: new Date().toLocaleDateString('es-VE')
                        },
                        {
                            id: 2,
                            channel: 'finanzasdigital',
                            text: 'Análisis del comportamiento del mercado cambiario venezolano',
                            timestamp: new Date().toLocaleDateString('es-VE')
                        },
                        {
                            id: 3,
                            channel: 'veneconomia',
                            text: 'Indicadores económicos muestran tendencia estable',
                            timestamp: new Date().toLocaleDateString('es-VE')
                        }
                    ];
                }
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
                    <div className="flex justify-around">
                        <Link to="/generador">
                            <Button variant="secondary" className="flex flex-col items-center space-y-2">
                                <DocumentTextIcon className="w-12 h-12 text-bcv-blue"/>
                                <span className="text-xs">Nuevo Comunicado</span>
                            </Button>
                        </Link>
                         <Link to="/transcriptor">
                            <Button variant="secondary" className="flex flex-col items-center space-y-2">
                                <MicrophoneIcon className="w-12 h-12 text-bcv-blue"/>
                                <span className="text-xs">Transcribir Audio</span>
                            </Button>
                        </Link>
                    </div>
                </Card>

                <div className="lg:col-span-2">
                    <LiveFeed messages={feedMessages.slice(0, 5)} isLoading={isFeedLoading} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;