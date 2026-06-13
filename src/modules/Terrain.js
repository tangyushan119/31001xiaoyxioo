export class Terrain {
    constructor(renderer) {
        this.renderer = renderer;
        this.canvas = renderer.canvas;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        this.islandRadius = 250;
        this.grassRadius = 220;
        this.beachWidth = 30;
    }

    init() {
        this.generateTerrain();
    }

    generateTerrain() {
        this.seaColor = '#4a9eff';
        this.beachColor = '#f4d03f';
        this.grassColor = '#2ecc71';
        this.darkGrassColor = '#27ae60';
    }

    drawSea() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.islandRadius + 50,
            this.centerX, this.centerY, this.renderer.width
        );
        gradient.addColorStop(0, '#5dade2');
        gradient.addColorStop(0.5, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.renderer.width, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawIsland() {
        this.drawBeach();
        this.drawGrass();
        this.addIslandDetails();
    }

    drawBeach() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.islandRadius - this.beachWidth,
            this.centerX, this.centerY, this.islandRadius
        );
        gradient.addColorStop(0, '#f5deb3');
        gradient.addColorStop(1, '#f4d03f');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.islandRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGrass() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.grassRadius
        );
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(0.7, '#27ae60');
        gradient.addColorStop(1, '#1e8449');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.grassRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    addIslandDetails() {
        this.drawTrees();
        this.drawRocks();
    }

    drawTrees() {
        const treePositions = [
            { x: this.centerX - 80, y: this.centerY - 60 },
            { x: this.centerX + 70, y: this.centerY - 50 },
            { x: this.centerX - 50, y: this.centerY + 70 },
            { x: this.centerX + 60, y: this.centerY + 50 }
        ];

        treePositions.forEach(pos => {
            if (this.isOnGrass(pos.x, pos.y)) {
                this.ctx.fillStyle = '#8b4513';
                this.ctx.fillRect(pos.x - 8, pos.y + 15, 16, 25);
                
                this.ctx.fillStyle = '#2d5a27';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y - 10, 25, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#228b22';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y - 25, 18, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawRocks() {
        const rockPositions = [
            { x: this.centerX - 100, y: this.centerY + 30 },
            { x: this.centerX + 90, y: this.centerY + 60 },
            { x: this.centerX + 20, y: this.centerY - 80 }
        ];

        rockPositions.forEach(pos => {
            if (this.isOnGrass(pos.x, pos.y)) {
                this.ctx.fillStyle = '#7f8c8d';
                this.ctx.beginPath();
                this.ctx.ellipse(pos.x, pos.y, 15, 10, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#95a5a6';
                this.ctx.beginPath();
                this.ctx.ellipse(pos.x - 5, pos.y - 3, 8, 6, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    isOnGrass(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance < this.grassRadius;
    }

    isOnIsland(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance < this.islandRadius;
    }

    canBuildAt(x, y) {
        return this.isOnGrass(x, y);
    }

    render() {
        this.drawSea();
        this.drawIsland();
    }

    getIslandCenter() {
        return { x: this.centerX, y: this.centerY };
    }

    getIslandRadius() {
        return this.islandRadius;
    }

    getGrassRadius() {
        return this.grassRadius;
    }
}