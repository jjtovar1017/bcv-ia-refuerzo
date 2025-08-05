import axios from 'axios';
import * as Sentry from '@sentry/react';

export interface YouTubeVideo {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    duration?: string;
    viewCount?: string;
    url: string;
    embedUrl: string;
}

export interface YouTubeSearchResult {
    videos: YouTubeVideo[];
    totalResults: number;
    nextPageToken?: string;
}

export class YouTubeService {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://www.googleapis.com/youtube/v3';
    private readonly cacheTimeout: number = 3600000; // 1 hour
    private readonly cachePrefix: string = 'youtube_cache_';

    constructor() {
        this.apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY || '';
        
        if (!this.apiKey) {
            console.warn('YouTube API key not configured. Using fallback methods.');
        }
    }

    /**
     * Cache response in localStorage
     */
    private async cacheResponse<T>(key: string, data: T): Promise<void> {
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
                expires: Date.now() + this.cacheTimeout
            };
            localStorage.setItem(this.cachePrefix + key, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('Failed to cache YouTube response:', error);
        }
    }

    /**
     * Get cached response from localStorage
     */
    private async getCachedResponse<T>(key: string): Promise<T | null> {
        try {
            const cached = localStorage.getItem(this.cachePrefix + key);
            if (!cached) return null;

            const cacheItem = JSON.parse(cached);
            if (Date.now() > cacheItem.expires) {
                localStorage.removeItem(this.cachePrefix + key);
                return null;
            }

            return cacheItem.data;
        } catch (error) {
            console.warn('Failed to get cached YouTube response:', error);
            return null;
        }
    }

    /**
     * Extract video ID from YouTube URL
     */
    public extractVideoId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Get video information by ID
     */
    public async getVideoInfo(videoId: string): Promise<YouTubeVideo | null> {
        const cacheKey = `video_info_${videoId}`;
        const cached = await this.getCachedResponse<YouTubeVideo>(cacheKey);
        if (cached) return cached;

        try {
            if (!this.apiKey) {
                return this.getFallbackVideoInfo(videoId);
            }

            const response = await axios.get(`${this.baseUrl}/videos`, {
                params: {
                    part: 'snippet,contentDetails,statistics',
                    id: videoId,
                    key: this.apiKey
                }
            });

            if (response.data.items && response.data.items.length > 0) {
                const item = response.data.items[0];
                const video: YouTubeVideo = {
                    id: videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: item.snippet.publishedAt,
                    duration: this.formatDuration(item.contentDetails.duration),
                    viewCount: this.formatViewCount(item.statistics.viewCount),
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    embedUrl: `https://www.youtube.com/embed/${videoId}`
                };

                await this.cacheResponse(cacheKey, video);
                return video;
            }

            return null;
        } catch (error) {
            console.error('Failed to get YouTube video info:', error);
            Sentry.captureException(error);
            return this.getFallbackVideoInfo(videoId);
        }
    }

    /**
     * Search for videos
     */
    public async searchVideos(query: string, maxResults: number = 10): Promise<YouTubeSearchResult> {
        const cacheKey = `search_${query}_${maxResults}`;
        const cached = await this.getCachedResponse<YouTubeSearchResult>(cacheKey);
        if (cached) return cached;

        try {
            if (!this.apiKey) {
                return this.getFallbackSearchResults(query);
            }

            const response = await axios.get(`${this.baseUrl}/search`, {
                params: {
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults,
                    key: this.apiKey,
                    order: 'relevance'
                }
            });

            if (response.data.items) {
                const videos: YouTubeVideo[] = response.data.items.map((item: any) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                    channelTitle: item.snippet.channelTitle,
                    publishedAt: item.snippet.publishedAt,
                    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                    embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
                }));

                const result: YouTubeSearchResult = {
                    videos,
                    totalResults: response.data.pageInfo.totalResults,
                    nextPageToken: response.data.nextPageToken
                };

                await this.cacheResponse(cacheKey, result);
                return result;
            }

            return { videos: [], totalResults: 0 };
        } catch (error) {
            console.error('Failed to search YouTube videos:', error);
            Sentry.captureException(error);
            return this.getFallbackSearchResults(query);
        }
    }

    /**
     * Get BCV related videos
     */
    public async getBCVVideos(limit: number = 5): Promise<YouTubeVideo[]> {
        const queries = [
            'Banco Central Venezuela BCV',
            'BCV Venezuela economía',
            'política monetaria Venezuela',
            'inflación Venezuela BCV'
        ];

        const allVideos: YouTubeVideo[] = [];

        for (const query of queries) {
            try {
                const result = await this.searchVideos(query, Math.ceil(limit / queries.length));
                allVideos.push(...result.videos);
            } catch (error) {
                console.error(`Failed to search for "${query}":`, error);
            }
        }

        // Remove duplicates and sort by relevance
        const uniqueVideos = allVideos.filter((video, index, self) => 
            index === self.findIndex(v => v.id === video.id)
        );

        return uniqueVideos.slice(0, limit);
    }

    /**
     * Create embeddable video component props
     */
    public createEmbedProps(videoId: string, options?: {
        autoplay?: boolean;
        controls?: boolean;
        modestbranding?: boolean;
        rel?: boolean;
    }): {
        src: string;
        title: string;
        allowFullScreen: boolean;
        frameBorder: string;
        width: string;
        height: string;
    } {
        const params = new URLSearchParams({
            autoplay: options?.autoplay ? '1' : '0',
            controls: options?.controls !== false ? '1' : '0',
            modestbranding: options?.modestbranding ? '1' : '0',
            rel: options?.rel !== false ? '1' : '0'
        });

        return {
            src: `https://www.youtube.com/embed/${videoId}?${params.toString()}`,
            title: 'YouTube video player',
            allowFullScreen: true,
            frameBorder: '0',
            width: '100%',
            height: '315'
        };
    }

    /**
     * Format duration from ISO 8601 to readable format
     */
    private formatDuration(duration: string): string {
        if (!duration) return '';

        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return '';

        const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
        const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
        const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format view count to readable format
     */
    private formatViewCount(viewCount: string): string {
        if (!viewCount) return '';

        const count = parseInt(viewCount);
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M visualizaciones`;
        } else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K visualizaciones`;
        }
        return `${count} visualizaciones`;
    }

    /**
     * Get fallback video info when API is not available
     */
    private getFallbackVideoInfo(videoId: string): YouTubeVideo {
        return {
            id: videoId,
            title: 'Video de YouTube',
            description: 'Video relacionado con el contenido solicitado.',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            channelTitle: 'Canal de YouTube',
            publishedAt: new Date().toISOString(),
            url: `https://www.youtube.com/watch?v=${videoId}`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
        };
    }

    /**
     * Get fallback search results when API is not available
     */
    private getFallbackSearchResults(query: string): YouTubeSearchResult {
        // Some sample BCV-related video IDs for fallback
        const fallbackVideoIds = [
            'dQw4w9WgXcQ', // This would be replaced with actual BCV video IDs
            'oHg5SJYRHA0'  // This would be replaced with actual BCV video IDs
        ];

        const videos: YouTubeVideo[] = fallbackVideoIds.map(id => ({
            id,
            title: `Video sobre ${query}`,
            description: `Contenido relacionado con ${query} y el Banco Central de Venezuela.`,
            thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            channelTitle: 'BCV Oficial',
            publishedAt: new Date().toISOString(),
            url: `https://www.youtube.com/watch?v=${id}`,
            embedUrl: `https://www.youtube.com/embed/${id}`
        }));

        return {
            videos,
            totalResults: videos.length
        };
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.cachePrefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear YouTube cache:', error);
        }
    }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
