import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants';

interface MobileNavigationProps {
    isOpen: boolean;
    onToggle: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onToggle }) => {
    return (
        <>
            {/* Hamburger Menu Button */}
            <button
                onClick={onToggle}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-bcv-dark text-white shadow-lg md:hidden transition-all duration-300 hover:bg-bcv-blue"
                aria-label="Toggle navigation menu"
            >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                    <span
                        className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
                            isOpen ? 'rotate-45 translate-y-1.5' : '-translate-y-1'
                        }`}
                    />
                    <span
                        className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
                            isOpen ? 'opacity-0' : 'opacity-100'
                        }`}
                    />
                    <span
                        className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
                            isOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-1'
                        }`}
                    />
                </div>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Mobile Menu */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-bcv-dark text-white z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-center p-4 border-b border-bcv-blue">
                    <h1 className="text-xl font-bold text-bcv-gold">BCV Asistente</h1>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-2 py-4">
                    {NAVIGATION_ITEMS.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            onClick={onToggle}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 my-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                    isActive
                                        ? 'bg-bcv-blue text-white shadow-lg'
                                        : 'text-bcv-gray-300 hover:bg-bcv-gray-700 hover:text-white'
                                }`
                            }
                        >
                            {item.icon('w-6 h-6 mr-4')}
                            <span className="text-base">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-bcv-blue">
                    <p className="text-xs text-bcv-gray-400 text-center">
                        © 2024 Banco Central de Venezuela
                    </p>
                </div>
            </div>
        </>
    );
};

export default MobileNavigation;
