import React from 'react';
import Card from '../ui/Card';

interface ApiKeyDisplayProps {
    name: string;
    value: string;
    status: 'configured' | 'simulated';
}

const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({ name, value, status }) => {
    const statusInfo = {
        configured: { text: 'Configurada', color: 'text-green-700', bgColor: 'bg-green-100' },
        simulated: { text: 'En Vivo', color: 'text-green-800', bgColor: 'bg-green-100' },
    };

    const currentStatus = statusInfo[status];

    return (
        <div>
            <label className="block text-sm font-medium text-bcv-gray-700">{name}</label>
            <div className="mt-1 flex items-center justify-between p-2 pl-3 bg-bcv-gray-50 border border-bcv-gray-200 rounded-md">
                <span className="font-mono text-sm text-bcv-gray-600">{value}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${currentStatus.color} ${currentStatus.bgColor}`}>
                    {currentStatus.text}
                </span>
            </div>
        </div>
    );
};


import { useState, useEffect } from 'react';
import { NEWS_SOURCE_LABELS, NewsSourceType } from '../../types/news';

const NEWS_SOURCE_KEY = 'news_source_type';

const SettingsPage: React.FC = () => {
    const [newsSource, setNewsSource] = useState<NewsSourceType>(() => {
        return (localStorage.getItem(NEWS_SOURCE_KEY) as NewsSourceType) || 'newsapi';
    });

    useEffect(() => {
        localStorage.setItem(NEWS_SOURCE_KEY, newsSource);
    }, [newsSource]);

    return (
        <div className="max-w-2xl mx-auto">
            <Card title="Configuración del Sistema">
                <div className="space-y-8">
                    <div>
                        <h4 className="text-lg font-semibold text-bcv-dark">Claves de API</h4>
                        <p className="mt-1 text-sm text-bcv-gray-600">
                            Las claves de API se configuran a través de variables de entorno y no son editables desde esta interfaz por motivos de seguridad. La aplicación está diseñada para usar estas variables cuando se despliega.
                        </p>
                    </div>

                    <div className="space-y-4 p-4 border border-bcv-gray-200 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-bcv-dark mb-1">Fuente de Noticias</label>
                            <select
                                className="block w-full mt-1 border border-bcv-gray-300 rounded-md p-2 text-bcv-dark"
                                value={newsSource}
                                onChange={e => setNewsSource(e.target.value as NewsSourceType)}
                            >
                                {Object.entries(NEWS_SOURCE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <span className="text-xs text-bcv-gray-600 mt-1 block">Actualmente: <b>{NEWS_SOURCE_LABELS[newsSource]}</b></span>
                        </div>
                        <ApiKeyDisplay 
                            name="Google Gemini API Key" 
                            value="Variable: process.env.API_KEY"
                            status="configured" 
                        />
                        <ApiKeyDisplay 
                            name="DeepSeek API Key" 
                            value="Modelo actualmente simulado."
                            status="simulated"
                        />
                        <ApiKeyDisplay 
                            name="Mistral API Key" 
                            value="Modelo actualmente simulado."
                            status="simulated"
                        />
                    </div>
                    
                    <div>
                        <h4 className="text-lg font-semibold text-bcv-dark">Futuras Integraciones</h4>
                        <p className="mt-1 text-sm text-bcv-gray-600">
                           El soporte para modelos como DeepSeek y Mistral está planeado. Una vez implementados, sus respectivas claves de API (e.g., `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`) serán utilizadas por el sistema.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-bcv-dark">Auditoría</h4>
                        <p className="mt-1 text-sm text-bcv-gray-600">
                            Todas las acciones de generación y transcripción son registradas para fines de auditoría.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;
