export class SubscriptionService {
    #SUBSCRIPTION_KEY = 'subscription_status';
    #PLANS = {
        FREE: 'free',
        PRO: 'pro'
    };

    constructor() {
    }

    async getCurrentPlan() {
        try {
            const data = await chrome.storage.sync.get(this.#SUBSCRIPTION_KEY);
            return data[this.#SUBSCRIPTION_KEY] || this.#PLANS.FREE;
        } catch (error) {
            console.error('Error getting subscription status:', error);
            return this.#PLANS.FREE;
        }
    }

    async upgradeToPro(paymentDetails) {
        try {
            // Simulate payment processing
            const success = await this.#processPayment(paymentDetails);
            if (success) {
                await this.#updateSubscriptionStatus(this.#PLANS.PRO);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Upgrade failed:', error);
            throw error;
        }
    }

    // Remove 'private' keyword and use # for private methods
    async #processPayment(details) {
        // Placeholder for payment processing
        return new Promise((resolve) => {
            setTimeout(() => resolve(true), 1000);
        });
    }

    async #updateSubscriptionStatus(status) {
        try {
            await chrome.storage.sync.set({
                [this.#SUBSCRIPTION_KEY]: status
            });
        } catch (error) {
            console.error('Error updating subscription status:', error);
            throw error;
        }
    }

    async isPro() {
        const plan = await this.getCurrentPlan();
        return plan === this.#PLANS.PRO;
    }
} 