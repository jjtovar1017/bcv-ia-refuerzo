
import React from 'react';
import { Link } from 'react-router-dom';
import { TelegramMessage } from '../../types';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { BellIcon } from '../icons/Icons';

interface LiveFeedProps {
    messages: TelegramMessage[];
    isLoading: boolean;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ messages, isLoading }) => {
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-bcv-dark flex items-center">
                    <BellIcon className="w-6 h-6 mr-2 text-bcv-blue"/>
                    Feed de Monitoreo
                </h3>
                <Link to="/monitoreo" className="text-sm font-medium text-bcv-blue hover:underline">
                    Ver todo
                </Link>
            </div>
           
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-48">
                    <Spinner size={8} />
                    <p className="mt-4 text-bcv-gray-600">Generando feed simulado...</p>
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-10 text-bcv-gray-500">
                    <p>No se pudo generar el feed de monitoreo.</p>
                    <p className="text-xs">Intente refrescar la página.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {messages.map((msg) => (
                        <li key={msg.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-bcv-blue bg-bcv-blue bg-opacity-10 rounded-full">
                                    {msg.channel}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-bcv-gray-800">{msg.text}</p>
                                <p className="text-xs text-bcv-gray-500 mt-1">{msg.timestamp}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
};

export default LiveFeed;