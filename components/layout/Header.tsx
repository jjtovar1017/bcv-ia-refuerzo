
import React from 'react';
import { useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants';

const Header: React.FC = () => {
    const location = useLocation();
    const currentNavItem = NAVIGATION_ITEMS.find(item => item.path === location.pathname);
    const title = currentNavItem ? currentNavItem.name : 'Asistente de Medios BCV';

    return (
        <header className="bg-white shadow-sm p-4 z-10">
            <h1 className="text-xl font-semibold text-bcv-dark">{title}</h1>
        </header>
    );
};

export default Header;
