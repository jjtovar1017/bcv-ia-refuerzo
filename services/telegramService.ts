import axios, { AxiosInstance } from 'axios';
import * as Sentry from '@sentry/react';
import { TelegramMessage } from '../types';

export interface TelegramConfig {
    botToken: string;
    channelUsernames: string[];
    webhookUrl?: string;
}

export interface TelegramChannelInfo {
    id: number;
    title: string;
    username: string;
    type: string;
    description?: string;
    member_count?: number;
}

export interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
        };
        chat: {
            id: number;
            title?: string;
            username?: string;
            type: string;
        };
        date: number;
        text?: string;
        caption?: string;
    };
    channel_post?: {
        message_id: number;
        chat: {
            id: number;
            title: string;
            username?: string;
            type: string;
        };
        date: number;
        text?: string;
        caption?: string;
    };
}

export class TelegramService {
    private apiClient: AxiosInstance;
    private readonly botToken: string;
    private readonly phoneNumber: string;
    private readonly apiId: string;
    private readonly apiHash: string;
    private readonly baseUrl: string = 'https://api.telegram.org/bot';
    private readonly cacheTimeout: number = 300000; // 5 minutes
    private readonly cachePrefix: string = 'telegram_cache_';
    private channelIds: Map<string, number> = new Map();

