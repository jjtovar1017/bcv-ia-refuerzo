import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
// import LiveFeed from './LiveFeed';
import YouTubeSection from './YouTubeSection';
import NewsVenezuelaSection from './NewsVenezuelaSection';
// import { telegramService } from '../../services/telegramService';
import { newsService } from '../../services/newsService';
// import { TelegramMessage } from '../../types';
import Button from '../ui/Button';
import { DocumentTextIcon, MicrophoneIcon, ChartBarIcon, ExclamationTriangleIcon } from '../icons/Icons';

const Dashboard: React.FC = () => {
    // const [feedMessages, setFeedMessages] = useState<TelegramMessage[]>([]);
    // const [isFeedLoading, setIsFeedLoading] = useState(true);

    // const fetchFeed = async () => { /* lógica de Telegram oculta */ };

    // useEffect(() => {
//     fetchFeed();
//     const interval = setInterval(() => {
//         fetchFeed();
//     }, 5 * 60 * 1000);
//     return () => clearInterval(interval);
// }, []);

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

                {/* <div className="lg:col-span-2">
                    <LiveFeed messages={feedMessages.slice(0, 5)} isLoading={isFeedLoading} />
                </div> */}
                <div className="lg:col-span-2 flex items-center justify-center h-48">
                    <span className="text-bcv-gray-400 text-center">El monitoreo de Telegram está temporalmente deshabilitado por mantenimiento.</span>
                </div>
            </div>
            
            {/* Noticias Venezuela - Medios Oficiales y Alternativos */}
            <NewsVenezuelaSection />

            {/* Sección de YouTube sin videos */}
            <div className="mt-8">
                <YouTubeSection showVideos={false} />
            </div>
        </div>
    );
};

export default Dashboard;