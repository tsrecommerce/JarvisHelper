class SubscriptionManager {
    constructor() {
        this.plans = {
            free: {
                id: 'free',
                name: 'Free',
                price: 0,
                features: ['Basic Screen Capture', 'Basic Todo List'],
                limits: {
                    capturesPerDay: 10,
                    storageInMB: 100
                }
            },
            pro: {
                id: 'pro',
                name: 'Pro',
                price: 9.99,
                features: [
                    'Unlimited Screen Capture',
                    'Video Recording',
                    'Advanced Todo List',
                    'Cloud Storage',
                    'Priority Support'
                ],
                limits: {
                    capturesPerDay: -1, // unlimited
                    storageInMB: 1024 // 1GB
                }
            },
            enterprise: {
                id: 'enterprise',
                name: 'Enterprise',
                price: 29.99,
                features: [
                    'All Pro Features',
                    'Team Management',
                    'Custom Branding',
                    'API Access',
                    'Dedicated Support'
                ],
                limits: {
                    capturesPerDay: -1,
                    storageInMB: 5120 // 5GB
                }
            }
        };
    }

    async getCurrentPlan() {
        try {
            const { subscription } = await chrome.storage.sync.get(['subscription']);
            return subscription?.planId || 'free';
        } catch (error) {
            console.error('Failed to get current plan:', error);
            return 'free';
        }
    }

    async getPlanDetails(planId = 'free') {
        return this.plans[planId] || this.plans.free;
    }

    async checkFeatureAccess(featureName) {
        const currentPlanId = await this.getCurrentPlan();
        const plan = await this.getPlanDetails(currentPlanId);
        return plan.features.includes(featureName);
    }

    async initializePayment(planId) {
        try {
            // Get user info
            const { user } = await chrome.storage.sync.get(['user']);
            if (!user) {
                throw new Error('User must be logged in to purchase subscription');
            }

            // Create checkout session
            const response = await fetch('YOUR_BACKEND_API/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId,
                    userId: user.id,
                    email: user.email
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json();
            return session.url;
        } catch (error) {
            console.error('Payment initialization failed:', error);
            throw error;
        }
    }

    async updateSubscription(planId, subscriptionData) {
        try {
            await chrome.storage.sync.set({
                subscription: {
                    planId,
                    ...subscriptionData,
                    updatedAt: new Date().toISOString()
                }
            });

            // Notify any listeners about the subscription change
            chrome.runtime.sendMessage({
                type: 'SUBSCRIPTION_UPDATED',
                payload: { planId, ...subscriptionData }
            });

            return true;
        } catch (error) {
            console.error('Failed to update subscription:', error);
            throw error;
        }
    }

    async checkUsageLimit(limitType) {
        try {
            const currentPlanId = await this.getCurrentPlan();
            const plan = await this.getPlanDetails(currentPlanId);
            const limit = plan.limits[limitType];

            if (limit === -1) return true; // unlimited

            // Get current usage
            const { usage = {} } = await chrome.storage.local.get(['usage']);
            const currentUsage = usage[limitType] || 0;

            return currentUsage < limit;
        } catch (error) {
            console.error('Failed to check usage limit:', error);
            return false;
        }
    }

    async incrementUsage(limitType) {
        try {
            const { usage = {} } = await chrome.storage.local.get(['usage']);
            usage[limitType] = (usage[limitType] || 0) + 1;
            await chrome.storage.local.set({ usage });
        } catch (error) {
            console.error('Failed to increment usage:', error);
        }
    }
}

// Export the SubscriptionManager class
export { SubscriptionManager };