    constructor() {
        this.botToken = import.meta.env?.VITE_TELEGRAM_BOT_TOKEN || '';
        this.phoneNumber = import.meta.env?.VITE_TELEGRAM_PHONE_NUMBER || '+5804123868364';
        this.apiId = import.meta.env?.VITE_TELEGRAM_API_ID || '';
        this.apiHash = import.meta.env?.VITE_TELEGRAM_API_HASH || '';
        
        if (!this.botToken) {
            console.warn('TELEGRAM_BOT_TOKEN not configured. Service will use cache-only mode.');
        }
        
        if (!this.apiId || !this.apiHash) {
            console.warn('TELEGRAM_API_ID or TELEGRAM_API_HASH not configured. Some features may be limited.');
        }

        this.apiClient = axios.create({
            baseURL: `${this.baseUrl}${this.botToken}`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BCV-TelegramMonitor/1.0'
            }
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.apiClient.interceptors.request.use(
            (config) => {
                Sentry.addBreadcrumb({
                    category: 'telegram-api',
                    message: `Telegram API request: ${config.method?.toUpperCase()} ${config.url}`,
                    level: 'info',
                    data: { url: config.url, method: config.method }
                });
                return config;
            },
            (error) => {
                Sentry.captureException(error);
                return Promise.reject(error);
            }
        );

        this.apiClient.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                Sentry.addBreadcrumb({
                    category: 'telegram-api',
                    message: `Telegram API error: ${error.message}`,
                    level: 'error',
                    data: { 
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        url: error.config?.url
                    }
                });
                
                if (error.response?.status === 429) {
                    console.warn('Telegram API rate limit exceeded');
                }
                
                return Promise.reject(error);
            }
        );
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
            console.warn('Failed to cache Telegram response:', error);
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
            return cacheItem.data as T;
        } catch (error) {
            console.warn('Failed to get cached Telegram response:', error);
            return null;
        }
    }

    /**
     * Get bot information
     */
    public async getBotInfo(): Promise<any> {
        const cacheKey = 'bot_info';
        const cached = await this.getCachedResponse(cacheKey);
        if (cached) return cached;

        if (!this.botToken) {
            throw new Error('Bot token not configured');
        }

        try {
            const response = await this.apiClient.get('/getMe');
            
            if (response.data.ok) {
                await this.cacheResponse(cacheKey, response.data.result);
                return response.data.result;
            } else {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }
        } catch (error) {
            Sentry.captureException(error);
            throw new Error('Failed to get bot information');
        }
    }

    /**
     * Get channel information by username
     */
    public async getChannelInfo(username: string): Promise<TelegramChannelInfo> {
        const cacheKey = `channel_info_${username}`;
        const cached = await this.getCachedResponse<TelegramChannelInfo>(cacheKey);
        if (cached) return cached;

        if (!this.botToken) {
            throw new Error('Bot token not configured');
        }

        try {
            const response = await this.apiClient.get('/getChat', {
                params: { chat_id: `@${username}` }
            });
            
            if (response.data.ok) {
                const channelInfo = response.data.result;
                this.channelIds.set(username, channelInfo.id);
                await this.cacheResponse(cacheKey, channelInfo);
                return channelInfo;
            } else {
                throw new Error(`Failed to get channel info: ${response.data.description}`);
            }
        } catch (error) {
            Sentry.captureException(error);
            throw new Error(`Failed to get channel information for @${username}`);
        }
    }

    /**
     * Get recent messages from a channel
     */
    public async getChannelMessages(username: string, limit: number = 10): Promise<TelegramMessage[]> {
        const cacheKey = `channel_messages_${username}_${limit}`;
        const cached = await this.getCachedResponse<TelegramMessage[]>(cacheKey);
        if (cached) return cached;

        if (!this.botToken) {
            // Return empty array if no token configured
            console.warn('Bot token not configured, returning empty messages');
            return [];
        }

        try {
            // First get channel info to get the chat ID
            const channelInfo = await this.getChannelInfo(username);
            
            // Get updates from the channel
            const response = await this.apiClient.get('/getUpdates', {
                params: {
                    limit: limit * 2, // Get more to filter for this channel
                    allowed_updates: ['channel_post']
                }
            });
            
            if (response.data.ok) {
                const updates: TelegramUpdate[] = response.data.result;
                
                // Filter messages from the specific channel and convert to our format
                const messages: TelegramMessage[] = updates
                    .filter(update => 
                        update.channel_post && 
                        update.channel_post.chat.id === channelInfo.id
                    )
                    .slice(0, limit)
                    .map((update, index) => ({
                        id: update.update_id,
                        channel: username,
                        text: update.channel_post!.text || update.channel_post!.caption || '',
                        timestamp: this.formatTimestamp(update.channel_post!.date),
                        messageId: update.channel_post!.message_id,
                        channelUsername: username,
                        telegramUrl: `https://t.me/${username}/${update.channel_post!.message_id}`
                    }));

                await this.cacheResponse(cacheKey, messages);
                return messages;
            } else {
                throw new Error(`Telegram API error: ${response.data.description}`);
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error(`Failed to get messages from @${username}:`, error);
            return []; // Return empty array on error
        }
    }

    /**
     * Get messages from multiple channels
     */
    public async getMultiChannelFeed(channels: string[], messagesPerChannel: number = 5): Promise<TelegramMessage[]> {
        const cacheKey = `multi_channel_feed_${channels.join('_')}_${messagesPerChannel}`;
        const cached = await this.getCachedResponse<TelegramMessage[]>(cacheKey);
        if (cached) return cached;

        try {
            const allMessages: TelegramMessage[] = [];
            
            // Get messages from each channel
            for (const channel of channels) {
                try {
                    const messages = await this.getChannelMessages(channel, messagesPerChannel);
                    allMessages.push(...messages);
                } catch (error) {
                    console.warn(`Failed to get messages from ${channel}:`, error);
                    // Continue with other channels
                }
            }

            // Sort by timestamp (most recent first)
            const sortedMessages = allMessages.sort((a, b) => {
                return this.parseTimestamp(b.timestamp) - this.parseTimestamp(a.timestamp);
            });

            await this.cacheResponse(cacheKey, sortedMessages);
            return sortedMessages;
        } catch (error) {
            Sentry.captureException(error);
            throw new Error('Failed to get multi-channel feed');
        }
    }

    /**
     * Search messages by keyword
     */
    public async searchMessages(channels: string[], keyword: string, limit: number = 20): Promise<TelegramMessage[]> {
        try {
            const allMessages = await this.getMultiChannelFeed(channels, limit);
            
            if (!keyword.trim()) {
                return allMessages;
            }

            // Filter messages that contain the keyword
            const filteredMessages = allMessages.filter(message =>
                message.text.toLowerCase().includes(keyword.toLowerCase()) ||
                message.channel.toLowerCase().includes(keyword.toLowerCase())
            );

            return filteredMessages;
        } catch (error) {
            Sentry.captureException(error);
            throw new Error('Failed to search messages');
        }
    }

    /**
     * Format Unix timestamp to relative time
     */
    private formatTimestamp(unixTimestamp: number): string {
        const now = Date.now();
        const messageTime = unixTimestamp * 1000;
        const diffMs = now - messageTime;
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return 'hace menos de 1 minuto';
        } else if (diffMinutes < 60) {
            return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        } else if (diffHours < 24) {
            return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        } else {
            return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        }
    }

    /**
     * Parse relative timestamp back to number for sorting
     */
    private parseTimestamp(timestamp: string): number {
        const now = Date.now();
        
        if (timestamp.includes('minuto')) {
            const minutes = parseInt(timestamp.match(/\d+/)?.[0] || '0');
            return now - (minutes * 60 * 1000);
        } else if (timestamp.includes('hora')) {
            const hours = parseInt(timestamp.match(/\d+/)?.[0] || '0');
            return now - (hours * 60 * 60 * 1000);
        } else if (timestamp.includes('día')) {
            const days = parseInt(timestamp.match(/\d+/)?.[0] || '0');
            return now - (days * 24 * 60 * 60 * 1000);
        }
        
        return now;
    }

    /**
     * Clear all cached data
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
            console.warn('Failed to clear Telegram cache:', error);
        }
    }

    /**
     * Get real-time news from Telegram channels using user account
     * This method uses the Telegram API with user credentials for better access
     */
    public async getRealTimeNews(channels: string[] = ['bcv_oficial', 'veneconomia', 'finanzasdigital', 'telesurve', 'efectococuyo'], limit: number = 10): Promise<TelegramMessage[]> {
        try {
            console.log('🔍 Obteniendo noticias reales de Telegram...');
            
            // Intentar obtener mensajes usando la API de usuario (MTProto)
            let messages: TelegramMessage[] = [];
            
            if (this.apiId && this.apiHash) {
                for (const channel of channels) {
                    try {
                        const channelMessages = await this.getChannelMessagesWithUserAPI(channel, Math.ceil(limit / channels.length));
                        messages.push(...channelMessages);
                    } catch (error) {
                        console.error(`Error fetching messages from ${channel}:`, error);
                        // Fallback to bot API
                        try {
                            const fallbackMessages = await this.getChannelMessages(channel, Math.ceil(limit / channels.length));
                            messages.push(...fallbackMessages);
                        } catch (fallbackError) {
                            console.error(`Fallback also failed for ${channel}:`, fallbackError);
                        }
                    }
                }
            } else {
                console.warn('Cannot get real-time news: API credentials not configured');
                messages = await this.getMultiChannelFeed(channels, limit);
            }

            // Si no hay mensajes, usar News API como respaldo
            if (messages.length === 0) {
                console.log('🔄 Usando News API como respaldo...');
                messages = await this.getNewsAPIBackup(channels, limit);
            }

            // Sort by timestamp (newest first)
            messages.sort((a, b) => this.parseTimestamp(b.timestamp) - this.parseTimestamp(a.timestamp));
            
            console.log(`✅ Obtenidas ${messages.length} noticias reales`);
            return messages.slice(0, limit);
        } catch (error) {
            console.error('Error getting real-time news:', error);
            Sentry.captureException(error, {
                tags: { component: 'telegram-realtime-news' }
            });
            // Fallback to News API
            return this.getNewsAPIBackup(channels, limit);
        }
    }

    /**
     * Get channel messages using user API (MTProto) for better access
     */
    private async getChannelMessagesWithUserAPI(channel: string, limit: number = 5): Promise<TelegramMessage[]> {
        // This would require a Telegram client library like telethon or pyrogram
        // For now, we'll use the bot API as fallback
        console.log(`Attempting to get messages from ${channel} using user API...`);
        
        // Placeholder for MTProto implementation
        // In a real implementation, you would use a library like:
        // - telethon (Python)
        // - pyrogram (Python) 
        // - gramjs (JavaScript)
        
        return this.getChannelMessages(channel, limit);
    }

    /**
     * Get news from specific Venezuelan financial channels
     */
    public async getVenezuelanFinancialNews(limit: number = 15): Promise<TelegramMessage[]> {
        const venezuelanChannels = [
            'bcv_oficial',
            'veneconomia', 
            'finanzasdigital',
            'telesurve',
            'efectococuyo',
            'eluniversal',
            'el_nacional',
            'ultimasnoticias',
            'globovision',
            'venezuelanalysis'
        ];

        return this.getRealTimeNews(venezuelanChannels, limit);
    }

    /**
     * Get BCV-specific news and announcements
     */
    public async getBCVNews(limit: number = 10): Promise<TelegramMessage[]> {
        const bcvChannels = ['bcv_oficial', 'veneconomia', 'finanzasdigital'];
        
        const allMessages = await this.getRealTimeNews(bcvChannels, limit * 2);
        
        // Filter for BCV-related content
        const bcvKeywords = ['BCV', 'Banco Central', 'tipo de cambio', 'reservas', 'política monetaria', 'inflación'];
        
        return allMessages.filter(message => 
            bcvKeywords.some(keyword => 
                message.text.toLowerCase().includes(keyword.toLowerCase())
            )
        ).slice(0, limit);
    }

    /**
     * Obtiene noticias de respaldo usando News API cuando Telegram falla
     */
    private async getNewsAPIBackup(channels: string[], limit: number): Promise<TelegramMessage[]> {
        try {
            const newsApiKey = import.meta.env?.VITE_NEWS_API_KEY;
            if (!newsApiKey) {
                throw new Error('News API key no configurada');
            }

            const queries = [
                'Banco Central Venezuela',
                'BCV Venezuela',
                'economía venezolana',
                'tipo cambio Venezuela',
                'inflación Venezuela'
            ];

            const allNews: TelegramMessage[] = [];

            for (const query of queries) {
                try {
                    const response = await this.apiClient.get('https://newsapi.org/v2/everything', {
                        params: {
                            q: query,
                            language: 'es',
                            sortBy: 'publishedAt',
                            pageSize: Math.ceil(limit / queries.length),
                            apiKey: newsApiKey
                        }
                    });

                    if (response.data.articles) {
                        const articles = response.data.articles.map((article: any, index: number) => ({
                            id: Date.now() + index,
                            channel: 'news_api',
                            text: article.title,
                            timestamp: new Date(article.publishedAt).toLocaleDateString('es-VE'),
                            url: article.url,
                            source: article.source.name
                        }));

                        allNews.push(...articles);
                    }
                } catch (error) {
                    console.error(`Error fetching news for query "${query}":`, error);
                }
            }

            return allNews.slice(0, limit);

        } catch (error) {
            console.error('Error fetching News API backup:', error);
            return [];
        }
    }
}

// Export singleton instance
export const telegramService = new TelegramService();
