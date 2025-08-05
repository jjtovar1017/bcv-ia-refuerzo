import React from 'react';
import { useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants';

const MinimalHeader: React.FC = () => {
    const location = useLocation();
    const currentNavItem = NAVIGATION_ITEMS.find(item => item.path === location.pathname);
    const title = currentNavItem ? currentNavItem.name : 'Asistente de Medios BCV';

    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-bcv-gray-200 sticky top-0 z-20">
            <div className="flex items-center justify-between px-4 py-3 md:px-8">
                {/* Title with Icon */}
                <div className="flex items-center space-x-3">
                    {currentNavItem && (
                        <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg bg-bcv-blue/10">
                            {currentNavItem.icon('w-6 h-6 text-bcv-blue')}
                        </div>
                    )}
                    <div>
                        <h1 className="text-lg font-semibold text-bcv-dark md:text-xl">
                            {title}
                        </h1>
                        <p className="text-xs text-bcv-gray-600 hidden md:block">
                            Banco Central de Venezuela
                        </p>
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center space-x-4">
                    {/* Status Indicator */}
                    <div className="hidden md:flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-bcv-gray-600">En línea</span>
                    </div>

                    {/* Time Display */}
                    <div className="text-sm text-bcv-gray-600 hidden lg:block">
                        {new Date().toLocaleString('es-VE', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default MinimalHeader;
