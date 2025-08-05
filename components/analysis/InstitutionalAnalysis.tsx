import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { webAnalysisService, BCVInstitutionalAnalysis, WebAnalysisResult } from '../../services/webAnalysisService';
// Iconos personalizados
const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a1.2 1.2 0 001.697 0L21.75 8.25" />
    </svg>
);

const TrendingDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.4a1.2 1.2 0 011.714 0L21.75 15.75" />
    </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
);

const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const ChartBarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

const LightBulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
);

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
);

const RefreshCwIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const InstitutionalAnalysis: React.FC = () => {
    const [analysis, setAnalysis] = useState<BCVInstitutionalAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await webAnalysisService.getBCVInstitutionalAnalysis();
            setAnalysis(result);
        } catch (err) {
            setError('Error al obtener el análisis institucional');
            console.error('Error fetching analysis:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, []);

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return <TrendingUpIcon className="w-6 h-6 text-green-500" />;
            case 'negative':
                return <TrendingDownIcon className="w-6 h-6 text-red-500" />;
            default:
                return <MinusIcon className="w-6 h-6 text-gray-500" />;
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return 'text-green-600 bg-green-100';
            case 'negative':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getImageScoreColor = (score: number) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const NewsItem: React.FC<{ news: WebAnalysisResult }> = ({ news }) => (
        <div className="border-l-4 border-bcv-blue pl-4 py-3 bg-white rounded-r-lg shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{news.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{news.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{news.source}</span>
                        <span>{new Date(news.publishedAt).toLocaleDateString('es-VE')}</span>
                        <span className={`px-2 py-1 rounded-full ${getSentimentColor(news.sentiment)}`}>
                            {news.sentiment === 'positive' ? 'Positivo' : 
                             news.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                        </span>
                    </div>
                </div>
                <Button

                    
                    onClick={() => window.open(news.url, '_blank')}
                    className="text-bcv-blue hover:text-bcv-blue-dark"
                >
                    <ExternalLinkIcon className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center py-12">
                    <RefreshCwIcon className="w-8 h-8 text-bcv-blue animate-spin" />
                    <span className="ml-3 text-lg text-gray-600">Analizando imagen institucional del BCV...</span>
                </div>
            </div>
        );
    }

    if (error || !analysis) {
        return (
            <div className="space-y-6">
                <Card title="Error en el Análisis">
                    <div className="text-center py-8">
                        <p className="text-red-600 mb-4">{error || 'No se pudo obtener el análisis'}</p>
                        <Button onClick={fetchAnalysis} variant="primary">
                            <RefreshCwIcon className="w-4 h-4 mr-2" />
                            Reintentar
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Sentimiento General" className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        {getSentimentIcon(analysis.overallSentiment)}
                    </div>
                    <p className={`text-lg font-semibold ${getSentimentColor(analysis.overallSentiment)}`}>
                        {analysis.overallSentiment === 'positive' ? 'Positivo' : 
                         analysis.overallSentiment === 'negative' ? 'Negativo' : 'Neutral'}
                    </p>
                </Card>

                <Card title="Score de Imagen" className="text-center">
                    <div className="text-3xl font-bold mb-2">
                        <span className={getImageScoreColor(analysis.imageScore)}>
                            {analysis.imageScore}/100
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${
                                analysis.imageScore >= 70 ? 'bg-green-500' : 
                                analysis.imageScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${analysis.imageScore}%` }}
                        ></div>
                    </div>
                </Card>

                <Card title="Impacto Económico" className="text-center">
                    <ChartBarIcon className="w-8 h-8 text-bcv-blue mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{analysis.economicImpact}</p>
                </Card>
            </div>

            {/* Hallazgos Clave */}
            <Card title="Hallazgos Clave" icon={<DocumentTextIcon className="w-5 h-5" />}>
                <div className="space-y-3">
                    {analysis.keyFindings.map((finding, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="w-2 h-2 bg-bcv-blue rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-gray-700">{finding}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Recomendaciones */}
            <Card title="Recomendaciones Estratégicas" icon={<LightBulbIcon className="w-5 h-5" />}>
                <div className="space-y-3">
                    {analysis.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-gray-700">{recommendation}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Noticias Recientes */}
            <Card title="Noticias Recientes sobre BCV">
                <div className="space-y-4">
                    {analysis.recentNews.map((news, index) => (
                        <NewsItem key={index} news={news} />
                    ))}
                </div>
                <div className="mt-6 text-center">
                    <Button onClick={fetchAnalysis} variant="secondary">
                        <RefreshCwIcon className="w-4 h-4 mr-2" />
                        Actualizar Análisis
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default InstitutionalAnalysis; 