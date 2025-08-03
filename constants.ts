import React from 'react';
import { AIModel, NavigationItem, AIModelOption } from './types';
import { HomeIcon, DocumentTextIcon, MicrophoneIcon, BellIcon, Cog6ToothIcon } from './components/icons/Icons';

export const NAVIGATION_ITEMS: NavigationItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: (className) => React.createElement(HomeIcon, { className }) },
    { name: 'Generar Contenido', path: '/generador', icon: (className) => React.createElement(DocumentTextIcon, { className }) },
    { name: 'Transcripción', path: '/transcriptor', icon: (className) => React.createElement(MicrophoneIcon, { className }) },
    { name: 'Monitoreo Telegram', path: '/monitoreo', icon: (className) => React.createElement(BellIcon, { className }) },
    { name: 'Configuración', path: '/configuracion', icon: (className) => React.createElement(Cog6ToothIcon, { className }) },
];

export const AI_MODELS: AIModelOption[] = [
    { id: AIModel.DeepSeek, name: 'DeepSeek (Precisión)', description: 'Modelo avanzado para análisis y generación de contenido detallado.' },
    { id: AIModel.Mistral, name: 'Mistral (Rapidez)', description: 'Ideal para tareas rápidas, resúmenes y borradores.' },
    { id: AIModel.Gemini, name: 'Gemini (Respaldo)', description: 'Modelo de Google versátil y gratuito para diversas tareas.' },
];

export const CONTENT_TYPES: string[] = [
    "Comunicado de Prensa",
    "Informe Económico Semanal",
    "Análisis de Coyuntura",
    "Discurso Oficial",
    "Resumen para Redes Sociales"
];