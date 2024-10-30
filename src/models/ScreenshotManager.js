export class ScreenshotManager {
    constructor() {
        this.screenshots = [];
        this.loadScreenshots();
    }

    async loadScreenshots() {
        const data = await chrome.storage.local.get('screenshots');
        this.screenshots = data.screenshots || [];
        return this.screenshots;
    }

    async saveScreenshot(screenshot) {
        this.screenshots.push({
            id: Date.now(),
            ...screenshot,
            date: new Date().toISOString()
        });
        await this.persistScreenshots();
        return screenshot;
    }

    async deleteScreenshot(id) {
        this.screenshots = this.screenshots.filter(s => s.id !== id);
        await this.persistScreenshots();
    }

    async updateScreenshot(id, updates) {
        const index = this.screenshots.findIndex(s => s.id === id);
        if (index !== -1) {
            this.screenshots[index] = {
                ...this.screenshots[index],
                ...updates
            };
            await this.persistScreenshots();
            return this.screenshots[index];
        }
        return null;
    }

    async persistScreenshots() {
        await chrome.storage.local.set({ screenshots: this.screenshots });
    }

    getScreenshot(id) {
        return this.screenshots.find(s => s.id === id);
    }

    getAllScreenshots() {
        return [...this.screenshots];
    }
} 