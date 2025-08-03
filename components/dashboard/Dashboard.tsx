
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import MetricCard from './MetricCard';
import LiveFeed from './LiveFeed';
import { fetchEconomicNews } from '../../services/geminiService';
import { TelegramMessage, EconomicNewsResult } from '../../types';
import Button from '../ui/Button';
import { DocumentTextIcon, MicrophoneIcon, BellIcon } from '../icons/Icons';

const Dashboard: React.FC = () => {
    const [feedMessages, setFeedMessages] = useState<TelegramMessage[]>([]);
    const [isFeedLoading, setIsFeedLoading] = useState(true);
    const [newsSourcesCount, setNewsSourcesCount] = useState<number>(0);

    useEffect(() => {
        const fetchNewsFeed = async () => {
            setIsFeedLoading(true);
            try {
                const newsResult: EconomicNewsResult = await fetchEconomicNews('mixed');
                
                const transformedMessages: TelegramMessage[] = [];
                
                if (newsResult.summary) {
                    transformedMessages.push({
                        id: 1,
                        channel: 'Resumen de Noticias',
                        text: newsResult.summary,
                        timestamp: new Date().toLocaleDateString('es-VE', { hour: '2-digit', minute: '2-digit' })
                    });
                }
                
                newsResult.sources.forEach((source, index) => {
                    transformedMessages.push({
                        id: index + 2,
                        channel: source.title || 'Fuente Externa',
                        text: source.uri,
                        timestamp: 'Fuente'
                    });
                });

                setFeedMessages(transformedMessages);
                setNewsSourcesCount(newsResult.sources.length);

            } catch (error) {
                console.error("Failed to fetch news feed:", error);
                setFeedMessages([]);
                setNewsSourcesCount(0);
            } finally {
                setIsFeedLoading(false);
            }
        };

        fetchNewsFeed();
    }, []);

    return (
        <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                    title="Comunicados Generados"
                    value="142"
                    icon={<DocumentTextIcon className="w-8 h-8 text-bcv-blue" />}
                    change="+5.2%"
                    changeType="increase"
                />
                <MetricCard
                    title="Transcripciones Completadas"
                    value="89"
                    icon={<MicrophoneIcon className="w-8 h-8 text-bcv-blue" />}
                    change="+2"
                    changeType="increase"
                />
                <MetricCard
                    title="Noticias Analizadas (24h)"
                    value={isFeedLoading ? '...' : newsSourcesCount}
                    icon={<BellIcon className="w-8 h-8 text-bcv-blue" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <Card title="Acciones Rápidas" className="lg:col-span-1">
                    <div className="space-y-4">
                        <Link to="/generador">
                            <Button className="w-full justify-center">
                                <DocumentTextIcon className="w-5 h-5 mr-2"/>
                                Nuevo Comunicado
                            </Button>
                        </Link>
                         <Link to="/transcriptor">
                            <Button variant="secondary" className="w-full justify-center">
                                <MicrophoneIcon className="w-5 h-5 mr-2"/>
                                Transcribir Audio
                            </Button>
                        </Link>
                    </div>
                </Card>

                {/* Live Feed */}
                <div className="lg:col-span-2">
                    <LiveFeed messages={feedMessages.slice(0, 5)} isLoading={isFeedLoading} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;