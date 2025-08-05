import React, { useEffect, useState } from 'react';
import { pwaService } from '../../services/pwaService';
import { Notification as NotificationType } from '../../types';

interface NotificationManagerProps {
    children: React.ReactNode;
}

interface NotificationState {
    notifications: NotificationType[];
    unreadCount: number;
    isPermissionGranted: boolean;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
    const [state, setState] = useState<NotificationState>({
        notifications: [],
        unreadCount: 0,
        isPermissionGranted: false
    });

    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        initializeNotifications();
        setupEventListeners();

        return () => {
            cleanup();
        };
    }, []);

    const initializeNotifications = async () => {
        const hasPermission = Notification.permission === 'granted';
        // TODO: Fetch existing notifications from a service
        const notifications: NotificationType[] = []; 
        const unreadCount = notifications.filter(notification => !notification.read).length;

        setState(prev => ({
            ...prev,
            notifications,
            unreadCount,
            isPermissionGranted: hasPermission
        }));
    };

    const setupEventListeners = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    const cleanup = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    const handleNewNotification = (notification: NotificationType) => {
        setState(prev => ({
            ...prev,
            notifications: [notification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1
        }));

        if (state.isPermissionGranted) {
            showSystemNotification(notification);
        }

        showInAppNotification(notification);
        updateAppBadge(state.unreadCount + 1);
    };

    const showSystemNotification = (notification: NotificationType) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const title = notification.title;
        const body = notification.body;
        const icon = '/icons/icon-192x192.png';

        const notificationOptions: NotificationOptions = {
            body,
            icon,
            badge: '/icons/badge-72x72.png',
            tag: `notification-${notification.id}`,
            requireInteraction: notification.priority === 'high',
            data: {
                notificationId: notification.id,
            }
        };

        const newNotification = new Notification(title, notificationOptions);

        newNotification.onclick = () => {
            window.focus();
            handleNotificationClick(notification);
            newNotification.close();
        };

        if (notification.priority !== 'high') {
            setTimeout(() => {
                newNotification.close();
            }, 10000);
        }
    };

    const showInAppNotification = (notification: NotificationType) => {
        const notificationEl = document.createElement('div');
        notificationEl.className = `
            fixed top-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-lg border-l-4 
            ${notification.priority === 'high' ? 'border-red-500' : 
              notification.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'}
            transform translate-x-full transition-transform duration-300 ease-out
        `;

        notificationEl.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="ml-3 flex-1">
                        <p class="text-sm font-medium text-gray-900">
                            ${notification.title}
                        </p>
                        <p class="text-sm text-gray-500 mt-1">
                            ${notification.body}
                        </p>
                        <div class="mt-2 flex space-x-2">
                            <button class="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" onclick="handleInAppNotificationClick('${notification.id}')">
                                Ver
                            </button>
                            <button class="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400" onclick="dismissInAppNotification(this)">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(notificationEl);

        setTimeout(() => {
            notificationEl.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            dismissInAppNotificationElement(notificationEl);
        }, 8000);

        (window as any).handleInAppNotificationClick = (notificationId: string) => {
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification) {
                handleNotificationClick(notification);
            }
            dismissInAppNotificationElement(notificationEl);
        };

        (window as any).dismissInAppNotification = (button: HTMLElement) => {
            const notification = button.closest('div[class*="fixed"]') as HTMLElement;
            dismissInAppNotificationElement(notification);
        };
    };

    const dismissInAppNotificationElement = (element: HTMLElement) => {
        element.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
            const { notificationId } = event.data.payload;
            const notification = state.notifications.find(n => n.id === notificationId);
            if (notification) {
                handleNotificationClick(notification);
            }
        }
    };

    const handleVisibilityChange = () => {
        if (!document.hidden && state.unreadCount > 0) {
            updateAppBadge(0);
        }
    };

    const handleNotificationClick = (notification: NotificationType) => {
        acknowledgeNotification(notification.id);

        const event = new CustomEvent('navigate-to-notification', {
            detail: {
                notificationId: notification.id,
            }
        });
        window.dispatchEvent(event);
    };

    const acknowledgeNotification = (notificationId: string) => {
        setState(prev => ({
            ...prev,
            notifications: prev.notifications.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, read: true }
                    : notification
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1)
        }));

        updateAppBadge(Math.max(0, state.unreadCount - 1));
    };

    const clearAllNotifications = () => {
        setState(prev => ({
            ...prev,
            notifications: [],
            unreadCount: 0
        }));
        updateAppBadge(0);
    };

    const updateAppBadge = async (count: number) => {
        try {
            if ('setAppBadge' in navigator) {
                if (count > 0) {
                    await (navigator as any).setAppBadge(count);
                } else {
                    await (navigator as any).clearAppBadge();
                }
            }
        } catch (error) {
            console.warn('Failed to update app badge:', error);
        }
    };

    const requestNotificationPermission = async () => {
        try {
            const granted = await pwaService.requestNotificationPermission();
            setState(prev => ({
                ...prev,
                isPermissionGranted: granted
            }));
            return granted;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    };

    const formatNotificationTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        
        return date.toLocaleDateString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    };

    return (
        <>
            {children}
            
            <div className="fixed top-4 right-4 z-40">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718A8.966 8.966 0 003 12a9 9 0 0118 0 8.966 8.966 0 00-1.868 7.718" />
                    </svg>
                    
                    {state.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {state.unreadCount > 99 ? '99+' : state.unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {showNotifications && (
                <div className="fixed top-16 right-4 w-80 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-30 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                                Notificaciones
                            </h3>
                            {state.notifications.length > 0 && (
                                <button
                                    onClick={clearAllNotifications}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Limpiar todo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {state.notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718A8.966 8.966 0 003 12a9 9 0 0118 0 8.966 8.966 0 00-1.868 7.718" />
                                </svg>
                                <p>No hay notificaciones</p>
                            </div>
                        ) : (
                            state.notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                        !notification.read ? 'bg-blue-50' : ''
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {notification.body}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatNotificationTime(notification.timestamp)}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="flex-shrink-0">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {!state.isPermissionGranted && (
                        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-yellow-800">
                                        Habilita las notificaciones para recibir alertas
                                    </p>
                                </div>
                                <button
                                    onClick={requestNotificationPermission}
                                    className="ml-3 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                                >
                                    Habilitar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showNotifications && (
                <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowNotifications(false)}
                />
            )}
        </>
    );
};

export default NotificationManager;