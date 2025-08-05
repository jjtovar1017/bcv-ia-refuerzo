
import React from 'react';
import { Metric } from '../../types';
import Card from '../ui/Card';

const MetricCard: React.FC<Metric> = ({ title, value, icon, change, changeType }) => {
    const changeColor = changeType === 'increase' ? 'text-green-500' : 'text-red-500';

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-bcv-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-bcv-dark">{value}</p>
                    {change && (
                        <p className={`text-sm mt-1 ${changeColor}`}>
                            {change} vs ayer
                        </p>
                    )}
                </div>
                <div className="bg-bcv-blue bg-opacity-10 p-3 rounded-full">
                    {icon}
                </div>
            </div>
        </Card>
    );
};

export default MetricCard;
