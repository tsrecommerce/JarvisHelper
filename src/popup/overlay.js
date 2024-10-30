class ScreenCaptureOverlay {
    constructor() {
        this.canvas = document.getElementById('capture-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = null;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.screenshot = null;
        
        // Set canvas size to window size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.setupEventListeners();
        this.loadScreenshot();
    }

    async loadScreenshot() {
        // Get screenshot from background script
        const response = await chrome.runtime.sendMessage({ action: 'getScreenshot' });
        if (response.screenshot) {
            const img = new Image();
            img.onload = () => {
                this.screenshot = img;
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = response.screenshot;
        }
    }

    setupEventListeners() {
        // Close button
        document.getElementById('close-overlay').addEventListener('click', () => {
            this.close();
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveTool(btn.id);
            });
        });

        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));

        // Save and cancel buttons
        document.getElementById('save-screenshot').addEventListener('click', () => {
            this.saveScreenshot();
        });

        document.getElementById('cancel-screenshot').addEventListener('click', () => {
            this.close();
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key === 'Enter' && e.ctrlKey) this.saveScreenshot();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.screenshot) {
                this.ctx.drawImage(this.screenshot, 0, 0);
            }
        });
    }

    setActiveTool(toolId) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(toolId).classList.add('active');
        this.currentTool = toolId;
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.clientX, e.clientY);
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        switch(this.currentTool) {
            case 'freehand-tool':
                this.drawFreehand(e);
                break;
            case 'text-tool':
                this.addText(e);
                break;
            case 'arrow-tool':
                this.drawArrow(e);
                break;
            case 'sticker-tool':
                this.addSticker(e);
                break;
        }
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    async saveScreenshot() {
        const dataUrl = this.canvas.toDataURL();
        const notes = document.getElementById('text-input').value;
        
        // Send to background script to save
        chrome.runtime.sendMessage({
            action: 'saveScreenshot',
            screenshot: dataUrl,
            notes: notes
        });

        this.close();
    }

    close() {
        window.close();
    }

    // Drawing Tools Implementation
    drawFreehand(e) {
        this.ctx.lineTo(e.clientX, e.clientY);
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    addText(e) {
        if (!this.isDrawing) return;
        const text = document.getElementById('text-input').value;
        if (!text) return;

        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillText(text, e.clientX, e.clientY);
        this.isDrawing = false;
    }

    drawArrow(e) {
        if (!this.isDrawing) return;
        
        // Clear previous drawing
        if (this.screenshot) {
            this.ctx.drawImage(this.screenshot, 0, 0);
        }

        const headlen = 10;
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        const angle = Math.atan2(dy, dx);

        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(e.clientX, e.clientY);
        this.ctx.lineTo(e.clientX - headlen * Math.cos(angle - Math.PI / 6), 
                       e.clientY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(e.clientX, e.clientY);
        this.ctx.lineTo(e.clientX - headlen * Math.cos(angle + Math.PI / 6),
                       e.clientY - headlen * Math.sin(angle + Math.PI / 6));
        
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    async addSticker(e) {
        if (!this.isDrawing) return;
        
        const stickers = {
            bug: '../assets/stickers/bug.png',
            idea: '../assets/stickers/idea.png',
            warning: '../assets/stickers/warning.png'
        };

        // Show sticker picker
        const sticker = await this.showStickerPicker();
        if (sticker && stickers[sticker]) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, e.clientX - 15, e.clientY - 15, 30, 30);
            };
            img.src = stickers[sticker];
        }
        
        this.isDrawing = false;
    }

    showStickerPicker() {
        return new Promise((resolve) => {
            const picker = document.createElement('div');
            picker.className = 'sticker-picker';
            picker.innerHTML = `
                <button data-sticker="bug">🐛</button>
                <button data-sticker="idea">💡</button>
                <button data-sticker="warning">⚠️</button>
            `;
            
            picker.style.position = 'absolute';
            picker.style.left = `${event.clientX}px`;
            picker.style.top = `${event.clientY}px`;
            
            picker.addEventListener('click', (e) => {
                const sticker = e.target.dataset.sticker;
                picker.remove();
                resolve(sticker);
            });
            
            document.body.appendChild(picker);
        });
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ScreenCaptureOverlay();
}); 