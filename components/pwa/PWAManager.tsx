import React, { useEffect, useState } from 'react';
import { pwaService } from '../../services/pwaService';

interface PWAStatus {
    isInstalled: boolean;
    updateAvailable: boolean;
    canInstall: boolean;
    isOnline: boolean;
    hasNotificationPermission: boolean;
}

interface PWAManagerProps {
    children: React.ReactNode;
}

export const PWAManager: React.FC<PWAManagerProps> = ({ children }) => {
    const [status, setStatus] = useState<PWAStatus>({
        isInstalled: false,
        updateAvailable: false,
        canInstall: false,
        isOnline: true,
        hasNotificationPermission: false
    });

    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Inicializar PWA Service
        initializePWA();

        // Configurar event listeners
        setupEventListeners();

        // Cleanup
        return () => {
            removeEventListeners();
        };
    }, []);

    const initializePWA = async () => {
        try {
            await pwaService.initialize();
            updateStatus();
        } catch (error) {
            console.error('Failed to initialize PWA:', error);
        }
    };

    const setupEventListeners = () => {
        // PWA install available
        window.addEventListener('pwa-install-available', handleInstallAvailable);
        
        // PWA update available
        window.addEventListener('pwa-update-available', handleUpdateAvailable);
        
        // PWA installed
        window.addEventListener('pwa-install-completed', handleInstallCompleted);
        
        // Connectivity changes
        pwaService.setupConnectivityListeners(
            handleOnline,
            handleOffline
        );
    };

    const removeEventListeners = () => {
        window.removeEventListener('pwa-install-available', handleInstallAvailable);
        window.removeEventListener('pwa-update-available', handleUpdateAvailable);
        window.removeEventListener('pwa-install-completed', handleInstallCompleted);
    };

    const updateStatus = () => {
        const newStatus = pwaService.getStatus();
        setStatus(newStatus);
        setIsOffline(!newStatus.isOnline);
    };

    const handleInstallAvailable = () => {
        setShowInstallPrompt(true);
        updateStatus();
    };

    const handleUpdateAvailable = () => {
        setShowUpdatePrompt(true);
        updateStatus();
    };

    const handleInstallCompleted = () => {
        setShowInstallPrompt(false);
        updateStatus();
    };

    const handleOnline = () => {
        setIsOffline(false);
        updateStatus();
    };

    const handleOffline = () => {
        setIsOffline(true);
        updateStatus();
    };

    const handleInstall = async () => {
        try {
            const installed = await pwaService.showInstallPrompt();
            if (installed) {
                setShowInstallPrompt(false);
            }
        } catch (error) {
            console.error('Failed to install PWA:', error);
        }
    };

    const handleUpdate = async () => {
        try {
            await pwaService.applyUpdate();
            setShowUpdatePrompt(false);
        } catch (error) {
            console.error('Failed to apply update:', error);
        }
    };

    const handleRequestNotifications = async () => {
        try {
            const granted = await pwaService.requestNotificationPermission();
            if (granted) {
                updateStatus();
            }
        } catch (error) {
            console.error('Failed to request notifications:', error);
        }
    };

    const dismissInstallPrompt = () => {
        setShowInstallPrompt(false);
    };

    const dismissUpdatePrompt = () => {
        setShowUpdatePrompt(false);
    };

    return (
        <>
            {children}
            
            {/* Offline Indicator */}
            {isOffline && (
                <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 px-4 text-sm z-50">
                    <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                        </svg>
                        <span>Sin conexión - Trabajando en modo offline</span>
                    </div>
                </div>
            )}

            {/* Install Prompt */}
            {showInstallPrompt && (
                <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">
                                        Instalar Aplicación
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Accede más rápido desde tu pantalla de inicio
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                            <button
                                onClick={handleInstall}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                                Instalar
                            </button>
                            <button
                                onClick={dismissInstallPrompt}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Prompt */}
            {showUpdatePrompt && (
                <div className="fixed top-4 left-4 right-4 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium">Nueva versión disponible</h3>
                                <p className="text-xs opacity-90">Actualiza para obtener las últimas mejoras</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleUpdate}
                                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                                Actualizar
                            </button>
                            <button
                                onClick={dismissUpdatePrompt}
                                className="text-white/70 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Permission Prompt */}
            {status.isInstalled && !status.hasNotificationPermission && (
                <div className="fixed bottom-20 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 z-30">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718A8.966 8.966 0 003 12a9 9 0 0118 0 8.966 8.966 0 00-1.868 7.718" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Habilitar Notificaciones
                                </h3>
                                <p className="text-sm text-yellow-700">
                                    Recibe alertas de geofencing y actualizaciones importantes
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRequestNotifications}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-yellow-700 transition-colors"
                        >
                            Habilitar
                        </button>
                    </div>
                </div>
            )}

            {/* PWA Status Debug (only in development) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs z-20 max-w-xs">
                    <div className="font-medium mb-2">PWA Status</div>
                    <div className="space-y-1">
                        <div>Instalada: {status.isInstalled ? '✅' : '❌'}</div>
                        <div>Puede instalar: {status.canInstall ? '✅' : '❌'}</div>
                        <div>Actualización: {status.updateAvailable ? '🔄' : '✅'}</div>
                        <div>Online: {status.isOnline ? '🌐' : '📴'}</div>
                        <div>Notificaciones: {status.hasNotificationPermission ? '🔔' : '🔕'}</div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PWAManager;