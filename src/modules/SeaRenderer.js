export class SeaRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.seaRadius = 0;
        this.maxRadius = 0;
        this.time = 0;
    }

    updateDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
        this.maxRadius = Math.max(this.renderer.width, this.renderer.height);
    }

    setSeaRadius(radius) {
        this.seaRadius = radius;
    }

    update(deltaTime) {
        this.time += deltaTime * 0.001;
    }

    render() {
        this.drawSea();
        this.drawWaveLayers();
    }

    drawSea() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.seaRadius,
            this.centerX, this.centerY, this.maxRadius
        );
        gradient.addColorStop(0, '#5a9dd9');
        gradient.addColorStop(0.3, '#3d7cb8');
        gradient.addColorStop(0.6, '#2d64a3');
        gradient.addColorStop(1, '#1a4a7a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
    }

    drawWaveLayers() {
        this.ctx.save();
        
        const waveLayers = [
            { amplitude: 8, frequency: 0.02, speed: 1.2, opacity: 0.15, blur: 4 },
            { amplitude: 6, frequency: 0.03, speed: 1.8, opacity: 0.12, blur: 3 },
            { amplitude: 4, frequency: 0.05, speed: 2.5, opacity: 0.08, blur: 2 },
            { amplitude: 3, frequency: 0.08, speed: 3.2, opacity: 0.06, blur: 1 },
        ];

        waveLayers.forEach((layer, layerIndex) => {
            this.drawWaveLayer(layer, layerIndex);
        });

        this.ctx.restore();
    }

    drawWaveLayer(layer, index) {
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.filter = `blur(${layer.blur}px)`;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.renderer.height);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8})`);
        gradient.addColorStop(0.5, `rgba(200, 230, 255, ${0.6})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        
        const startAngle = this.seaRadius / this.maxRadius * Math.PI * 2;
        
        for (let angle = startAngle; angle < Math.PI * 2; angle += 0.02) {
            const baseRadius = this.seaRadius + (angle - startAngle) / (Math.PI * 2 - startAngle) * (this.maxRadius - this.seaRadius);
            const waveOffset = Math.sin(angle * layer.frequency * 20 + this.time * layer.speed * 5 + index * 1.5) * layer.amplitude;
            const waveOffset2 = Math.sin(angle * layer.frequency * 15 + this.time * layer.speed * 3) * layer.amplitude * 0.5;
            
            const x = this.centerX + Math.cos(angle) * (baseRadius + waveOffset + waveOffset2);
            const y = this.centerY + Math.sin(angle) * (baseRadius + waveOffset + waveOffset2);
            
            if (angle === startAngle) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    isInSea(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance >= this.seaRadius;
    }

    getCoordinateRange() {
        return {
            type: 'sea',
            minRadius: this.seaRadius,
            maxRadius: this.maxRadius,
            center: { x: this.centerX, y: this.centerY }
        };
    }
}