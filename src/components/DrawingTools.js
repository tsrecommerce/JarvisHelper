export class DrawingTools {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentTool = null;
        this.color = '#ff0000';
        this.lineWidth = 2;
        this.history = [];
        this.historyIndex = -1;
        
        this.tools = {
            pen: new PenTool(this.ctx),
            arrow: new ArrowTool(this.ctx),
            rectangle: new RectangleTool(this.ctx),
            circle: new CircleTool(this.ctx),
            text: new TextTool(this.ctx),
            sticker: new StickerTool(this.ctx),
            blur: new BlurTool(this.ctx),
            highlight: new HighlightTool(this.ctx)
        };

        this.setupToolbar();
        this.setupShortcuts();
    }

    setupToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'drawing-toolbar';
        toolbar.innerHTML = `
            <div class="tool-group">
                <button data-tool="pen" class="tool-btn active">
                    <img src="../assets/pen.svg" alt="Pen" />
                </button>
                <button data-tool="arrow" class="tool-btn">
                    <img src="../assets/arrow.svg" alt="Arrow" />
                </button>
                <button data-tool="rectangle" class="tool-btn">
                    <img src="../assets/rectangle.svg" alt="Rectangle" />
                </button>
                <button data-tool="circle" class="tool-btn">
                    <img src="../assets/circle.svg" alt="Circle" />
                </button>
                <button data-tool="text" class="tool-btn">
                    <img src="../assets/text.svg" alt="Text" />
                </button>
                <button data-tool="sticker" class="tool-btn">
                    <img src="../assets/sticker.svg" alt="Sticker" />
                </button>
                <button data-tool="blur" class="tool-btn">
                    <img src="../assets/blur.svg" alt="Blur" />
                </button>
                <button data-tool="highlight" class="tool-btn">
                    <img src="../assets/highlight.svg" alt="Highlight" />
                </button>
            </div>
            <div class="tool-settings">
                <div class="color-picker">
                    <button class="color-btn active" data-color="#ff0000" style="background: #ff0000;"></button>
                    <button class="color-btn" data-color="#00ff00" style="background: #00ff00;"></button>
                    <button class="color-btn" data-color="#0000ff" style="background: #0000ff;"></button>
                    <button class="color-btn" data-color="#ffff00" style="background: #ffff00;"></button>
                    <button class="color-btn" data-color="#ff00ff" style="background: #ff00ff;"></button>
                    <button class="color-btn" data-color="#00ffff" style="background: #00ffff;"></button>
                </div>
                <div class="size-picker">
                    <input type="range" min="1" max="20" value="2" class="size-slider" />
                </div>
            </div>
            <div class="history-controls">
                <button id="undo-btn" disabled>Undo</button>
                <button id="redo-btn" disabled>Redo</button>
            </div>
        `;
        
        document.body.appendChild(toolbar);
        this.setupToolbarListeners();
    }

    setupToolbarListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTool(btn.dataset.tool);
            });
        });

        // Color selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setColor(btn.dataset.color);
            });
        });

        // Line width
        document.querySelector('.size-slider').addEventListener('input', (e) => {
            this.setLineWidth(e.target.value);
        });

        // History controls
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
    }

    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                }
            }
        });
    }

    // ... continuing in next message due to length
} 