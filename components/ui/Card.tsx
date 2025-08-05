
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
            {title && <h3 className="text-base font-semibold text-bcv-dark mb-3">{title}</h3>}
            {children}
        </div>
    );
};

export default Card;
