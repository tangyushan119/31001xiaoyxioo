export class SeaRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.seaRadius = 0;
        this.maxRadius = Math.max(renderer.width, renderer.height);
        this.time = 0;
        this.isInitialized = false;
    }

    init() {
        this.updateDimensions();
        this.isInitialized = true;
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
        if (!this.isInitialized) {
            this.init();
        }
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
        const waveLayers = [
            { amplitude: 10, frequency: 0.015, speed: 1.0, opacity: 0.18, blur: 5 },
            { amplitude: 7, frequency: 0.025, speed: 1.5, opacity: 0.14, blur: 3 },
            { amplitude: 5, frequency: 0.04, speed: 2.0, opacity: 0.1, blur: 2 },
            { amplitude: 3, frequency: 0.06, speed: 2.8, opacity: 0.07, blur: 1 },
        ];

        waveLayers.forEach((layer, layerIndex) => {
            this.drawWaveLayer(layer, layerIndex);
        });
    }

    drawWaveLayer(layer, index) {
        this.ctx.save();
        
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.filter = `blur(${layer.blur}px)`;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.renderer.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, 'rgba(220, 240, 255, 0.7)');
        gradient.addColorStop(0.7, 'rgba(180, 220, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        
        const points = [];
        const step = 0.015;
        
        for (let angle = 0; angle <= Math.PI * 2; angle += step) {
            const baseRadius = this.seaRadius + (angle / (Math.PI * 2)) * (this.maxRadius - this.seaRadius) * 0.6;
            const waveOffset = Math.sin(angle * layer.frequency * 25 + this.time * layer.speed * 4 + index * 2) * layer.amplitude;
            const waveOffset2 = Math.sin(angle * layer.frequency * 18 + this.time * layer.speed * 2.5 + index) * layer.amplitude * 0.6;
            
            const x = this.centerX + Math.cos(angle) * (baseRadius + waveOffset + waveOffset2);
            const y = this.centerY + Math.sin(angle) * (baseRadius + waveOffset + waveOffset2);
            
            points.push({ x, y });
        }
        
        if (points.length > 0) {
            this.ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
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