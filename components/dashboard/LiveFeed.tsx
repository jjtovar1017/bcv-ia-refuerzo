
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

const LiveFeed: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-48">
            <span className="text-bcv-gray-400 text-center">El monitoreo de Telegram está temporalmente deshabilitado por mantenimiento.</span>
        </div>
    );
};

const LiveFeed: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-48">
            <span className="text-bcv-gray-400 text-center">El monitoreo de Telegram está temporalmente deshabilitado por mantenimiento.</span>
        </div>
    );
};

export default LiveFeed;