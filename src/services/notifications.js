class NotificationService {
  async initialize() {
    const permission = await this.requestPermission();
    return permission === 'granted';
  }

  async requestPermission() {
    return await chrome.notifications.requestPermission();
  }

  async sendNotification(title, message, icon = 'icons/jarvis-48.png') {
    return await chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL(icon),
      title,
      message
    });
  }

  async schedulePromotion(promotion) {
    // Store promotion in chrome.storage for background script to process
    const promotions = await chrome.storage.local.get(['scheduledPromotions']);
    const updatedPromotions = [...(promotions.scheduledPromotions || []), promotion];
    await chrome.storage.local.set({ scheduledPromotions: updatedPromotions });
  }
}

export const notificationService = new NotificationService(); 