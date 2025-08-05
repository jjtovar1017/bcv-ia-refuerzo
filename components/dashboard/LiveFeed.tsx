
import React from 'react';
import { Link } from 'react-router-dom';
import { TelegramMessage } from '../../types';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import { BellIcon } from '../icons/Icons';
// Icono personalizado para enlace externo
const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

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
                    <p className="mt-4 text-bcv-gray-600">Cargando noticias en tiempo real...</p>
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-10 text-bcv-gray-500">
                    <p>No hay noticias disponibles en este momento.</p>
                    <p className="text-xs">Los canales se están configurando o no hay mensajes recientes.</p>
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
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-bcv-gray-500">{msg.timestamp}</p>
                                    <div className="flex items-center gap-2">
                                        {msg.telegramUrl && (
                                            <button
                                                onClick={() => window.open(msg.telegramUrl, '_blank')}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-50"
                                                title="Ver mensaje en Telegram"
                                            >
                                                <ExternalLinkIcon className="w-3 h-3" />
                                                Telegram
                                            </button>
                                        )}
                                        {msg.url && msg.url !== msg.telegramUrl && (
                                            <button
                                                onClick={() => window.open(msg.url, '_blank')}
                                                className="text-xs text-bcv-blue hover:text-bcv-blue-dark flex items-center gap-1 px-2 py-1 rounded-md hover:bg-bcv-blue hover:bg-opacity-10"
                                                title="Ver archivo o fuente original"
                                            >
                                                <ExternalLinkIcon className="w-3 h-3" />
                                                Archivo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
};

export default LiveFeed;