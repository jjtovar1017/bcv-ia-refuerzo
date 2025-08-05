/**
 * PWAService - Gestión de Progressive Web App
 * Maneja instalación, actualizaciones y funcionalidades offline
 */
export class PWAService {
    private static instance: PWAService;
    private registration: ServiceWorkerRegistration | null = null;
    private deferredPrompt: any = null;
    private isInstalled: boolean = false;
    private updateAvailable: boolean = false;

    static getInstance(): PWAService {
        if (!PWAService.instance) {
            PWAService.instance = new PWAService();
        }
        return PWAService.instance;
    }

    /**
     * Inicializar PWA Service
     */
    async initialize(): Promise<void> {
        try {
            // Registrar Service Worker
            await this.registerServiceWorker();
            
            // Configurar eventos de instalación
            this.setupInstallPrompt();
            
            // Verificar si ya está instalado
            this.checkInstallStatus();
            
            // Configurar notificaciones push
            await this.setupPushNotifications();
            
            console.log('PWA Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PWA Service:', error);
        }
    }

    /**
     * Registrar Service Worker
     */
    private async registerServiceWorker(): Promise<void> {
        if ('serviceWorker' in navigator) {
            try {
                this.registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('Service Worker registered successfully');

                // Escuchar actualizaciones
                this.registration.addEventListener('updatefound', () => {
                    const newWorker = this.registration!.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.updateAvailable = true;
                                this.notifyUpdateAvailable();
                            }
                        });
                    }
                });

                // Escuchar mensajes del Service Worker
                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

            } catch (error) {
                console.error('Service Worker registration failed:', error);
                throw error;
            }
        } else {
            throw new Error('Service Workers not supported');
        }
    }

    /**
     * Configurar prompt de instalación
     */
    private setupInstallPrompt(): void {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevenir el prompt automático
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Mostrar botón de instalación personalizado
            this.showInstallButton();
        });

        // Detectar cuando la app se instala
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.deferredPrompt = null;
            this.hideInstallButton();
            console.log('PWA installed successfully');
        });
    }

    /**
     * Verificar estado de instalación
     */
    private checkInstallStatus(): void {
        // Verificar si se ejecuta como PWA instalada
        if (window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone === true) {
            this.isInstalled = true;
        }

        // Verificar si está en la pantalla de inicio (iOS)
        if ((window.navigator as any).standalone) {
            this.isInstalled = true;
        }
    }

    /**
     * Configurar notificaciones push
     */
    private async setupPushNotifications(): Promise<void> {
        if (!('Notification' in window) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return;
        }

        try {
            // Verificar permisos existentes
            if (Notification.permission === 'granted') {
                await this.subscribeToPush();
            }
        } catch (error) {
            console.error('Failed to setup push notifications:', error);
        }
    }

    /**
     * Solicitar permisos de notificación
     */
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                await this.subscribeToPush();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }

    /**
     * Suscribirse a notificaciones push
     */
    private async subscribeToPush(): Promise<void> {
        if (!this.registration) {
            throw new Error('Service Worker not registered');
        }

        try {
            const subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(
                    process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
                )
            });

            // Enviar suscripción al servidor
            await this.sendSubscriptionToServer(subscription);
            
            console.log('Push subscription successful');
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    }

    /**
     * Enviar suscripción al servidor
     */
    private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            const response = await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });

            if (!response.ok) {
                throw new Error(`Failed to send subscription: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to send subscription to server:', error);
        }
    }

    /**
     * Mostrar prompt de instalación
     */
    async showInstallPrompt(): Promise<boolean> {
        if (!this.deferredPrompt) {
            return false;
        }

        try {
            // Mostrar el prompt
            this.deferredPrompt.prompt();
            
            // Esperar la respuesta del usuario
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
                return true;
            } else {
                console.log('User dismissed the install prompt');
                return false;
            }
        } catch (error) {
            console.error('Failed to show install prompt:', error);
            return false;
        } finally {
            this.deferredPrompt = null;
        }
    }

    /**
     * Aplicar actualización disponible
     */
    async applyUpdate(): Promise<void> {
        if (!this.registration || !this.updateAvailable) {
            return;
        }

        try {
            const waitingWorker = this.registration.waiting;
            if (waitingWorker) {
                // Enviar mensaje para activar el nuevo Service Worker
                waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                
                // Recargar la página cuando el nuevo SW tome control
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });
            }
        } catch (error) {
            console.error('Failed to apply update:', error);
        }
    }

    /**
     * Verificar conectividad
     */
    isOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Configurar listeners de conectividad
     */
    setupConnectivityListeners(
        onOnline?: () => void,
        onOffline?: () => void
    ): void {
        window.addEventListener('online', () => {
            console.log('App is online');
            onOnline?.();
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
            onOffline?.();
        });
    }

    /**
     * Obtener información de la red
     */
    getNetworkInfo(): {
        online: boolean;
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
    } {
        const connection = (navigator as any).connection || 
                          (navigator as any).mozConnection || 
                          (navigator as any).webkitConnection;

        return {
            online: navigator.onLine,
            effectiveType: connection?.effectiveType,
            downlink: connection?.downlink,
            rtt: connection?.rtt
        };
    }

    /**
     * Manejar mensajes del Service Worker
     */
    private handleServiceWorkerMessage(event: MessageEvent): void {
        const { type, payload } = event.data;

        switch (type) {
            case 'CACHE_UPDATED':
                console.log('Cache updated:', payload);
                break;
            case 'BACKGROUND_SYNC':
                console.log('Background sync completed:', payload);
                break;
            case 'PUSH_RECEIVED':
                console.log('Push notification received:', payload);
                break;
            default:
                console.log('Unknown message from SW:', event.data);
        }
    }

    /**
     * Enviar mensaje al Service Worker
     */
    async sendMessageToSW(message: any): Promise<void> {
        if (!this.registration?.active) {
            throw new Error('No active Service Worker');
        }

        this.registration.active.postMessage(message);
    }

    /**
     * Limpiar cache manualmente
     */
    async clearCache(): Promise<void> {
        try {
            await this.sendMessageToSW({ type: 'CLEAR_CACHE' });
            console.log('Cache cleared successfully');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    /**
     * Obtener estadísticas de cache
     */
    async getCacheStats(): Promise<any> {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    usagePercentage: estimate.quota ? (estimate.usage! / estimate.quota * 100) : 0
                };
            }
        } catch (error) {
            console.error('Failed to get cache stats:', error);
        }
        return null;
    }

    /**
     * Mostrar botón de instalación
     */
    private showInstallButton(): void {
        // Emitir evento personalizado para que la UI muestre el botón
        window.dispatchEvent(new CustomEvent('pwa-install-available'));
    }

    /**
     * Ocultar botón de instalación
     */
    private hideInstallButton(): void {
        // Emitir evento personalizado para que la UI oculte el botón
        window.dispatchEvent(new CustomEvent('pwa-install-completed'));
    }

    /**
     * Notificar actualización disponible
     */
    private notifyUpdateAvailable(): void {
        // Emitir evento personalizado para que la UI muestre la notificación
        window.dispatchEvent(new CustomEvent('pwa-update-available'));
    }

    /**
     * Convertir VAPID key
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Obtener estado del PWA
     */
    getStatus(): {
        isInstalled: boolean;
        updateAvailable: boolean;
        canInstall: boolean;
        isOnline: boolean;
        hasNotificationPermission: boolean;
    } {
        return {
            isInstalled: this.isInstalled,
            updateAvailable: this.updateAvailable,
            canInstall: !!this.deferredPrompt,
            isOnline: navigator.onLine,
            hasNotificationPermission: Notification.permission === 'granted'
        };
    }
}

// Exportar instancia singleton
export const pwaService = PWAService.getInstance();