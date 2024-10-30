class SelectionTool {
    constructor() {
        this.selection = document.createElement('div');
        this.selection.className = 'screenshot-selection';
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
        
        this.setupStyles();
        this.setupEventListeners();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .screenshot-selection {
                position: fixed;
                border: 2px solid #4285f4;
                background: rgba(66, 133, 244, 0.1);
                z-index: 99999;
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        document.addEventListener('mousedown', this.startSelection.bind(this));
        document.addEventListener('mousemove', this.updateSelection.bind(this));
        document.addEventListener('mouseup', this.endSelection.bind(this));
    }

    startSelection(e) {
        this.isSelecting = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        this.selection.style.left = `${this.startX}px`;
        this.selection.style.top = `${this.startY}px`;
        this.selection.style.display = 'block';
        
        document.body.appendChild(this.selection);
    }

    updateSelection(e) {
        if (!this.isSelecting) return;
        
        const width = e.clientX - this.startX;
        const height = e.clientY - this.startY;
        
        this.selection.style.width = `${Math.abs(width)}px`;
        this.selection.style.height = `${Math.abs(height)}px`;
        this.selection.style.left = `${width > 0 ? this.startX : e.clientX}px`;
        this.selection.style.top = `${height > 0 ? this.startY : e.clientY}px`;
    }

    async endSelection(e) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        
        // Capture the selected area
        const bounds = this.selection.getBoundingClientRect();
        const screenshot = await chrome.runtime.sendMessage({
            action: 'captureVisibleTab',
            area: {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            }
        });
        
        // Clean up
        this.selection.remove();
        
        // Open overlay
        chrome.runtime.sendMessage({
            action: 'openOverlay',
            screenshot: screenshot
        });
    }
}

new SelectionTool(); 