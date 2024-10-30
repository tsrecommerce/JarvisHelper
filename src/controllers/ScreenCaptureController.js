import { DrawingTools } from '../components/DrawingTools.js';
import { ScreenshotsPanel } from '../components/ScreenshotsPanel.js';
import { HistoryManager } from '../utils/HistoryManager.js';
import { NotificationManager } from '../utils/Notifications.js';
import { ShareManager } from '../utils/ShareManager.js';
import { ScreenshotManager } from '../models/ScreenshotManager.js';

export class ScreenCaptureController {
    constructor() {
        this.setupCanvas();
        this.initializeComponents();
        this.setupEventListeners();
        this.loadInitialScreenshot();
    }

    setupCanvas() {
        this.canvas = document.getElementById('capture-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initializeComponents() {
        // Initialize all managers and tools
        this.notificationManager = new NotificationManager();
        this.historyManager = new HistoryManager(this.canvas);
        this.screenshotManager = new ScreenshotManager();
        this.shareManager = new ShareManager(this.canvas);
        this.drawingTools = new DrawingTools(this.canvas);
        
        // Initialize screenshots panel
        this.screenshotsPanel = new ScreenshotsPanel(this.screenshotManager);
        document.body.appendChild(this.screenshotsPanel.panel);
    }

    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // Canvas drawing events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Toolbar action handlers
        document.getElementById('save-btn').addEventListener('click', () => this.saveScreenshot());
        document.getElementById('share-btn').addEventListener('click', () => this.shareScreenshot());
        document.getElementById('copy-btn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('close-btn').addEventListener('click', () => this.close());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    async loadInitialScreenshot() {
        try {
            // Get screenshot data from background script
            const response = await chrome.runtime.sendMessage({ action: 'getScreenshot' });
            if (response.screenshot) {
                await this.loadScreenshot(response.screenshot);
                this.historyManager.saveState();
                this.notificationManager.info('Screenshot loaded');
            }
        } catch (error) {
            this.notificationManager.error('Failed to load screenshot');
            console.error('Error loading screenshot:', error);
        }
    }

    async loadScreenshot(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
                resolve();
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.drawingTools.getCurrentTool().onStart(x, y);
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.drawingTools.getCurrentTool().onMove(x, y);
    }

    handleMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.drawingTools.getCurrentTool().onEnd(x, y);
        this.historyManager.saveState();
    }

    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveScreenshot();
                    break;
                case 'c':
                    e.preventDefault();
                    this.copyToClipboard();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.historyManager.redo();
                    } else {
                        this.historyManager.undo();
                    }
                    break;
            }
        } else if (e.key === 'Escape') {
            this.close();
        }
    }

    async saveScreenshot() {
        try {
            const dataUrl = this.canvas.toDataURL();
            const notes = document.getElementById('notes-input').value;
            await this.screenshotManager.saveScreenshot({
                image: dataUrl,
                notes: notes,
                date: new Date().toISOString()
            });
            this.notificationManager.success('Screenshot saved');
            this.screenshotsPanel.render();
        } catch (error) {
            this.notificationManager.error('Failed to save screenshot');
            console.error('Error saving screenshot:', error);
        }
    }

    async shareScreenshot() {
        try {
            await this.shareManager.shareImage();
            this.notificationManager.success('Screenshot shared');
        } catch (error) {
            this.notificationManager.error('Failed to share screenshot');
            console.error('Error sharing screenshot:', error);
        }
    }

    async copyToClipboard() {
        try {
            await this.shareManager.copyToClipboard();
            this.notificationManager.success('Copied to clipboard');
        } catch (error) {
            this.notificationManager.error('Failed to copy to clipboard');
            console.error('Error copying to clipboard:', error);
        }
    }

    resizeCanvas() {
        // Save current content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCanvas.getContext('2d').drawImage(this.canvas, 0, 0);

        // Resize canvas
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Restore content
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    close() {
        // Send message to close overlay
        chrome.runtime.sendMessage({ action: 'closeOverlay' });
    }
} 