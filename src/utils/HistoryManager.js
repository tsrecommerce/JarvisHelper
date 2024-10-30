export class HistoryManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.states = [];
        this.currentIndex = -1;
        this.maxStates = 50;
    }

    saveState() {
        // Remove any states after current index
        this.states = this.states.slice(0, this.currentIndex + 1);
        
        // Add new state
        this.states.push(this.canvas.toDataURL());
        
        // Remove oldest state if exceeding max
        if (this.states.length > this.maxStates) {
            this.states.shift();
        }
        
        this.currentIndex = this.states.length - 1;
        this.updateButtons();
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadState(this.states[this.currentIndex]);
        }
        this.updateButtons();
    }

    redo() {
        if (this.currentIndex < this.states.length - 1) {
            this.currentIndex++;
            this.loadState(this.states[this.currentIndex]);
        }
        this.updateButtons();
    }

    loadState(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    updateButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        undoBtn.disabled = this.currentIndex <= 0;
        redoBtn.disabled = this.currentIndex >= this.states.length - 1;
    }
} 