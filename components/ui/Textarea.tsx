
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, ...props }) => {
    return (
        <div>
            {label && <label htmlFor={id} className="block text-sm font-medium text-bcv-gray-700 mb-1">{label}</label>}
            <textarea
                id={id}
                className="block w-full px-3 py-2 bg-white border border-bcv-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-bcv-blue focus:border-bcv-blue sm:text-sm"
                rows={4}
                {...props}
            ></textarea>
        </div>
    );
};

export default Textarea;
