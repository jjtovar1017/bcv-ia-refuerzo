import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
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
            const channelsForDashboard = ['bcv_oficial', 'veneconomia', 'finanzasdigital', 'telesurve', 'efectococuyo'];
            let messages = await telegramService.getMultiChannelFeed(channelsForDashboard, 3);
            if (messages.length === 0) {
                const newsResult = await newsService.getEconomicNews('economic_analysis' as any);
                messages = newsResult.sources.slice(0, 5).map((source, index) => ({
                    id: index + 1,
                    channel: 'noticias_bcv',
                    text: `${source.title} - ${(source as any).snippet || ''}`,
                    timestamp: (source as any).publishedDate || new Date().toLocaleDateString('es-VE')
                }));
            }
            setFeedMessages(messages);
        } catch (error) {
            console.error("Failed to fetch dashboard feed:", error);
            setFeedMessages([]);
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
                            <Button variant="ghost" className="flex flex-col items-center space-y-2">
                                <DocumentTextIcon className="w-12 h-12 text-bcv-blue"/>
                                <span className="text-xs">Nuevo Comunicado</span>
                            </Button>
                        </Link>
                         <Link to="/transcriptor">
                            <Button variant="ghost" className="flex flex-col items-center space-y-2">
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