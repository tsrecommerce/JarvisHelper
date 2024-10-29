// Check if CaptureOverlay already exists to prevent redefinition
if (typeof window.JarvisHelper === 'undefined') {
    window.JarvisHelper = {};

    window.JarvisHelper.CaptureOverlay = class CaptureOverlay {
        constructor() {
            this.startX = 0;
            this.startY = 0;
            this.isDrawing = false;
            this.overlay = null;
            this.selection = null;
        }

        init() {
            // Remove existing overlay if present
            const existingOverlay = document.getElementById('jarvis-capture-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            this.createOverlay();
            this.bindEvents();
        }

        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.id = 'jarvis-capture-overlay';
            
            this.selection = document.createElement('div');
            this.selection.id = 'jarvis-selection';
            
            this.overlay.appendChild(this.selection);
            document.body.appendChild(this.overlay);
        }

        bindEvents() {
            this.overlay.addEventListener('mousedown', this.startSelection.bind(this));
            this.overlay.addEventListener('mousemove', this.updateSelection.bind(this));
            this.overlay.addEventListener('mouseup', this.endSelection.bind(this));
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.cleanup();
            });
        }

        startSelection(e) {
            this.isDrawing = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.selection.style.left = `${this.startX}px`;
            this.selection.style.top = `${this.startY}px`;
        }

        updateSelection(e) {
            if (!this.isDrawing) return;

            const width = e.clientX - this.startX;
            const height = e.clientY - this.startY;

            this.selection.style.width = `${Math.abs(width)}px`;
            this.selection.style.height = `${Math.abs(height)}px`;
            this.selection.style.left = `${width > 0 ? this.startX : e.clientX}px`;
            this.selection.style.top = `${height > 0 ? this.startY : e.clientY}px`;
        }

        async endSelection() {
            if (!this.isDrawing) return;
            this.isDrawing = false;

            const bounds = this.selection.getBoundingClientRect();
            const capture = {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height,
                devicePixelRatio: window.devicePixelRatio
            };

            await chrome.runtime.sendMessage({
                action: 'captureSelection',
                bounds: capture
            });

            this.cleanup();
        }

        cleanup() {
            if (this.overlay) {
                this.overlay.remove();
            }
        }
    }

    // Initialize when message is received from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'initializeSelectiveCapture') {
            new window.JarvisHelper.CaptureOverlay().init();
            sendResponse({ success: true });
        }
    });
}