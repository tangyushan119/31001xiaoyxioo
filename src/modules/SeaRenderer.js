export class SeaRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.seaRadius = 0;
        this.maxRadius = 0;
    }

    updateDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
        this.maxRadius = Math.max(this.renderer.width, this.renderer.height);
    }

    setSeaRadius(radius) {
        this.seaRadius = radius;
    }

    render() {
        this.drawSea();
    }

    drawSea() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.seaRadius,
            this.centerX, this.centerY, this.maxRadius
        );
        gradient.addColorStop(0, '#4a9eff');
        gradient.addColorStop(0.3, '#3498db');
        gradient.addColorStop(0.6, '#2980b9');
        gradient.addColorStop(1, '#1a5276');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
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