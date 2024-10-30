export class ScreenshotsPanel {
    constructor(manager) {
        this.manager = manager;
        this.panel = this.createPanel();
        this.setupEventListeners();
    }

    createPanel() {
        const panel = document.createElement('div');
        panel.className = 'screenshots-panel';
        panel.innerHTML = `
            <div class="screenshots-header">
                Screenshots
            </div>
            <div class="screenshots-list"></div>
        `;
        return panel;
    }

    async render() {
        const screenshots = await this.manager.loadScreenshots();
        const list = this.panel.querySelector('.screenshots-list');
        list.innerHTML = screenshots.map(screenshot => this.createScreenshotItem(screenshot)).join('');
    }

    createScreenshotItem(screenshot) {
        return `
            <div class="screenshot-item" data-id="${screenshot.id}">
                <img src="${screenshot.image}" class="screenshot-preview" />
                <div class="screenshot-info">
                    <div class="screenshot-date">
                        ${new Date(screenshot.date).toLocaleString()}
                    </div>
                    <div class="screenshot-notes">
                        ${screenshot.notes || ''}
                    </div>
                </div>
                <div class="screenshot-actions">
                    <button class="edit">Edit</button>
                    <button class="delete">Delete</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        this.panel.addEventListener('click', async (e) => {
            const item = e.target.closest('.screenshot-item');
            if (!item) return;

            const id = parseInt(item.dataset.id);

            if (e.target.classList.contains('edit')) {
                this.editScreenshot(id);
            } else if (e.target.classList.contains('delete')) {
                await this.deleteScreenshot(id);
            }
        });
    }

    async deleteScreenshot(id) {
        if (confirm('Are you sure you want to delete this screenshot?')) {
            await this.manager.deleteScreenshot(id);
            await this.render();
        }
    }

    editScreenshot(id) {
        const screenshot = this.manager.getScreenshot(id);
        if (screenshot) {
            // Open screenshot in editor
            chrome.runtime.sendMessage({
                action: 'editScreenshot',
                screenshot
            });
        }
    }
} 