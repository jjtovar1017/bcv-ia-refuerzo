import axios, { AxiosInstance } from 'axios';
import * as Sentry from '@sentry/react';
import { TranscriptionSource } from '../types';

export interface TranscriptionResult {
    text: string;
    confidence: number;
    language: string;
    duration?: number;
    words?: Array<{
        text: string;
        start: number;
        end: number;
        confidence: number;
    }>;
}

export class TranscriptionService {
    private assemblyAiClient: AxiosInstance;
    private readonly assemblyAiKey: string;
    private readonly cacheTimeout: number = 3600000; // 1 hour
    private readonly cachePrefix: string = 'transcription_cache_';

    constructor() {
        this.assemblyAiKey = import.meta.env?.VITE_ASSEMBLYAI_API_KEY || '';
        
        if (!this.assemblyAiKey || this.assemblyAiKey === 'tu_assemblyai_api_key') {
            console.warn('ASSEMBLYAI_API_KEY not configured or using placeholder. Service will use fallback mode.');
            this.assemblyAiKey = '';
        }

        // AssemblyAI client
        this.assemblyAiClient = axios.create({
            baseURL: 'https://api.assemblyai.com/v2',
            timeout: 300000, // 5 minutes for transcription
            headers: {
                'Authorization': this.assemblyAiKey,
                'Content-Type': 'application/json'
            }
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        this.assemblyAiClient.interceptors.request.use(
            (config) => {
                Sentry.addBreadcrumb({
                    category: 'transcription-api',
                    message: `Transcription API request: ${config.method?.toUpperCase()} ${config.url}`,
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

        this.assemblyAiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                Sentry.addBreadcrumb({
                    category: 'transcription-api',
                    message: `Transcription API error: ${error.message}`,
                    level: 'error',
                    data: { 
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        url: error.config?.url
                    }
                });
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
            console.warn('Failed to cache transcription response:', error);
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
            console.warn('Failed to get cached transcription response:', error);
            return null;
        }
    }

    /**
     * Transcribe audio file using AssemblyAI
     */
    public async transcribeAudio(source: TranscriptionSource): Promise<string> {
        // If no API key, return fallback immediately
        if (!this.assemblyAiKey) {
            console.warn('AssemblyAI API key not available, using fallback transcription');
            return this.getFallbackTranscription(source);
        }

        const cacheKey = source.type === 'file' 
            ? `file_${source.payload.name}_${source.payload.size}`
            : `url_${btoa(source.payload)}`;
        
        const cached = await this.getCachedResponse<string>(cacheKey);
        if (cached) return cached;

        try {
            if (source.type === 'file') {
                return await this.transcribeFile(source.payload, cacheKey);
            } else {
                return await this.transcribeUrl(source.payload, cacheKey);
            }
        } catch (error) {
            console.error('Transcription failed:', error);
            Sentry.captureException(error);
            return this.getFallbackTranscription(source);
        }
    }

    /**
     * Transcribe audio file
     */
    private async transcribeFile(file: File, cacheKey: string): Promise<string> {
        // Check file size (AssemblyAI limit is 5GB, but we'll limit to 100MB for performance)
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('El archivo es demasiado grande. Por favor, use archivos de menos de 100MB.');
        }

        // Upload file to AssemblyAI
        const uploadResponse = await this.uploadFile(file);
        const audioUrl = uploadResponse.upload_url;

        // Start transcription
        const transcriptResponse = await this.assemblyAiClient.post('/transcript', {
            audio_url: audioUrl,
            language_code: 'es', // Spanish
            punctuate: true,
            format_text: true,
            word_boost: ['BCV', 'Banco Central', 'Venezuela', 'bolívar', 'economía', 'inflación'],
            boost_param: 'high'
        });

        const transcriptId = transcriptResponse.data.id;

        // Poll for completion
        const result = await this.pollTranscriptionStatus(transcriptId);
        
        await this.cacheResponse(cacheKey, result.text);
        return result.text;
    }

    /**
     * Transcribe audio from URL
     */
    private async transcribeUrl(url: string, cacheKey: string): Promise<string> {
        // For YouTube URLs, we'll provide a simulated transcription
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const simulatedTranscription = this.getYouTubeSimulatedTranscription(url);
            await this.cacheResponse(cacheKey, simulatedTranscription);
            return simulatedTranscription;
        }

        // For other URLs, try to transcribe directly
        const transcriptResponse = await this.assemblyAiClient.post('/transcript', {
            audio_url: url,
            language_code: 'es',
            punctuate: true,
            format_text: true,
            word_boost: ['BCV', 'Banco Central', 'Venezuela', 'bolívar', 'economía', 'inflación'],
            boost_param: 'high'
        });

        const transcriptId = transcriptResponse.data.id;
        const result = await this.pollTranscriptionStatus(transcriptId);
        
        await this.cacheResponse(cacheKey, result.text);
        return result.text;
    }

    /**
     * Upload file to AssemblyAI
     */
    private async uploadFile(file: File): Promise<{ upload_url: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.assemblyAiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    }

    /**
     * Poll transcription status until complete
     */
    private async pollTranscriptionStatus(transcriptId: string): Promise<TranscriptionResult> {
        const maxAttempts = 60; // 5 minutes max (5 second intervals)
        let attempts = 0;

        while (attempts < maxAttempts) {
            const response = await this.assemblyAiClient.get(`/transcript/${transcriptId}`);
            const transcript = response.data;

            if (transcript.status === 'completed') {
                return {
                    text: transcript.text,
                    confidence: transcript.confidence,
                    language: 'es',
                    duration: transcript.audio_duration,
                    words: transcript.words
                };
            } else if (transcript.status === 'error') {
                throw new Error(`Transcription failed: ${transcript.error}`);
            }

            // Wait 5 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 5000));
            attempts++;
        }

        throw new Error('Transcription timed out');
    }

    /**
     * Get simulated transcription for YouTube videos
     */
    private getYouTubeSimulatedTranscription(url: string): string {
        const videoId = this.extractYouTubeVideoId(url);
        return `[TRANSCRIPCIÓN SIMULADA - YouTube]

Este es un ejemplo de transcripción generada automáticamente para el video de YouTube.

En una implementación real, aquí aparecería la transcripción completa del audio del video "${videoId}".

Temas que podrían incluirse:
• Análisis económico de Venezuela
• Políticas del Banco Central de Venezuela
• Situación del mercado cambiario
• Indicadores macroeconómicos
• Perspectivas de crecimiento económico

Nota: Para obtener transcripciones reales de YouTube, se requiere integración con la YouTube Data API v3 y procesamiento de audio especializado.

Duración estimada: 5-15 minutos
Confianza: Simulación (no aplicable)
Idioma detectado: Español (es)`;
    }

    /**
     * Extract YouTube video ID from URL
     */
    private extractYouTubeVideoId(url: string): string {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
        const match = url.match(regex);
        return match ? match[1] : 'video_desconocido';
    }

    /**
     * Get fallback transcription when service fails
     */
    private getFallbackTranscription(source: TranscriptionSource): string {
        const sourceType = source.type === 'file' ? 'archivo de audio' : 'URL';
        const sourceName = source.type === 'file' ? source.payload.name : source.payload;

        return `[SERVICIO DE TRANSCRIPCIÓN NO DISPONIBLE]

No se pudo procesar la transcripción del ${sourceType}: "${sourceName}"

Posibles causas:
• Clave de API de AssemblyAI no configurada
• Servicio temporalmente no disponible
• Formato de archivo no compatible
• Conexión de red interrumpida

Para obtener transcripciones reales:
1. Configure una clave válida de AssemblyAI
2. Verifique que el archivo sea de audio/video compatible
3. Asegúrese de tener conexión a internet estable

Formatos soportados: MP3, MP4, WAV, M4A, FLAC, OGG, WEBM, etc.
Tamaño máximo: 100MB por archivo

Nota: Este es un mensaje de respaldo. La transcripción real aparecería aquí una vez configurado el servicio.`;
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
            console.warn('Failed to clear transcription cache:', error);
        }
    }

    /**
     * Get supported file types
     */
    public getSupportedFileTypes(): string[] {
        return [
            'audio/mpeg', 'audio/mp3',
            'audio/wav', 'audio/wave',
            'audio/m4a', 'audio/mp4',
            'audio/flac',
            'audio/ogg', 'audio/oga',
            'audio/webm',
            'video/mp4', 'video/webm',
            'video/quicktime', 'video/x-msvideo'
        ];
    }

    /**
     * Check if file type is supported
     */
    public isFileTypeSupported(file: File): boolean {
        return this.getSupportedFileTypes().includes(file.type);
    }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
