export class SubscriptionModel {
    constructor() {
        this.storageKey = 'subscription_status';
    }

    async checkSubscription() {
        const status = await chrome.storage.sync.get(this.storageKey);
        return status[this.storageKey] || 'free';
    }

    async upgradeSubscription() {
        // Implement your payment/upgrade logic here
        await chrome.storage.sync.set({
            [this.storageKey]: 'pro'
        });
    }
} 