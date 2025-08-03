
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants';

const Sidebar: React.FC = () => {
    return (
        <div className="w-64 bg-bcv-dark text-white flex flex-col">
            <div className="h-16 flex items-center justify-center p-4 border-b border-bcv-blue">
                <h1 className="text-xl font-bold text-bcv-gold">BCV Asistente</h1>
            </div>
            <nav className="flex-1 px-2 py-4">
                {NAVIGATION_ITEMS.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2.5 my-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                                isActive
                                    ? 'bg-bcv-blue text-white'
                                    : 'text-bcv-gray-300 hover:bg-bcv-gray-700 hover:text-white'
                            }`
                        }
                    >
                        {item.icon('w-6 h-6 mr-3')}
                        {item.name}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-bcv-blue">
                <p className="text-xs text-bcv-gray-400">© 2024 Banco Central de Venezuela</p>
            </div>
        </div>
    );
};

export default Sidebar;
