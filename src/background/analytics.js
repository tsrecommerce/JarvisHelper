class AnalyticsManager {
    constructor() {
        this.API_BASE_URL = 'YOUR_BACKEND_API_URL';
        this.sessionId = this.generateSessionId();
        this.initializeAnalytics();
    }

    generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async initializeAnalytics() {
        // Initialize basic user properties
        const userProfile = await chrome.storage.sync.get('user_profile');
        this.userId = userProfile?.id || 'anonymous';
    }

    async trackEvent(eventName, properties = {}) {
        try {
            const token = await authManager.getStoredToken();
            const eventData = {
                event: eventName,
                properties: {
                    ...properties,
                    userId: this.userId,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString(),
                    platform: 'chrome_extension',
                    version: chrome.runtime.getManifest().version
                }
            };

            await fetch(`${this.API_BASE_URL}/analytics/track`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }

    async trackPageView(pageName) {
        await this.trackEvent('page_view', { page: pageName });
    }

    async trackFeatureUsage(featureName) {
        await this.trackEvent('feature_used', { feature: featureName });
    }
}
