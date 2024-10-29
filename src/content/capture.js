// Function to capture full page
function captureFullPage() {
    console.log('Capturing full page...');
    return new Promise(async (resolve) => {
        try {
            // Get full page dimensions
            const fullHeight = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
            );
            const fullWidth = Math.max(
                document.documentElement.scrollWidth,
                document.body.scrollWidth
            );

            // Save original scroll position
            const originalScrollPos = window.scrollY;

            // Scroll to top
            window.scrollTo(0, 0);

            // Capture the visible viewport
            const capture = await chrome.tabs.captureVisibleTab(null, {
                format: 'png'
            });

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = fullWidth;
            canvas.height = fullHeight;

            // Create image from capture
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                
                // Convert to data URL and download
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `fullpage-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();

                // Restore scroll position
                window.scrollTo(0, originalScrollPos);
                resolve();
            };
            img.src = capture;

        } catch (error) {
            console.error('Error capturing full page:', error);
            resolve();
        }
    });
}

// Function to initialize selection capture
function initializeSelectionCapture() {
    console.log('Initializing selection capture...');
    
    // Create selection overlay
    const overlay = document.createElement('div');
    overlay.id = 'capture-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        z-index: 999999;
        cursor: crosshair;
    `;

    let startX, startY, isDrawing = false;
    let selection = document.createElement('div');
    selection.style.cssText = `
        position: fixed;
        border: 2px solid #1a73e8;
        background: rgba(26, 115, 232, 0.1);
        pointer-events: none;
    `;

    overlay.addEventListener('mousedown', (e) => {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;
        selection.style.left = startX + 'px';
        selection.style.top = startY + 'px';
        document.body.appendChild(selection);
    });

    overlay.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        
        const width = e.clientX - startX;
        const height = e.clientY - startY;
        
        selection.style.width = Math.abs(width) + 'px';
        selection.style.height = Math.abs(height) + 'px';
        selection.style.left = (width < 0 ? e.clientX : startX) + 'px';
        selection.style.top = (height < 0 ? e.clientY : startY) + 'px';
    });

    overlay.addEventListener('mouseup', async (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Get selection coordinates
        const rect = selection.getBoundingClientRect();
        
        try {
            const capture = await chrome.tabs.captureVisibleTab(null, {
                format: 'png'
            });

            // Create canvas for cropping
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = rect.width;
                canvas.height = rect.height;
                
                // Crop the image
                ctx.drawImage(img,
                    rect.left, rect.top, rect.width, rect.height,
                    0, 0, rect.width, rect.height
                );

                // Download the cropped image
                const link = document.createElement('a');
                link.download = `selection-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            };
            
            img.src = capture;
        } catch (error) {
            console.error('Failed to capture selection:', error);
        }

        // Clean up
        document.body.removeChild(overlay);
        document.body.removeChild(selection);
    });

    document.body.appendChild(overlay);
}
