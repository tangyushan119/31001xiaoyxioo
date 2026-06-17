export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.isLoaded = true;
        this.setupResizeListener();
    }

    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.resizeToFit();
            if (this.onResize) {
                this.onResize();
            }
        });
    }

    resizeToFit() {
        const container = this.canvas.parentElement;
        const padding = 250;
        this.width = container.clientWidth - padding;
        this.height = container.clientHeight;

        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    clear(color = '#0a1628') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }

    drawStrokeRect(x, y, width, height, color, lineWidth = 1, dashArray = []) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        if (dashArray.length > 0) {
            this.ctx.setLineDash(dashArray);
        }
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
    }

    drawText(text, x, y, color = '#ffffff', fontSize = 16) {
        this.ctx.save();
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawTextLeft(text, x, y, color = '#ffffff', fontSize = 16) {
        this.ctx.save();
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawTextRight(text, x, y, color = '#ffffff', fontSize = 16) {
        this.ctx.save();
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawImage(img, x, y, width, height) {
        if (img && img.complete) {
            this.ctx.drawImage(img, x, y, width, height);
        }
    }

    drawPattern(patternCanvas, x, y, width, height) {
        if (patternCanvas) {
            const pattern = this.ctx.createPattern(patternCanvas, 'repeat');
            this.ctx.fillStyle = pattern;
            this.ctx.fillRect(x, y, width, height);
        }
    }

    drawEmoji(emoji, x, y, size, options = {}) {
        this.ctx.save();
        
        if (options.globalAlpha !== undefined) {
            this.ctx.globalAlpha = options.globalAlpha;
        }
        
        if (options.shadowColor && options.shadowBlur) {
            this.ctx.shadowColor = options.shadowColor;
            this.ctx.shadowBlur = options.shadowBlur;
        }

        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, x, y);

        this.ctx.restore();
    }

    drawHealthBar(x, y, width, height, health, maxHealth) {
        const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(x, y, width, height);

        const gradient = this.ctx.createLinearGradient(x, y, x + width, y);
        if (healthPercent > 0.6) {
            gradient.addColorStop(0, '#22c55e');
            gradient.addColorStop(1, '#4ade80');
        } else if (healthPercent > 0.3) {
            gradient.addColorStop(0, '#eab308');
            gradient.addColorStop(1, '#facc15');
        } else {
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(1, '#f87171');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width * healthPercent, height);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }

    drawGrid(gridSize = 40) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawPreviewRect(x, y, size, canBuild) {
        this.ctx.save();
        this.ctx.globalAlpha = canBuild ? 0.7 : 0.4;

        const halfSize = size / 2;
        this.ctx.strokeStyle = canBuild ? '#4ade80' : '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x - halfSize, y - halfSize, size, size);
        this.ctx.setLineDash([]);

        if (canBuild) {
            this.ctx.shadowColor = '#4ade80';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowColor = '#ef4444';
            this.ctx.shadowBlur = 10;
        }

        this.ctx.restore();
    }

    drawGradientRect(x, y, width, height, startColor, endColor) {
        const gradient = this.ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    isReady() {
        return this.isLoaded;
    }

    getContext() {
        return this.ctx;
    }

    createGrassPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const colors = ['#2ecc71', '#27ae60', '#229954', '#1e8449'];
        for (let i = 0; i < 32; i += 4) {
            for (let j = 0; j < 32; j += 4) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;
                ctx.fillRect(i, j, 4, 4);
            }
        }
        return canvas;
    }

    createWaterPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 32, 32);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(0.5, '#2980b9');
        gradient.addColorStop(1, '#2c3e50');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 32;
            const y = Math.random() * 32;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2);
            ctx.fill();
        }
        return canvas;
    }

    createBeachPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const colors = ['#f5deb3', '#f4d03f', '#f0c419', '#e6b800'];
        for (let i = 0; i < 32; i += 4) {
            for (let j = 0; j < 32; j += 4) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillStyle = color;
                ctx.fillRect(i, j, 4, 4);
            }
        }
        return canvas;
    }
}