import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import YouTubePlayer from '../ui/YouTubePlayer';
import { youtubeService, YouTubeVideo } from '../../services/youtubeService';
import Spinner from '../ui/Spinner';
import { PlayIcon } from '../icons/Icons';

interface YouTubeSectionProps {
    showVideos?: boolean;
}

const YouTubeSection: React.FC<YouTubeSectionProps> = ({ showVideos = true }) => {
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

    useEffect(() => {
        loadBCVVideos();
    }, []);

    const loadBCVVideos = async () => {
        setIsLoading(true);
        setError('');

        try {
            const bcvVideos = await youtubeService.getBCVVideos(6);
            setVideos(bcvVideos);
            
            // Auto-select first video if available
            if (bcvVideos.length > 0) {
                setSelectedVideo(bcvVideos[0]);
            }
        } catch (err: any) {
            setError('Error al cargar videos relacionados con el BCV');
            console.error('Failed to load BCV videos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVideoSelect = (video: YouTubeVideo) => {
        setSelectedVideo(video);
    };

    // Si showVideos es false, mostrar solo mensaje informativo
    if (!showVideos) {
        return (
            <Card title="Videos del BCV">
                <div className="text-center py-8 text-gray-600">
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <PlayIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-blue-900 mb-2">
                            Sección de Videos del BCV
                        </h3>
                        <p className="text-sm text-blue-700 mb-4">
                            Aquí se mostrarían videos oficiales y contenido multimedia relacionado con el Banco Central de Venezuela.
                        </p>
                        <p className="text-xs text-blue-600">
                            Funcionalidad disponible próximamente con integración completa de YouTube API.
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card title="Videos Relacionados">
                <div className="flex flex-col items-center justify-center h-64">
                    <Spinner size={8} />
                    <p className="mt-4 text-gray-600">Cargando videos del BCV...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card title="Videos Relacionados">
                <div className="text-center py-8 text-red-600">
                    <p>{error}</p>
                    <button
                        onClick={loadBCVVideos}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Video Principal */}
            {selectedVideo && (
                <Card title="Video Destacado">
                    <YouTubePlayer
                        videoId={selectedVideo.id}
                        showInfo={true}
                        className="w-full"
                    />
                </Card>
            )}

            {/* Lista de Videos */}
            <Card title={`Videos del BCV (${videos.length})`}>
                {videos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No se encontraron videos relacionados.</p>
                        <p className="text-sm mt-1">Intente configurar una API key de YouTube para mejores resultados.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className={`cursor-pointer rounded-lg border-2 transition-all hover:shadow-md ${
                                    selectedVideo?.id === video.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleVideoSelect(video)}
                            >
                                <div className="relative">
                                    <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-32 object-cover rounded-t-lg"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-t-lg">
                                        <div className="bg-red-600 rounded-full p-2">
                                            <PlayIcon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    {video.duration && (
                                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                            {video.duration}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                                        {video.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 mb-2">
                                        {video.channelTitle}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        {video.viewCount && (
                                            <span>{video.viewCount}</span>
                                        )}
                                        <span>
                                            {new Date(video.publishedAt).toLocaleDateString('es-VE')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {videos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Videos relacionados con el Banco Central de Venezuela
                            </p>
                            <button
                                onClick={loadBCVVideos}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default YouTubeSection;
