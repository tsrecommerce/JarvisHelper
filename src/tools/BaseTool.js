export class BaseTool {
    constructor(ctx) {
        this.ctx = ctx;
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
    }

    onStart(x, y) {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
    }

    onMove(x, y) {
        // Override in child classes
    }

    onEnd(x, y) {
        this.isDrawing = false;
    }

    setColor(color) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
    }

    setLineWidth(width) {
        this.ctx.lineWidth = width;
    }
}

export class PenTool extends BaseTool {
    onStart(x, y) {
        super.onStart(x, y);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    onMove(x, y) {
        if (!this.isDrawing) return;
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
}

export class ArrowTool extends BaseTool {
    onMove(x, y) {
        if (!this.isDrawing) return;
        
        // Clear previous drawing
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // Draw arrow line
        const angle = Math.atan2(y - this.startY, x - this.startX);
        const headlen = 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6),
                       y - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6),
                       y - headlen * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }
}

export class TextTool extends BaseTool {
    onEnd(x, y) {
        super.onEnd(x, y);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-input';
        input.style.position = 'absolute';
        input.style.left = `${x}px`;
        input.style.top = `${y}px`;
        
        document.body.appendChild(input);
        input.focus();
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = input.value;
                this.ctx.font = '16px Arial';
                this.ctx.fillText(text, x, y);
                input.remove();
            }
        });
    }
}

export class BlurTool extends BaseTool {
    onMove(x, y) {
        if (!this.isDrawing) return;
        
        const radius = this.ctx.lineWidth * 5;
        this.ctx.save();
        this.ctx.filter = 'blur(5px)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
} 