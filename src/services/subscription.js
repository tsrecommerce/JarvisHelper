class SubscriptionService {
  constructor() {
    this.plans = {
      free: {
        name: 'Free',
        features: ['Screen Capture', 'Todo List'],
        price: 0
      },
      pro: {
        name: 'Pro',
        features: ['Screen Capture', 'Video Recording', 'Todo List', 'AI Help'],
        price: 9.99
      },
      enterprise: {
        name: 'Enterprise',
        features: ['All Features', 'Priority Support', 'Team Management'],
        price: 29.99
      }
    };
  }

  async getCurrentPlan() {
    const { subscription } = await chrome.storage.sync.get(['subscription']);
    return subscription || 'free';
  }

  async initializePayment(planId) {
    // Implement your payment gateway integration here
    // Example using Stripe:
    try {
      const response = await fetch('YOUR_BACKEND_API/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: authService.user.id
        })
      });
      
      const session = await response.json();
      return session.url;
    } catch (error) {
      console.error('Payment initialization failed:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService(); 