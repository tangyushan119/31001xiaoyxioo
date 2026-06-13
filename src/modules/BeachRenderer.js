export class BeachRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.innerRadius = 0;
        this.outerRadius = 0;
    }

    updateDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
    }

    setRadiusRange(innerRadius, outerRadius) {
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
    }

    render() {
        this.drawBeach();
    }

    drawBeach() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.innerRadius,
            this.centerX, this.centerY, this.outerRadius
        );
        gradient.addColorStop(0, '#f5deb3');
        gradient.addColorStop(0.5, '#f4d03f');
        gradient.addColorStop(1, '#e6c830');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#0a1628';
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, Math.PI * 2);
        this.ctx.fill();
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