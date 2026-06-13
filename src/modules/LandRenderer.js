export class LandRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.landRadius = 0;
    }

    updateDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
    }

    setLandRadius(radius) {
        this.landRadius = radius;
    }

    init() {
    }

    render() {
        this.drawLand();
    }

    drawLand() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.landRadius
        );
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(0.6, '#27ae60');
        gradient.addColorStop(1, '#1e8449');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.landRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    isOnLand(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance < this.landRadius;
    }

    getCoordinateRange() {
        return {
            type: 'land',
            minRadius: 0,
            maxRadius: this.landRadius,
            center: { x: this.centerX, y: this.centerY }
        };
    }
}