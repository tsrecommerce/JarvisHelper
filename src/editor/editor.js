class ImageEditor {
    constructor() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'pencil';
        this.isDrawing = false;
        this.color = '#ff0000';
        this.strokeWidth = 3;
        this.undoStack = [];
        this.redoStack = [];
        this.lastX = 0;
        this.lastY = 0;
        
        this.initializeListeners();
        this.bindEvents();
    }

    initializeListeners() {
        // Listen for image data from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Received message in editor:', message); // Debug log
            if (message.action === 'loadImage' && message.captureData) {
                this.loadImage(message.captureData);
            }
        });

        // Initialize toolbar buttons
        document.getElementById('save')?.addEventListener('click', () => this.saveImage());
        document.getElementById('undo')?.addEventListener('click', () => this.undo());
        document.getElementById('redo')?.addEventListener('click', () => this.redo());
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    }

    setTool(toolName) {
        this.currentTool = toolName;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.id === toolName);
        });
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.strokeWidth;
        
        // Save the current state before starting new drawing
        this.saveState();
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch (this.currentTool) {
            case 'pencil':
                this.drawFreehand(x, y);
                break;
            case 'arrow':
                this.drawArrow(x, y);
                break;
            // ... other tools
        }
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = this.strokeWidth;
        
        // Save the current state before starting new drawing
        this.saveState();
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch (this.currentTool) {
            case 'pencil':
                this.drawFreehand(x, y);
                break;
            case 'arrow':
                this.drawArrow(x, y);
                break;
            // ... other tools
        }
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    drawFreehand(x, y) {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    drawRectangle(x, y) {
        // Implementation for rectangle drawing
    }

    drawArrow(x, y) {
        // Clear the previous drawing
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Load the last state
        if (this.undoStack.length > 0) {
            const lastState = new Image();
            lastState.onload = () => {
                this.ctx.drawImage(lastState, 0, 0);
                
                // Draw the arrow
                const startX = this.lastX;
                const startY = this.lastY;
                const endX = x;
                const endY = y;
                
                // Calculate the arrow properties
                const headLength = 20;
                const angle = Math.atan2(endY - startY, endX - startX);
                
                // Draw the main line
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                
                // Draw the arrow head
                this.ctx.beginPath();
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(
                    endX - headLength * Math.cos(angle - Math.PI / 6),
                    endY - headLength * Math.sin(angle - Math.PI / 6)
                );
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(
                    endX - headLength * Math.cos(angle + Math.PI / 6),
                    endY - headLength * Math.sin(angle + Math.PI / 6)
                );
                this.ctx.stroke();
            };
            lastState.src = this.undoStack[this.undoStack.length - 1];
        }
    }

    saveState() {
        if (this.canvas) {
            const state = this.canvas.toDataURL();
            this.undoStack.push(state);
            this.redoStack = []; // Clear redo stack when new state is saved
        }
    }

    undo() {
        if (this.undoStack.length > 0) {
            const lastState = this.undoStack.pop();
            this.redoStack.push(this.canvas.toDataURL());
            this.loadState(lastState);
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(this.canvas.toDataURL());
            this.loadState(nextState);
        }
    }

    loadState(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    loadImage(captureData) {
        console.log('Loading image with data:', captureData); // Debug log
        
        if (!captureData || !captureData.images || !captureData.images[0]) {
            console.error('Invalid capture data received');
            return;
        }

        const img = new Image();
        img.onload = () => {
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.ctx.drawImage(img, 0, 0);
            this.saveState();
        };
        img.onerror = (error) => {
            console.error('Error loading image:', error);
        };
        img.src = captureData.images[0].data;
    }

    saveImage() {
        const dataUrl = this.canvas.toDataURL('image/png');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Create download link
        const link = document.createElement('a');
        link.download = `screenshot-${timestamp}.png`;
        link.href = dataUrl;
        link.click();
    }
}

// Initialize editor when the page loads
document.getElementById('pencil').textContent = '\u270F';
document.getElementById('rectangle').textContent = '\u25FB';
document.getElementById('arrow').textContent = '\u27A1';
document.getElementById('undo').textContent = '\u21A9';
document.getElementById('redo').textContent = '\u21AA';
document.getElementById('save').textContent = '\uD83D\uDCBE';
document.addEventListener('DOMContentLoaded', () => {
    console.log('Editor initializing...'); // Debug log
    new ImageEditor();
});