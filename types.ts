
export interface Metric {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'increase' | 'decrease';
}

export enum AIModel {
    DeepSeek = 'deepseek',
    Mistral = 'mistral',
    Gemini = 'gemini',
}

export interface AIModelOption {
    id: AIModel;
    name: string;
    description: string;
}

export interface TelegramMessage {
    id: number;
    channel: string;
    text: string;
    timestamp: string;
}

export interface NavigationItem {
    name: string;
    path: string;
    icon: (className: string) => React.ReactNode;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface EconomicNewsResult {
    summary: string;
    sources: GroundingSource[];
}

export type TranscriptionSource = { type: 'file'; payload: File } | { type: 'url'; payload: string };

export type NewsSearchType = 'economic' | 'mixed' | 'threat_alert';
