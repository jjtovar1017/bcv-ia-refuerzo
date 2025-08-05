import React from 'react';
import { AIModel, NavigationItem, AIModelOption } from './types';
import { HomeIcon, DocumentTextIcon, MicrophoneIcon, BellIcon, Cog6ToothIcon, MapIcon, ChartBarIcon, ExclamationTriangleIcon } from './components/icons/Icons';

export const NAVIGATION_ITEMS: NavigationItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: (className) => React.createElement(HomeIcon, { className }) },
    { name: 'Generar Contenido', path: '/generador', icon: (className) => React.createElement(DocumentTextIcon, { className }) },
    { name: 'Transcripción', path: '/transcriptor', icon: (className) => React.createElement(MicrophoneIcon, { className }) },
    { name: 'Monitoreo Telegram', path: '/monitoreo', icon: (className) => React.createElement(BellIcon, { className }) },
    { name: 'Alertas Económicas', path: '/alertas', icon: (className) => React.createElement(ExclamationTriangleIcon, { className }) },
    { name: 'Análisis Institucional', path: '/analisis', icon: (className) => React.createElement(ChartBarIcon, { className }) },
    { name: 'Configuración', path: '/configuracion', icon: (className) => React.createElement(Cog6ToothIcon, { className }) },
];

export const AI_MODELS: AIModelOption[] = [
    { id: AIModel.DeepSeek, name: 'DeepSeek-R1 (Principal)', description: 'Modelo principal de IA para análisis avanzado, procesamiento de rutas y generación de informes.' },
    { id: AIModel.Gemini, name: 'Gemini (Respaldo)', description: 'Modelo de respaldo para funciones básicas cuando DeepSeek no esté disponible.' },
    { id: AIModel.Mistral, name: 'Mistral (En desarrollo)', description: 'Modelo en desarrollo para futuras integraciones.' },
];

export const CONTENT_TYPES: string[] = [
    "Comunicado de Prensa",
    "Informe Económico Semanal",
    "Análisis de Coyuntura",
    "Discurso Oficial",
    "Resumen para Redes Sociales"
];