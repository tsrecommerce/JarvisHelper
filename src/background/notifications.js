class NotificationManager {
    constructor() {
        this.notificationQueue = [];
        this.initialized = false;
    }

    async initialize() {
        try {
            // Request notification permissions if not already granted
            const permission = await this.requestPermission();
            this.initialized = permission === 'granted';
            return this.initialized;
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
            return false;
        }
    }

    async requestPermission() {
        return new Promise((resolve) => {
            chrome.permissions.request({
                permissions: ['notifications']
            }, (granted) => {
                resolve(granted ? 'granted' : 'denied');
            });
        });
    }

    async scheduleNotification(title, message, scheduledTime, options = {}) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const notification = {
                id: crypto.randomUUID(),
                title,
                message,
                scheduledTime: new Date(scheduledTime).getTime(),
                options: {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
                    priority: 1,
                    ...options
                }
            };

            // Store in chrome.storage for persistence
            await chrome.storage.local.get(['scheduledNotifications'], (result) => {
                const notifications = result.scheduledNotifications || [];
                notifications.push(notification);
                chrome.storage.local.set({ scheduledNotifications: notifications });
            });

            // Schedule the notification
            this.scheduleNotificationDelivery(notification);

            return notification.id;
        } catch (error) {
            console.error('Failed to schedule notification:', error);
            throw error;
        }
    }

    async scheduleNotificationDelivery(notification) {
        const now = Date.now();
        const delay = Math.max(0, notification.scheduledTime - now);

        setTimeout(() => {
            this.showNotification(notification);
        }, delay);
    }

    async showNotification(notification) {
        try {
            await chrome.notifications.create(notification.id, {
                type: 'basic',
                iconUrl: notification.options.iconUrl,
                title: notification.title,
                message: notification.message,
                priority: notification.options.priority
            });

            // Remove from storage after showing
            this.removeScheduledNotification(notification.id);
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    async removeScheduledNotification(notificationId) {
        await chrome.storage.local.get(['scheduledNotifications'], (result) => {
            const notifications = result.scheduledNotifications || [];
            const updatedNotifications = notifications.filter(n => n.id !== notificationId);
            chrome.storage.local.set({ scheduledNotifications: updatedNotifications });
        });
    }

    async clearAllNotifications() {
        try {
            await chrome.notifications.clear();
            await chrome.storage.local.remove(['scheduledNotifications']);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    }
}

// Export the NotificationManager class
export { NotificationManager };
