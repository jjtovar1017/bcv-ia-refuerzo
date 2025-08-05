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
                    .map((update, index) => {
                        // Detectar si hay documento PDF
                        const document = (update.channel_post as any)?.document;
                        const isPDF = document && document.mime_type === 'application/pdf';
                        const fileName = document?.file_name;
                        const fileId = document?.file_id;

                        // Construir enlace al mensaje
                        const telegramUrl = `https://t.me/${username}/${update.channel_post!.message_id}`;

                        // Si es PDF, construir enlace de descarga (requiere otro endpoint para obtener el archivo real)
                        let pdfUrl = '';
                        if (isPDF && fileId) {
                            // El enlace directo al archivo requiere una llamada adicional a getFile y luego construir la URL de descarga.
                            // Aquí dejamos el fileId para que el frontend lo procese si lo desea.
                            pdfUrl = `https://api.telegram.org/file/bot${this.botToken}/${fileId}`;
                        }

                        return {
                            id: update.update_id,
                            channel: username,
                            text: isPDF
                                ? `📄 Documento PDF: ${fileName || 'Archivo'}`
                                : (update.channel_post!.text || update.channel_post!.caption || 'Mensaje sin texto'),
                            timestamp: new Date(update.channel_post!.date * 1000).toLocaleDateString('es-VE'),
                            messageId: update.channel_post!.message_id,
                            channelUsername: username,
                            telegramUrl: `https://t.me/${username}/${update.channel_post!.message_id}`,
                            url: isPDF && fileId ? `https://api.telegram.org/file/bot${this.botToken}/${fileId}` : undefined
                        };
                    });

                await this.cacheResponse(cacheKey, messages);
                return messages;
            } else {
                throw new Error(`Failed to get channel messages: ${response.data.description}`);
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error(`Failed to get messages from @${username}:`, error);
            return this.getFallbackMessages(username);
        }
    }

    /**
     * Get messages from multiple channels
     */
    public async getMultiChannelFeed(channelUsernames: string[], limit: number = 5): Promise<TelegramMessage[]> {
        const allMessages: TelegramMessage[] = [];
        
        for (const username of channelUsernames) {
            try {
                const messages = await this.getChannelMessages(username, Math.ceil(limit / channelUsernames.length));
                allMessages.push(...messages);
            } catch (error) {
                console.error(`Failed to get messages from ${username}:`, error);
            }
        }

        // Sort by timestamp (newest first) and limit results
        return allMessages
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    /**
     * Get real-time news from channels
     */
    public async getRealTimeNews(channelUsernames: string[], limit: number = 10): Promise<TelegramMessage[]> {
        return this.getMultiChannelFeed(channelUsernames, limit);
    }

    /**
     * Get fallback messages when API fails
     */
    private getFallbackMessages(username: string): TelegramMessage[] {
        const now = new Date();
        return [
            {
                id: Date.now(),
                channel: username,
                text: `Canal @${username} - Servicio temporalmente no disponible. Configurando conexión...`,
                timestamp: now.toLocaleDateString('es-VE'),
                messageId: 1,
                channelUsername: username,
                telegramUrl: `https://t.me/${username}`,
                url: `https://t.me/${username}`
            }
        ];
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
            console.warn('Failed to clear telegram cache:', error);
        }
    }
}

// Export singleton instance
export const telegramService = new TelegramService();
