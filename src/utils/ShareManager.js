export class ShareManager {
    constructor(canvas) {
        this.canvas = canvas;
    }

    async shareImage() {
        try {
            const blob = await this.getCanvasBlob();
            if (navigator.share) {
                await navigator.share({
                    files: [new File([blob], 'screenshot.png', { type: 'image/png' })]
                });
                return true;
            } else {
                // Fallback to download
                this.downloadImage();
            }
        } catch (error) {
            console.error('Error sharing:', error);
            throw error;
        }
    }

    downloadImage(filename = 'screenshot.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    async copyToClipboard() {
        try {
            const blob = await this.getCanvasBlob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            throw error;
        }
    }

    private async getCanvasBlob() {
        return new Promise(resolve => {
            this.canvas.toBlob(resolve, 'image/png');
        });
    }
} 