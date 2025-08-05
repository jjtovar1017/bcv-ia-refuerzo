
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
    label?: string;
}

const Select: React.FC<SelectProps> = ({ children, label, id, ...props }) => {
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-bcv-gray-700 mb-1">{label}</label>}
            <select
                id={id}
                className="block w-full px-3 py-2 bg-white border border-bcv-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bcv-blue focus:border-bcv-blue sm:text-sm"
                {...props}
            >
                {children}
            </select>
        </div>
    );
};

export default Select;
