import React, { useState, useEffect } from 'react';
import { YouTubeVideo, youtubeService } from '../../services/youtubeService';
import Spinner from './Spinner';
import { PlayIcon, ExternalLinkIcon } from '../icons/Icons';

interface YouTubePlayerProps {
    videoId?: string;
    videoUrl?: string;
    width?: string;
    height?: string;
    autoplay?: boolean;
    controls?: boolean;
    showInfo?: boolean;
    className?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
    videoId,
    videoUrl,
    width = '100%',
    height = '315',
    autoplay = false,
    controls = true,
    showInfo = true,
    className = ''
}) => {
    const [video, setVideo] = useState<YouTubeVideo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPlayer, setShowPlayer] = useState(false);

    const finalVideoId = videoId || (videoUrl ? youtubeService.extractVideoId(videoUrl) : null);

    useEffect(() => {
        if (finalVideoId && showInfo) {
            loadVideoInfo();
        }
    }, [finalVideoId, showInfo]);

    const loadVideoInfo = async () => {
        if (!finalVideoId) return;

        setIsLoading(true);
        setError('');

        try {
            const videoInfo = await youtubeService.getVideoInfo(finalVideoId);
            setVideo(videoInfo);
        } catch (err: any) {
            setError('Error al cargar información del video');
            console.error('Failed to load video info:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayClick = () => {
        setShowPlayer(true);
    };

    const handleOpenInYouTube = () => {
        if (finalVideoId) {
            window.open(`https://www.youtube.com/watch?v=${finalVideoId}`, '_blank');
        }
    };

    if (!finalVideoId) {
        return (
            <div className={`bg-gray-100 rounded-lg p-4 text-center ${className}`}>
                <p className="text-gray-600">URL de video inválida</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center ${className}`}>
                <p className="text-red-600">{error}</p>
                <button
                    onClick={handleOpenInYouTube}
                    className="mt-2 inline-flex items-center text-sm text-red-700 hover:text-red-900"
                >
                    <ExternalLinkIcon className="w-4 h-4 mr-1" />
                    Ver en YouTube
                </button>
            </div>
        );
    }

    const embedProps = youtubeService.createEmbedProps(finalVideoId, {
        autoplay,
        controls,
        modestbranding: true,
        rel: false
    });

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
            {showInfo && (
                <div className="p-4 border-b border-gray-200">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Spinner size={6} />
                            <span className="ml-2 text-gray-600">Cargando información del video...</span>
                        </div>
                    ) : video ? (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>{video.channelTitle}</span>
                                <div className="flex items-center space-x-4">
                                    {video.viewCount && <span>{video.viewCount}</span>}
                                    {video.duration && <span>{video.duration}</span>}
                                </div>
                            </div>
                            {video.description && (
                                <p className="text-sm text-gray-700 line-clamp-2">
                                    {video.description.length > 150 
                                        ? `${video.description.substring(0, 150)}...` 
                                        : video.description
                                    }
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Video de YouTube</h3>
                            <p className="text-sm text-gray-600">Haga clic para reproducir</p>
                        </div>
                    )}
                </div>
            )}

            <div className="relative" style={{ width, height }}>
                {!showPlayer ? (
                    <div 
                        className="relative cursor-pointer group"
                        onClick={handlePlayClick}
                        style={{ width, height }}
                    >
                        <img
                            src={video?.thumbnail || `https://img.youtube.com/vi/${finalVideoId}/hqdefault.jpg`}
                            alt={video?.title || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                            <div className="bg-red-600 rounded-full p-4 group-hover:bg-red-700 transition-colors">
                                <PlayIcon className="w-8 h-8 text-white ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-2 right-2">
                            <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                YouTube
                            </span>
                        </div>
                    </div>
                ) : (
                    <iframe
                        src={embedProps.src}
                        title={embedProps.title}
                        width={embedProps.width}
                        height={embedProps.height}
                        frameBorder={embedProps.frameBorder}
                        allowFullScreen={embedProps.allowFullScreen}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        className="w-full h-full"
                    />
                )}
            </div>

            <div className="p-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {!showPlayer && (
                        <button
                            onClick={handlePlayClick}
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                        >
                            <PlayIcon className="w-4 h-4 mr-1" />
                            Reproducir
                        </button>
                    )}
                    <button
                        onClick={handleOpenInYouTube}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                    >
                        <ExternalLinkIcon className="w-4 h-4 mr-1" />
                        Ver en YouTube
                    </button>
                </div>
                {video?.publishedAt && (
                    <span className="text-xs text-gray-500">
                        {new Date(video.publishedAt).toLocaleDateString('es-VE')}
                    </span>
                )}
            </div>
        </div>
    );
};

export default YouTubePlayer;
