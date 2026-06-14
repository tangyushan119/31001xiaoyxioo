export class BeachRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.innerRadius = 0;
        this.outerRadius = 0;
        this.sandTexture = null;
        this.generateSandTexture();
    }

    updateDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
    }

    generateSandTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const baseColors = [
            { r: 230, g: 210, b: 175 },
            { r: 220, g: 200, b: 165 },
            { r: 240, g: 220, b: 185 },
            { r: 215, g: 195, b: 160 },
            { r: 235, g: 215, b: 180 },
        ];
        
        for (let i = 0; i < 64; i += 2) {
            for (let j = 0; j < 64; j += 2) {
                const color = baseColors[Math.floor(Math.random() * baseColors.length)];
                const variance = Math.random() * 15 - 7;
                ctx.fillStyle = `rgb(${Math.max(180, Math.min(255, color.r + variance))}, ${Math.max(160, Math.min(230, color.g + variance))}, ${Math.max(120, Math.min(190, color.b + variance))})`;
                ctx.fillRect(i, j, 2 + Math.random() * 2, 2 + Math.random() * 2);
            }
        }
        
        this.sandTexture = canvas;
    }

    setRadiusRange(innerRadius, outerRadius) {
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
    }

    render() {
        this.drawBeach();
        this.drawSandTexture();
        this.drawShoreline();
    }

    drawBeach() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.innerRadius,
            this.centerX, this.centerY, this.outerRadius
        );
        
        gradient.addColorStop(0, '#e8d5b7');
        gradient.addColorStop(0.25, '#dfc9a8');
        gradient.addColorStop(0.5, '#d4bc9a');
        gradient.addColorStop(0.75, '#c9af8c');
        gradient.addColorStop(1, '#bfa27e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, Math.PI * 2, true);
        this.ctx.fill();
    }

    drawSandTexture() {
        if (!this.sandTexture) return;
        
        this.ctx.save();
        
        const pattern = this.ctx.createPattern(this.sandTexture, 'repeat');
        this.ctx.fillStyle = pattern;
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, Math.PI * 2, true);
        this.ctx.clip();
        
        const offsetX = (this.centerX % 64) - 64;
        const offsetY = (this.centerY % 64) - 64;
        
        this.ctx.globalAlpha = 0.15;
        this.ctx.fillRect(offsetX, offsetY, this.renderer.width + 128, this.renderer.height + 128);
        
        this.ctx.restore();
    }

    drawShoreline() {
        this.ctx.save();
        
        this.ctx.strokeStyle = 'rgba(200, 185, 160, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
            const waveOffset = Math.sin(angle * 15) * 3 + Math.sin(angle * 25 + 1) * 2;
            const x = this.centerX + Math.cos(angle) * (this.innerRadius + waveOffset);
            const y = this.centerY + Math.sin(angle) * (this.innerRadius + waveOffset);
            
            if (angle === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(180, 165, 145, 0.3)';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        
        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
            const waveOffset = Math.sin(angle * 12 + 0.5) * 5 + Math.sin(angle * 20) * 3;
            const x = this.centerX + Math.cos(angle) * (this.innerRadius + 5 + waveOffset);
            const y = this.centerY + Math.sin(angle) * (this.innerRadius + 5 + waveOffset);
            
            if (angle === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    isOnBeach(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance >= this.innerRadius && distance < this.outerRadius;
    }

    getCoordinateRange() {
        return {
            type: 'beach',
            minRadius: this.innerRadius,
            maxRadius: this.outerRadius,
            center: { x: this.centerX, y: this.centerY }
        };
    }
}