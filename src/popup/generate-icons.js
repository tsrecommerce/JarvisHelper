// Run this script once to generate placeholder icons
const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 48, 128];

sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw a simple icon
    ctx.fillStyle = '#4285f4';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();

    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon${size}.png`, buffer);
});