import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants';

const FloatingNavigation: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();

    return (
        <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-30 hidden md:block">
            {/* Main Navigation Container */}
            <div
                className={`bg-bcv-dark/90 backdrop-blur-lg rounded-2xl shadow-2xl transition-all duration-500 ease-in-out ${
                    isExpanded ? 'p-4 w-64' : 'p-3 w-16'
                }`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                {/* BCV Logo/Brand */}
                <div className="flex items-center justify-center mb-4">
                    <div className={`text-bcv-gold font-bold transition-all duration-300 ${
                        isExpanded ? 'text-lg' : 'text-sm'
                    }`}>
                        {isExpanded ? 'BCV Asistente' : 'BCV'}
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-2">
                    {NAVIGATION_ITEMS.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={`group relative flex items-center rounded-xl transition-all duration-300 ${
                                    isActive
                                        ? 'bg-bcv-blue text-white shadow-lg'
                                        : 'text-bcv-gray-300 hover:bg-bcv-gray-700 hover:text-white'
                                } ${isExpanded ? 'p-3' : 'p-2 justify-center'}`}
                                style={{
                                    animationDelay: `${index * 50}ms`
                                }}
                            >
                                {/* Icon */}
                                <div className={`flex-shrink-0 transition-all duration-300 ${
                                    isExpanded ? 'mr-3' : ''
                                }`}>
                                    {item.icon(`w-6 h-6 ${isActive ? 'text-white' : ''}`)}
                                </div>

                                {/* Label */}
                                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                                }`}>
                                    {item.name}
                                </span>

                                {/* Active Indicator */}
                                {isActive && (
                                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-bcv-gold rounded-full" />
                                )}

                                {/* Tooltip for collapsed state */}
                                {!isExpanded && (
                                    <div className="absolute left-full ml-4 px-3 py-2 bg-bcv-dark text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                        {item.name}
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-bcv-dark rotate-45" />
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Expansion Indicator */}
                <div className="flex justify-center mt-4">
                    <div className={`w-2 h-2 rounded-full bg-bcv-gold transition-all duration-300 ${
                        isExpanded ? 'scale-150' : 'scale-100'
                    }`} />
                </div>
            </div>

            {/* Floating Action Button Style Alternative (commented for now) */}
            {/* 
            <div className="mt-4">
                <button className="w-12 h-12 bg-bcv-blue rounded-full shadow-lg flex items-center justify-center text-white hover:bg-bcv-gold transition-colors duration-300">
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
            */}
        </div>
    );
};

export default FloatingNavigation;
