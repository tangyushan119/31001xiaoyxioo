export class Terrain {
    constructor(renderer) {
        this.renderer = renderer;
        this.canvas = renderer.canvas;
        this.ctx = renderer.ctx;
        this.centerX = renderer.width / 2;
        this.centerY = renderer.height / 2;
        
        this.updateIslandDimensions();
    }

    updateIslandDimensions() {
        this.centerX = this.renderer.width / 2;
        this.centerY = this.renderer.height / 2;
        
        const minDimension = Math.min(this.renderer.width, this.renderer.height);
        this.islandRadius = Math.floor(minDimension * 0.38);
        this.grassRadius = Math.floor(this.islandRadius * 0.9);
        this.beachWidth = Math.floor(this.islandRadius * 0.1);
    }

    updateDimensions() {
        this.updateIslandDimensions();
    }

    init() {
        this.generateTerrain();
    }

    generateTerrain() {
        this.seaColor = '#4a9eff';
        this.beachColor = '#f4d03f';
        this.grassColor = '#2ecc71';
        this.darkGrassColor = '#27ae60';
        
        this.trees = this.generateTreePositions();
        this.rocks = this.generateRockPositions();
    }

    generateTreePositions() {
        const positions = [];
        const count = Math.floor(Math.random() * 3) + 4;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const radius = Math.random() * (this.grassRadius * 0.6) + 20;
            positions.push({
                x: this.centerX + Math.cos(angle) * radius,
                y: this.centerY + Math.sin(angle) * radius,
                size: Math.random() * 15 + 25
            });
        }
        return positions;
    }

    generateRockPositions() {
        const positions = [];
        const count = Math.floor(Math.random() * 2) + 3;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const radius = Math.random() * (this.grassRadius * 0.7) + 30;
            positions.push({
                x: this.centerX + Math.cos(angle) * radius,
                y: this.centerY + Math.sin(angle) * radius,
                size: Math.random() * 10 + 15
            });
        }
        return positions;
    }

    render() {
        this.drawSea();
        this.drawIsland();
    }

    drawSea() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.islandRadius + 50,
            this.centerX, this.centerY, Math.max(this.renderer.width, this.renderer.height)
        );
        gradient.addColorStop(0, '#5dade2');
        gradient.addColorStop(0.4, '#3498db');
        gradient.addColorStop(0.7, '#2980b9');
        gradient.addColorStop(1, '#1a5276');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, Math.max(this.renderer.width, this.renderer.height), 0, Math.PI * 2);
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
        gradient.addColorStop(0.5, '#f4d03f');
        gradient.addColorStop(1, '#e6c830');
        
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
        gradient.addColorStop(0.6, '#27ae60');
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
        this.trees.forEach(tree => {
            if (this.isOnGrass(tree.x, tree.y)) {
                this.drawTree(tree.x, tree.y, tree.size);
            }
        });
    }

    drawTree(x, y, size) {
        const trunkWidth = size * 0.15;
        const trunkHeight = size * 0.6;
        
        this.ctx.fillStyle = '#8b4513';
        this.ctx.fillRect(x - trunkWidth / 2, y + size * 0.2, trunkWidth, trunkHeight);
        
        this.ctx.fillStyle = '#2d5a27';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.1, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#228b22';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.4, size * 0.45, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#32cd32';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.6, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawRocks() {
        this.rocks.forEach(rock => {
            if (this.isOnGrass(rock.x, rock.y)) {
                this.drawRock(rock.x, rock.y, rock.size);
            }
        });
    }

    drawRock(x, y, size) {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size, size * 0.7, Math.random() * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.beginPath();
        this.ctx.ellipse(x - size * 0.3, y - size * 0.2, size * 0.5, size * 0.4, Math.random() * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    isOnGrass(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance < this.grassRadius;
    }

    isOnIsland(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance < this.islandRadius;
    }

    isOnBeach(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance >= this.grassRadius && distance < this.islandRadius;
    }

    isOnWater(x, y) {
        const distance = Math.sqrt(Math.pow(x - this.centerX, 2) + Math.pow(y - this.centerY, 2));
        return distance >= this.islandRadius;
    }

    canBuildAt(x, y) {
        return this.isOnGrass(x, y);
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

    getTerrainType(x, y) {
        if (this.isOnGrass(x, y)) return 'grass';
        if (this.isOnBeach(x, y)) return 'beach';
        return 'water';
    }
}